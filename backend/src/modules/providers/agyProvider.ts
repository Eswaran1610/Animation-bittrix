import { AIProvider, ResearchAndScriptRequest, ResearchAndScriptResult, AnimationCodeRequest, AnimationCodeResult, TokenUsage } from './providerAdapter.js';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { projectPaths } from '../../config/paths.js';
import { StyleProfile } from '../../types/index.js';

const execFileAsync = promisify(execFile);

const relativeLuminance = (hex: string) => {
  const channels = [0, 1, 2].map((index) => parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16) / 255);
  const linear = channels.map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
};

const contrastRatio = (foreground: string, background: string) => {
  const light = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const dark = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (light + 0.05) / (dark + 0.05);
};

export class AGYProvider implements AIProvider {
  name = 'agy';

  private requestedDurationSec(input: ResearchAndScriptRequest): number | undefined {
    const match = `${input.topicOrContent} ${input.changeRequestFeedback || ''}`.match(/\b(\d{1,3})\s*(?:s|sec|secs|second|seconds)\b/i);
    const seconds = match ? Number(match[1]) : undefined;
    return seconds && seconds >= 25 && seconds <= 40 ? seconds : undefined;
  }

  private requiresImportedImage(input: ResearchAndScriptRequest): boolean {
    return /\bimages?\b|import(?:ed|\s+an?)?\s+image/i.test(`${input.topicOrContent} ${input.changeRequestFeedback || ''}`);
  }

  private isWebsiteVisit(input: ResearchAndScriptRequest): boolean {
    return /website|web\s+site|visit\s+(?:the\s+)?(?:site|website)|https?:\/\//i.test(`${input.topicOrContent} ${input.changeRequestFeedback || ''}`);
  }

  /**
   * Helper to execute AGY CLI with prompt and timeout.
   */
  private extractTokenUsage(output: string, prompt: string): TokenUsage {
    const estimatedInput = Math.max(1, Math.ceil(prompt.length / 4));
    const estimatedOutput = Math.max(1, Math.ceil(output.length / 4));
    const usage: TokenUsage = {
      input_tokens: estimatedInput,
      output_tokens: estimatedOutput,
      total_tokens: estimatedInput + estimatedOutput,
      estimated: true,
      source: 'estimated'
    };

    const candidates: any[] = [];
    for (const line of output.split(/\r?\n/)) {
      try { candidates.push(JSON.parse(line)); } catch {}
    }
    try { candidates.push(JSON.parse(output)); } catch {}

    const visit = (value: any) => {
      if (!value || typeof value !== 'object') return;
      const nestedUsage = value.usage || value.tokenUsage || value.token_usage;
      if (nestedUsage && typeof nestedUsage === 'object') candidates.push(nestedUsage);
      for (const child of Object.values(value)) visit(child);
    };
    candidates.forEach(visit);

    for (const candidate of candidates) {
      if (!candidate || typeof candidate !== 'object') continue;
      const input = Number(candidate.input_tokens ?? candidate.inputTokens ?? candidate.prompt_tokens ?? candidate.promptTokens);
      const outputTokens = Number(candidate.output_tokens ?? candidate.outputTokens ?? candidate.completion_tokens ?? candidate.completionTokens);
      const total = Number(candidate.total_tokens ?? candidate.totalTokens);
      if (Number.isFinite(input) || Number.isFinite(outputTokens) || Number.isFinite(total)) {
        usage.input_tokens = Number.isFinite(input) ? input : estimatedInput;
        usage.output_tokens = Number.isFinite(outputTokens) ? outputTokens : estimatedOutput;
        usage.total_tokens = Number.isFinite(total) ? total : usage.input_tokens + usage.output_tokens;
        usage.estimated = false;
        usage.source = 'agy';
        return usage;
      }
    }
    return usage;
  }

  private async runAgy(prompt: string, timeoutMs = 240000): Promise<{ output: string; tokenUsage: TokenUsage }> {
    try {
      const { stdout } = await execFileAsync('agy', ['--dangerously-skip-permissions', '--print-timeout', '4m', '--print', prompt], {
        timeout: timeoutMs,
        maxBuffer: 20 * 1024 * 1024,
        cwd: projectPaths.root
      });
      return { output: stdout.trim(), tokenUsage: this.extractTokenUsage(stdout, prompt) };
    } catch (err: any) {
      console.error('[AGYProvider] Error running agy CLI:', err.message);
      throw err;
    }
  }

  /**
   * Extract JSON object from an LLM response string.
   */
  private extractJson(text: string): any {
    try {
      return JSON.parse(text);
    } catch (e) {
      const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[1] || match[0]);
      }
      throw new Error(`Failed to parse JSON from AGY response: ${text.slice(0, 200)}...`);
    }
  }

  private validateTemplateRequirements(scene: any, index: number): void {
    const label = `scene ${index + 1}`;
    const items = Array.isArray(scene.key_takeaways) ? scene.key_takeaways.filter((item: any) => typeof item === 'string' && item.trim()) : [];
    const nodes = Array.isArray(scene.concept_nodes) ? scene.concept_nodes.filter((node: any) => node && typeof node.label === 'string' && node.label.trim()) : [];
    const objectLabels = scene.visual_blueprint?.objects?.map((object: any) => object.label).filter(Boolean) || [];
    switch (scene.template) {
      case 'hero-object':
        if (!objectLabels.length) throw new Error(`${label} hero-object requires a labeled subject object.`);
        break;
      case 'split-compare':
      case 'before-after':
        if (nodes.length !== 2 && items.length !== 2) throw new Error(`${label} ${scene.template} requires exactly two comparison sides.`);
        break;
      case 'stat-callout':
        if (!scene.metric_data || typeof scene.metric_data.label !== 'string' || !Number.isFinite(scene.metric_data.value)) throw new Error(`${label} stat-callout requires metric_data with a numeric value and label.`);
        break;
      case 'list-reveal':
      case 'steps-numbered':
        if (items.length < 3 || items.length > 5) throw new Error(`${label} ${scene.template} requires 3-5 key_takeaways.`);
        break;
      case 'timeline':
        if (nodes.length < 3 && items.length < 3) throw new Error(`${label} timeline requires at least three ordered nodes or takeaways.`);
        break;
      case 'map-pin':
        if (!scene.image_search_query && !scene.visual_blueprint?.asset_queries?.length && !objectLabels.length) throw new Error(`${label} map-pin requires a location asset query or labeled place object.`);
        break;
      case 'chart-bar':
        if (!scene.metric_data && nodes.length < 2 && items.length < 2) throw new Error(`${label} chart-bar requires metric data or at least two values to compare.`);
        break;
      case 'question-hook':
        if (index !== 0 || !/[?؟]/.test(scene.on_screen_text)) throw new Error(`${label} question-hook must be the opening question scene.`);
        break;
      case 'cta-outro':
        if (scene.role !== 'cta' || !/(follow|save|share|like|subscribe|learn|try|comment|visit|watch|join)/i.test(`${scene.on_screen_text} ${scene.subtitle}`)) throw new Error(`${label} cta-outro requires an explicit viewer action.`);
        break;
      case 'product-showcase':
        if (!scene.image_search_query && !scene.visual_blueprint?.asset_queries?.length && !scene.visual_blueprint?.objects?.some((object: any) => object.render_spec?.type === '3d' || object.render_spec?.type === 'image')) throw new Error(`${label} product-showcase requires an image or 3D subject.`);
        break;
      case 'quote-focus':
        if (!scene.subtitle?.trim() || !scene.narration?.trim()) throw new Error(`${label} quote-focus requires a quote line and narration.`);
        break;
      case 'fact-card':
        if (!scene.subtitle?.trim() && !items.length) throw new Error(`${label} fact-card requires a fact explanation.`);
        break;
      case 'icon-grid':
        if (items.length < 3 && nodes.length < 3) throw new Error(`${label} icon-grid requires at least three related items.`);
        break;
      default:
        break;
    }
  }

  private validatePlan(parsed: any, input: ResearchAndScriptRequest): void {
    if (!parsed || typeof parsed !== 'object') throw new Error('AGY returned no structured script plan.');
    for (const field of ['topicInterpretation', 'researchNotes', 'factCheckNotes']) {
      if (typeof parsed[field] !== 'string' || !parsed[field].trim()) {
        throw new Error(`AGY returned no ${field}.`);
      }
    }
    if (typeof parsed.narration !== 'string' || !parsed.narration.trim()) {
      throw new Error('AGY returned no narration for the submitted content.');
    }
    if (!Array.isArray(parsed.sources) || parsed.sources.length === 0) {
      throw new Error('AGY returned no research sources; refusing to claim a researched script.');
    }
    for (const source of parsed.sources) {
      if (!source || typeof source.title !== 'string' || !/^https?:\/\//i.test(source.url || '')) {
        throw new Error('AGY returned an invalid research source.');
      }
    }
    if (!Array.isArray(parsed.scenePlan) || parsed.scenePlan.length === 0) {
      throw new Error('AGY returned no scene plan for the submitted content.');
    }

    const styleProfile = parsed.styleProfile;
    const styleFamilies = new Set(['cinematic-neon', 'editorial-paper', 'playful-pop', 'technical-terminal', 'documentary-grid']);
    if (!styleProfile || !styleFamilies.has(styleProfile.family) || typeof styleProfile.motif !== 'string' || !styleProfile.motif.trim() || typeof styleProfile.motion_language !== 'string' || typeof styleProfile.transition_language !== 'string') {
      throw new Error('AGY returned no complete visual style profile.');
    }
    for (const field of ['background', 'surface', 'text', 'primary', 'secondary']) {
      if (!/^#[0-9a-f]{6}$/i.test(styleProfile[field] || '')) throw new Error(`AGY returned an invalid style profile color: ${field}.`);
    }
    if (contrastRatio(styleProfile.text, styleProfile.background) < 4.5) {
      throw new Error('AGY style profile text/background contrast is below the 4.5:1 accessibility threshold.');
    }

    const requestedDuration = this.requestedDurationSec(input);
    const plannedDuration = parsed.scenePlan.reduce((sum: number, scene: any) => sum + Number(scene.duration_sec || 0), 0);
    if (requestedDuration && Math.abs(plannedDuration - requestedDuration) > 0.001) {
      throw new Error(`AGY planned ${plannedDuration}s, but the request requires exactly ${requestedDuration}s.`);
    }
    if (parsed.scenePlan.length < 7 || parsed.scenePlan.length > 9) {
      throw new Error(`AGY returned ${parsed.scenePlan.length} scenes; every video must contain 7-9 scenes.`);
    }
    if (plannedDuration < 25 || plannedDuration > 40) {
      throw new Error(`AGY planned ${plannedDuration}s; every video must be between 25 and 40 seconds.`);
    }
    const paletteColors = new Set<string>([styleProfile.primary.toLowerCase(), styleProfile.secondary.toLowerCase()]);

    if (this.requiresImportedImage(input)) {
      const hasImageObject = parsed.scenePlan.some((scene: any) =>
        (scene.visual_blueprint?.objects || []).some((object: any) => object.render_spec?.type === 'image' && (object.render_spec.asset_query || scene.visual_blueprint.asset_queries?.length))
      );
      if (!hasImageObject) throw new Error('The request requires at least one imported image object in the visual blueprint.');
    }

    if (this.isWebsiteVisit(input)) {
      const variants = new Set(['hero', 'about-grid', 'product-split', 'contact']);
      parsed.scenePlan.forEach((scene: any, index: number) => {
        const view = scene.visual_blueprint?.website_view;
        if (!view || typeof view.url !== 'string' || typeof view.route !== 'string' || typeof view.section !== 'string' || !variants.has(view.layout_variant) || !Array.isArray(view.nav_items) || view.nav_items.length < 2 || typeof view.hero_heading !== 'string' || typeof view.hero_body !== 'string' || typeof view.cta !== 'string' || !Array.isArray(view.panels) || view.panels.length < 2) {
          throw new Error(`AGY returned no complete website tour view for scene ${index + 1}.`);
        }
        if (!view.panels.every((panel: any) => panel && typeof panel.title === 'string' && typeof panel.body === 'string' && /^#[0-9a-f]{6}$/i.test(panel.accent || ''))) {
          throw new Error(`AGY returned an invalid website tour panel for scene ${index + 1}.`);
        }
      });
    }

    const renderTypes = new Set(['vector', 'image', 'text', '3d']);
    const templates = new Set(['hero-object', 'split-compare', 'stat-callout', 'list-reveal', 'quote-focus', 'timeline', 'steps-numbered', 'map-pin', 'chart-bar', 'before-after', 'question-hook', 'cta-outro', 'product-showcase', 'fact-card', 'icon-grid']);
    parsed.scenePlan.forEach((scene: any, index: number) => {
      const label = `scene ${index + 1}`;
      if (scene.scene_number !== index + 1) throw new Error(`AGY scene numbering is invalid at ${label}.`);
      if (!Number.isFinite(scene.duration_sec) || scene.duration_sec < 2.5 || scene.duration_sec > 5) {
        throw new Error(`AGY returned a duration outside the 2.5-5 second quality range for ${label}.`);
      }
      if (!['hook', 'body', 'cta'].includes(scene.role)) throw new Error(`AGY returned no valid hook/body/cta role for ${label}.`);
      if (!templates.has(scene.template)) throw new Error(`AGY returned no supported reusable template for ${label}.`);
      if (index === 0 && scene.role !== 'hook') throw new Error('The first AGY scene must be a hook.');
      if (index === parsed.scenePlan.length - 1 && scene.role !== 'cta') throw new Error('The final AGY scene must be a CTA.');
      if (index > 0 && index < parsed.scenePlan.length - 1 && scene.role !== 'body') throw new Error(`Only the first and last scenes may be hook/cta roles (${label}).`);
      if (typeof scene.on_screen_text !== 'string' || scene.on_screen_text.trim().split(/\s+/).length > 6) throw new Error(`AGY headline exceeds six words for ${label}.`);
      if (typeof scene.on_screen_text !== 'string' || scene.on_screen_text.trim().length > 40) throw new Error(`AGY headline exceeds 40 characters for ${label}.`);
      for (const field of ['on_screen_text', 'subtitle', 'visual_direction', 'motion_cue', 'continuity_to_next', 'narration']) {
        if (typeof scene[field] !== 'string' || !scene[field].trim()) {
          throw new Error(`AGY returned no ${field} for ${label}.`);
        }
      }
      if (scene.visual_type !== 'blueprint') throw new Error(`AGY must return visual_type "blueprint" for ${label}.`);
      if (!/^#[0-9a-f]{6}$/i.test(scene.theme_color || '')) {
        throw new Error(`AGY returned an invalid theme_color for ${label}.`);
      }
      paletteColors.add(scene.theme_color.toLowerCase());
      if (index < parsed.scenePlan.length - 1 && (!Number.isInteger(scene.transition_out_frames) || scene.transition_out_frames < 8 || scene.transition_out_frames > 15)) {
        throw new Error(`AGY returned an invalid transition_out_frames value for ${label}; use an integer from 8 to 15.`);
      }
      if (index === parsed.scenePlan.length - 1 && scene.transition_out_frames !== undefined && scene.transition_out_frames !== 0) {
        throw new Error(`The final AGY scene must not have an outgoing transition.`);
      }
      const blueprint = scene.visual_blueprint;
      if (!blueprint || typeof blueprint.purpose !== 'string' || typeof blueprint.layout !== 'string' || typeof blueprint.camera_motion !== 'string' || !Array.isArray(blueprint.objects) || blueprint.objects.length < 2 || !Array.isArray(blueprint.asset_queries)) {
        throw new Error(`AGY returned no complete visual blueprint for ${label}.`);
      }
      const objectIds = new Set<string>();
      blueprint.objects.forEach((object: any) => {
        if (!object || typeof object.id !== 'string' || objectIds.has(object.id) || !object.render_spec || !renderTypes.has(object.render_spec.type)) {
          throw new Error(`AGY returned an invalid visual blueprint object for ${label}.`);
        }
        objectIds.add(object.id);
        if (!Number.isFinite(object.x) || !Number.isFinite(object.y) || object.x < 0 || object.x > 1 || object.y < 0 || object.y > 1) {
          throw new Error(`AGY returned an invalid object position for ${label}.`);
        }
        const spec = object.render_spec;
        if (spec.type === '3d' && !new Set(['sphere', 'cube', 'torus', 'cylinder', 'molecule']).has(spec.primitive)) {
          throw new Error(`AGY returned an invalid 3D primitive for ${label}.`);
        }
        if (spec.type === 'vector' && ![spec.paths, spec.circles, spec.rects, spec.lines, spec.polygons].some((shapes: any) => Array.isArray(shapes) && shapes.length > 0)) {
          throw new Error(`AGY returned an empty vector render spec for ${label}.`);
        }
        if (spec.type === 'image' && typeof spec.asset_query !== 'string' && !blueprint.asset_queries.length) {
          throw new Error(`AGY returned an image object without an asset query for ${label}.`);
        }
        if (spec.type === 'text' && typeof spec.text !== 'string' && typeof object.label !== 'string') {
          throw new Error(`AGY returned a text object without text for ${label}.`);
        }
      });
      if (new Set(blueprint.objects.map((object: any) => JSON.stringify(object.render_spec))).size !== blueprint.objects.length) {
        throw new Error(`AGY returned duplicate object render specs for ${label}; every object must be visually distinct.`);
      }
      this.validateTemplateRequirements(scene, index);
    });

    if (paletteColors.size > 4) throw new Error('AGY used too many scene colors; keep the entire video within one palette family and its two accent colors.');
    for (let index = 2; index < parsed.scenePlan.length; index += 1) {
      if (parsed.scenePlan[index].template === parsed.scenePlan[index - 1].template && parsed.scenePlan[index].template === parsed.scenePlan[index - 2].template) {
        throw new Error(`AGY repeated template ${parsed.scenePlan[index].template} three times in a row.`);
      }
    }

    const sceneSignatures = parsed.scenePlan.map((scene: any) => JSON.stringify({
      on_screen_text: scene.on_screen_text.trim().toLowerCase(),
      subtitle: scene.subtitle.trim().toLowerCase(),
      visual_direction: scene.visual_direction.trim().toLowerCase(),
      visual_type: scene.visual_type,
      motion_cue: scene.motion_cue.trim().toLowerCase(),
      concept_nodes: scene.concept_nodes || [],
      metric_data: scene.metric_data || null,
    }));
    if (new Set(sceneSignatures).size !== sceneSignatures.length) {
      throw new Error('AGY returned duplicate screen plans; every scene must have a distinct visual and narrative purpose.');
    }

    const requestedApple = /3d\s+apple|apple\s+(?:icon|logo)|apple.*3d/i.test(`${input.topicOrContent} ${input.changeRequestFeedback || ''}`);
    if (requestedApple && !parsed.scenePlan.some((scene: any) => /apple/i.test(JSON.stringify(scene.visual_blueprint || {})))) {
      throw new Error('The approved correction explicitly requests an apple visual, but AGY did not include one in the blueprint.');
    }

    if (input.inputType === 'url' && !/^https?:\/\//i.test(input.topicOrContent.trim())) {
      throw new Error('The URL input must start with http:// or https://.');
    }
  }

  /**
   * 100% Dynamic Script & Screen Plan generation strictly driven by input content
   * and referencing .agents/skills/video-production-director/SKILL.md.
   */
  async generateScript(req: ResearchAndScriptRequest): Promise<ResearchAndScriptResult> {
    const isRevision = !!req.changeRequestFeedback;
    const shouldKeepNarration = Boolean(
      req.existingNarration &&
      !req.changeRequestFeedback?.toLowerCase().includes('change narration') &&
      !req.changeRequestFeedback?.toLowerCase().includes('rewrite narration')
    );

    const requestedDuration = this.requestedDurationSec(req);
    const websiteTour = this.isWebsiteVisit(req);
    const prompt = `You are a Senior Video Production Director and Remotion Expert acting in accordance with the skill instructions in .agents/skills/video-production-director/SKILL.md and the repository's MOTION_PIPELINE.md rules.

TASK: Execute live web research and create one original, content-specific script and screen motion plan based only on the submitted content. Do not reuse a previous topic, example, stock phrase, stock metric, stock concept node, or generic fallback. Every scene must explain a real idea from this content.

LIVE WEB RESEARCH DIRECTIVE:
Use your web search tool to actively research and verify the latest facts, technical mechanisms, and peer-reviewed sources or authoritative articles on this specific topic. Include the live verified URLs in the sources list.

BEGIN SUBMITTED CONTENT
${req.topicOrContent}
END SUBMITTED CONTENT
INPUT TYPE: ${req.inputType}
${requestedDuration ? `TARGET DURATION: exactly ${requestedDuration} seconds total. Choose scene durations between 2.5 and 5 seconds whose sum is exactly ${requestedDuration}; do not add or remove time in the renderer.` : ''}
${this.requiresImportedImage(req) ? 'IMPORTED IMAGE REQUIREMENT: Include at least one real image object with render_spec.type "image" and a specific asset_query that the renderer can download. Keep it in the visual safe area; never place it under the text safe area.' : ''}
${websiteTour ? 'WEBSITE TOUR REQUIREMENT: This is a real website-visit video, not an abstract explainer. Every scene must show a different animated browser viewport state. Add visual_blueprint.website_view with url, route, section, layout_variant (hero|about-grid|product-split|contact), nav_items, hero_label, hero_heading, hero_body, panels (at least two objects with title/body/accent hex), and cta. Use page-specific content verified from the submitted website. Do not reuse the same card layout across scenes.' : ''}
${isRevision ? `REVISION FEEDBACK: "${req.changeRequestFeedback}". Update the scene plan accordingly while maintaining narrative continuity.` : ''}
${shouldKeepNarration ? `RULE #7: Preserve the approved voice narration: "${req.existingNarration}". Dynamically update only the visual direction, typography, and motion cues.` : ''}

NON-NEGOTIABLE SKILL RULES:
0. You are not merely an explainer; you are a senior short-form video director. Build a visual story with a hook, escalating visual evidence, a clear payoff, and a final CTA. Treat every scene as a designed shot with a subject, camera behavior, readable typography, and a purposeful transition.
1. Never produce a video that is only static images. Every scene needs real, purposeful motion.
2. Provide a complete, captivating voice-over narration (word-for-word).
3. Design a unique color scheme, visual motif, and kinetic animation tailored specifically to this topic.
3a. Return a top-level styleProfile with one selected family (cinematic-neon, editorial-paper, playful-pop, technical-terminal, or documentary-grid), a topic-specific motif, five hex colors, a motion_language, and a transition_language. Do not default every project to dark neon or the same browser treatment.
4. Produce 7-9 scenes totaling 25-40 seconds. For each scene, specify the complete required field set below. Do not omit fields, replace them with generic filler, or rely on the renderer to invent content:
   - scene_number (integer)
   - role (exactly one "hook" first, "body" for middle scenes, and "cta" last)
   - template (one of hero-object, split-compare, stat-callout, list-reveal, quote-focus, timeline, steps-numbered, map-pin, chart-bar, before-after, question-hook, cta-outro, product-showcase, fact-card, icon-grid)
   - duration_sec (number between 2.5 and 5; when TARGET DURATION is present, all scene durations must sum exactly to that target)
   - on_screen_text (bold, kinetic title 3-6 words)
   - subtitle (punchy 1-sentence concept explanation)
   - key_takeaways (array of 2 to 3 short bullet points explaining the mechanism, max 6 words each)
   - concept_nodes (array of objects with "label" and "sub" representing real content-specific steps or entities; use [] when not useful)
   - metric_data (object with "label", "value" number 0-100, and "unit" only when the content supports a meaningful metric; otherwise null)
   - image_search_query (specific search phrase for an open educational diagram or illustration, or null when a procedural visual is more accurate)
   - visual_direction (layout, camera push/pan, visual structure)
   - visual_type (always "blueprint" for new plans; the reusable template is provided separately)
   - visual_blueprint (required, content-specific and different for every scene):
     { "purpose": "what this scene explains visually", "layout": "free-form composition with normalized object positions", "camera_motion": "specific camera movement", "asset_queries": ["relevant Wikimedia/Openverse search phrases"], "objects": [
     { "id": "unique object id", "label": "content-specific label", "detail": "short explanation", "x": 0.5, "y": 0.5, "to_x": 0.6, "to_y": 0.45, "scale": 1, "rotation": 0, "color": "#RRGGBB", "motion": "exact frame-driven motion", "motion_plan": { "enter_frame": 12, "exit_frame": 132, "idle": "float|pulse|orbit|shimmer|drift", "focal": true }, "render_spec": { "type": "vector|image|text|3d", "primitive": "sphere|cube|torus|cylinder|molecule when type is 3d", "viewBox": [0, 0, 1000, 700], "paths": [{ "d": "content-specific SVG path", "fill": "#RRGGBB", "stroke": "#RRGGBB", "strokeWidth": 4 }], "circles": [], "rects": [], "lines": [], "polygons": [], "text": "optional text", "asset_query": null } }
     ] }${websiteTour ? ', "website_view": { "url": "https://example.com", "route": "/", "section": "Hero", "layout_variant": "hero", "nav_items": ["Home", "About"], "hero_label": "site label", "hero_heading": "page-specific heading", "hero_body": "page-specific body", "panels": [{ "title": "content-specific panel", "body": "what the visitor sees", "accent": "#2EC4B6" }, { "title": "another panel", "body": "why it matters", "accent": "#F59E0B" }], "cta": "page-specific call to action" }' : ''}
     AGY must author the actual vector paths/shapes, select a relevant downloaded image, or choose a procedural 3D primitive when depth explains the submitted content (molecules, organs, planets, machines, devices, or spatial mechanisms). Do not choose from a fixed object-kind list. Every object render_spec must be different and explain a real part of the submitted content. Never return a generic diagram, network, metric, or headline template.
   - theme_color (hex color matching the topic's mood)
   - motion_cue (explicit description of what moves: spring entrance, scale zoom, path draw-on, staggered reveal)
   - continuity_to_next (what visual element or camera motion carries over into the next scene)
   - transition_out_frames (integer 8-15 for every scene except the last; use a directional overlap transition, never a fade to black)

Respond with ONLY a valid JSON object matching this schema:
{
  "topicInterpretation": "detailed narrative arc and thematic interpretation of this exact content",
  "researchNotes": "accurate context, mechanism breakdowns, and explanations",
  "sources": [
    { "title": "name of verified source or publication", "url": "https://...", "note": "what it supports" }
  ],
  "factCheckNotes": "verification notes and cross-checked facts",
  "styleProfile": {
    "family": "one allowed style family selected for this topic",
    "motif": "specific visual motif that is not a generic template",
    "background": "#05070f",
    "surface": "#111827",
    "text": "#F8FAFC",
    "primary": "#2EC4B6",
    "secondary": "#F59E0B",
    "motion_language": "specific frame-driven motion vocabulary",
    "transition_language": "specific transition behavior between scenes"
  },
  "narration": "full word-for-word voice-over narration script",
  "scenePlan": [
    {
      "scene_number": 1,
      "role": "hook",
      "template": "question-hook",
      "duration_sec": 5,
      "on_screen_text": "string",
      "subtitle": "string",
      "key_takeaways": ["point 1", "point 2"],
      "concept_nodes": [{ "label": "content-specific entity", "sub": "its role" }],
      "metric_data": null,
      "image_search_query": null,
      "visual_direction": "string",
      "visual_type": "blueprint",
      "theme_color": "#2EC4B6",
      "motion_cue": "content-specific motion description",
      "continuity_to_next": "content-specific continuity description",
      "transition_out_frames": 12,
      "visual_blueprint": {
        "purpose": "content-specific visual explanation",
        "layout": "free-form normalized composition",
        "camera_motion": "content-specific camera move",
        "asset_queries": ["specific relevant open educational image search"],
        "objects": [
          { "id": "object-1", "label": "content-specific object", "detail": "role in mechanism", "x": 0.5, "y": 0.42, "to_x": 0.56, "to_y": 0.4, "scale": 1, "rotation": 0, "color": "#2EC4B6", "motion": "spring entrance then purposeful rotation", "motion_plan": { "enter_frame": 10, "exit_frame": 132, "idle": "orbit", "focal": true }, "render_spec": { "type": "vector", "viewBox": [0, 0, 1000, 700], "paths": [{ "d": "M200 350 C280 120 720 120 800 350 C720 580 280 580 200 350 Z", "fill": "#2EC4B6", "stroke": "#ffffff", "strokeWidth": 4 }] } },
          { "id": "object-2", "label": "causal flow", "detail": "what changes", "x": 0.35, "y": 0.6, "scale": 1, "rotation": 0, "color": "#F59E0B", "motion": "path draw-on", "render_spec": { "type": "vector", "viewBox": [0, 0, 1000, 700], "lines": [{ "x1": 100, "y1": 350, "x2": 900, "y2": 350, "stroke": "#F59E0B", "strokeWidth": 12, "dash": "20 12" }] } }
        ]
      },
      "narration": "the narration for this content-specific scene"
    }
  ]
}`;

    console.log(`[AGYProvider] Running dynamic content-driven AGY planning for "${req.topicOrContent.slice(0, 60)}"...`);
    let agyResponse = await this.runAgy(prompt, 240000);
    let parsed = this.extractJson(agyResponse.output);
    try {
      this.validatePlan(parsed, req);
    } catch (error: any) {
      console.warn(`[AGYProvider] First plan failed validation; requesting one bounded repair pass: ${error.message}`);
      agyResponse = await this.runAgy(`${prompt}\n\nREPAIR PASS: The previous response failed validation with this error: ${error.message}. Return a completely corrected JSON object. Every scene MUST include a complete visual_blueprint with at least two distinct objects and render_spec data. Do not omit or abbreviate any blueprint field.`, 240000);
      parsed = this.extractJson(agyResponse.output);
      this.validatePlan(parsed, req);
    }

    return {
      topicInterpretation: parsed.topicInterpretation,
      researchNotes: parsed.researchNotes,
      sources: parsed.sources,
      factCheckNotes: parsed.factCheckNotes,
      narration: shouldKeepNarration ? req.existingNarration! : parsed.narration,
      scenePlan: parsed.scenePlan,
      styleProfile: parsed.styleProfile as StyleProfile,
      searchStatus: 'active',
      providerName: this.name,
      tokenUsage: agyResponse.tokenUsage
    };
  }

  /**
   * Generate animation code with AGY.
   */
  async generateAnimationCode(req: AnimationCodeRequest): Promise<AnimationCodeResult> {
    if (!req.scenePlan.length) throw new Error('Cannot create animation instructions without an approved AGY scene plan.');
    const totalDurationSec = req.scenePlan.reduce((acc, scene) => acc + scene.duration_sec, 0);
    const fps = 30;
    const durationInFrames = totalDurationSec * fps;

    return {
      compositionCode: '// AGY scene plan consumed through isolated Remotion input props',
      assetInstructions: req.scenePlan.map(s => ({
        name: `scene_${s.scene_number}_asset`,
        type: 'vector',
        purpose: s.asset_suggestions || s.visual_direction
      })),
      durationInFrames,
      fps
    };
  }
}
