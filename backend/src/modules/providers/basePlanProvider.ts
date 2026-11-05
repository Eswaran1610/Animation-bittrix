import { AIProvider, ResearchAndScriptRequest, ResearchAndScriptResult, AnimationCodeRequest, AnimationCodeResult, TokenUsage, StyleBrief } from './providerAdapter.js';
import { readFile } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { projectPaths } from '../../config/paths.js';
import { StyleProfile } from '../../types/index.js';
import { getThemeById } from '../themes/themeCatalog.js';
import { contentPreparationService, PreparedMotionDossier } from '../production/contentPreparationService.js';
import { realtime } from '../../realtime.js';

export const relativeLuminance = (hex: string) => {
  const channels = [0, 1, 2].map((index) => parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16) / 255);
  const linear = channels.map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
};

export const contrastRatio = (foreground: string, background: string) => {
  const light = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const dark = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (light + 0.05) / (dark + 0.05);
};

export const SUPPORTED_RENDER_TYPES = ['vector', 'image', 'text', '3d'] as const;
export const SUPPORTED_3D_PRIMITIVES = ['sphere', 'cube', 'torus', 'cylinder', 'molecule', 'keyboard'] as const;
export const SUPPORTED_TEMPLATES = ['hero-object', 'split-compare', 'stat-callout', 'list-reveal', 'quote-focus', 'timeline', 'steps-numbered', 'map-pin', 'chart-bar', 'before-after', 'question-hook', 'cta-outro', 'product-showcase', 'fact-card', 'icon-grid'] as const;
export const MAX_BLUEPRINT_OBJECTS_PER_SCENE = 4;

export const MOTION_CONTRACT = (() => {
  try {
    return JSON.parse(readFileSync(path.join(projectPaths.root, 'motion-contract.json'), 'utf8')) as Record<string, unknown>;
  } catch {
    return {
      archetypes: ['kinetic-type', 'isometric-diagram', 'data-story', 'paper-cutout', 'neo-brutalist', 'glass-ui', 'blueprint-technical', 'retro-terminal'],
      motionPersonalities: ['snappy', 'fluid', 'bouncy', 'precise'],
      backgrounds: ['grid', 'particles', 'gradient-flow', 'halftone', 'lines'],
      sfxPacks: ['digital', 'organic', 'cinematic', 'playful'],
      transitions: ['slide', 'wipe', 'flip', 'fade', 'push', 'whip'],
      fonts: ['Arial', 'Georgia', 'Trebuchet MS', 'Courier New', 'Impact'],
    };
  }
})();

export const DEFAULT_STYLE_BRIEF: StyleBrief = {
  archetype: 'blueprint-technical',
  palette: { bg: '#05070f', primary: '#2EC4B6', accent: '#F59E0B', text: '#F8FAFC' },
  fonts: { heading: 'Arial', body: 'Arial' },
  motionPersonality: 'precise',
  transitionSet: ['slide', 'push'],
  background: 'grid',
  sfxPack: 'digital',
  bedMood: 'focused electronic pulse',
};

export const styleProfileFromBrief = (brief: StyleBrief): StyleProfile => {
  const familyByArchetype: Record<StyleBrief['archetype'], StyleProfile['family']> = {
    'kinetic-type': 'playful-pop',
    'isometric-diagram': 'technical-terminal',
    'data-story': 'documentary-grid',
    'paper-cutout': 'editorial-paper',
    'neo-brutalist': 'playful-pop',
    'glass-ui': 'cinematic-neon',
    'blueprint-technical': 'technical-terminal',
    'retro-terminal': 'technical-terminal',
  };
  return {
    family: familyByArchetype[brief.archetype],
    motif: `${brief.archetype} with ${brief.background} motion field`,
    background: brief.palette.bg,
    surface: brief.palette.bg,
    text: brief.palette.text,
    primary: brief.palette.primary,
    secondary: brief.palette.accent,
    motion_language: `${brief.motionPersonality} motion with ${brief.fonts.heading} kinetic typography`,
    transition_language: brief.transitionSet.join(' and '),
  };
};

export const installedModelManifest = () => {
  try {
    return JSON.parse(readFileSync(path.join(projectPaths.remotionRoot, 'src/data/modelLibrary.json'), 'utf8')) as {
      library_file?: string;
      models?: Record<string, unknown>;
    };
  } catch {
    return { models: {} };
  }
};
export const INSTALLED_MODEL_MANIFEST = installedModelManifest();

export const BACKEND_PRODUCTION_RULES = `
- Preserve the submitted topic and factual meaning; never reuse another project's content.
- Research the exact submitted topic and return verified HTTP(S) sources.
- Create 7-9 content-specific scenes; use the requested duration when supplied, otherwise total 25-40 seconds.
- Use role hook for scene 1, body for middle scenes, and cta for the final scene.
- Select each scene template from the meaning of that scene, not from a fixed playlist. Use question-hook only for the opening question, cta-outro only for the final viewer action, hero-object for one dominant subject, product-showcase for a real product/device, split-compare or before-after only for two explicit sides/states, stat-callout or chart-bar only when the submitted content supports real numeric data, list-reveal or icon-grid for grouped items, timeline for ordered events, steps-numbered for a process, map-pin for a place/route, quote-focus for a real quote, fact-card for one focused fact, and hero-object or fact-card when no specialized structure is justified.
- Adjacent scenes must use different templates. Every scene must be content-specific, and the template must explain that scene's meaning; do not recycle the old template sequence or use random variety.
- Treat every scene as a distinct slideshow/UI slide when the content supports it: prefer a different supported template from the adjacent scene, a different layout composition, and a different camera/motion language. Do not follow a hard-coded template order and do not create random variety that weakens the explanation.
- Author object labels, render types, and motion so the renderer can create matching sound events: UI controls/tabs/links for click, text/bullets for tick, numbers for count, paths/diagrams for draw, rotating or traveling subjects for whoosh/slide, and results/checks for ding/chime. Do not make a scene text-only.
- Every scene needs purposeful frame-driven motion, narration, a visual blueprint, and at least two distinct objects.
- Plan audio with motion: all voiceover narration, procedural object sound cues, and ambient background music are consolidated into 1 unified master audio track. Every moving object's entrance/travel/reveal must map to a suitable SFX event, and every scene cut must map to its transition sound. Remotion renders the TSX composition with 1 master audio file. Do not plan separate individual MP3 audio files per scene.
- Make the scene plan render-ready: scene duration, narration length, object motion frames, transition overlap, and sound event frames must fit the same 30 fps timeline. Leave audio tail room and never schedule events outside their scene.
- Stage 1 preview is the complete motion-graphics review render: compose the researched images, icons, screen elements, and moving objects in the scene; animate object movement and scene transitions; synchronize object and transition sound effects to those events. Do not submit a static storyboard or a text-only preview.
- For researched topics, use one focused web-search pass to verify factual claims and find suitable, license-verified media candidates. Use relevant procedural visuals when they explain the subject better than stock media, and record the reason in researchNotes.
- Design a required top-level styleBrief before the scene plan. It must choose one archetype, palette, fonts, motion personality, transition set, background system, SFX pack, and bed mood from the supplied renderer vocabulary. Do not reuse a recent project's style signature.
- Use only supported blueprint render types and content-specific assets/primitives.
- Keep headlines to 6 words and 40 characters maximum.
- Keep the full visual palette within the backend validation limit.
- The final scene has no outgoing transition; all earlier transitions use 8-15 frames.
- Never return placeholders, generic diagrams, unrelated assets, or incomplete JSON.
`;

export type VideoComplexity = 'simple-motion' | 'production-explainer';

export abstract class BasePlanProvider implements AIProvider {
  abstract name: string;

  protected requestedDurationSec(input: ResearchAndScriptRequest): number | undefined {
    if (Number.isInteger(input.requestedDurationSec) && Number(input.requestedDurationSec) >= 20 && Number(input.requestedDurationSec) <= 40) {
      return Number(input.requestedDurationSec);
    }
    const match = `${input.topicOrContent} ${input.changeRequestFeedback || ''}`.match(/\b(\d{1,3})\s*(?:s|sec|secs|second|seconds)\b/i);
    const seconds = match ? Number(match[1]) : undefined;
    return seconds && seconds >= 20 && seconds <= 40 ? seconds : undefined;
  }

  protected sceneTransitionOverlapSec(scenes: any[]): number {
    return scenes.slice(0, -1).reduce((sum, scene) => {
      const frames = Number(scene.transition_out_frames ?? 12);
      return sum + Math.max(8, Math.min(15, Number.isFinite(frames) ? frames : 12)) / 30;
    }, 0);
  }

  protected actualTimelineDurationSec(scenes: any[]): number {
    const total = scenes.reduce((sum, scene) => sum + Number(scene.duration_sec || 0), 0) - this.sceneTransitionOverlapSec(scenes);
    return Number(total.toFixed(3));
  }

  protected requiresImportedImage(input: ResearchAndScriptRequest): boolean {
    return /\bimages?\b|import(?:ed|\s+an?)?\s+image/i.test(`${input.topicOrContent} ${input.changeRequestFeedback || ''}`);
  }

  protected requiresSceneRelevantImages(input: ResearchAndScriptRequest): boolean {
    return /\b(teach|teaching|student|students|learn|learning|lesson|education|educational|fruit|fruits|animal|animals|planet|planets|flower|flowers)\b/i.test(`${input.topicOrContent} ${input.changeRequestFeedback || ''}`);
  }

  protected requiresProduct3D(input: ResearchAndScriptRequest): boolean {
    const content = `${input.topicOrContent} ${input.changeRequestFeedback || ''}`;
    if (/\b(teach|teaching|student|students|learn|learning|lesson|education|educational)\b/i.test(content) && !/\b(product|advertisement|commercial|3d)\b/i.test(content)) {
      return false;
    }
    return /\b(3d|keyboard|mouse|headset|laptop|phone|apple|fruit|tree|basket|bucket|product\s+(?:ad|showcase)|advertisement|commercial)\b/i.test(content);
  }

  protected isWebsiteVisit(input: ResearchAndScriptRequest): boolean {
    return /website|web\s+site|visit\s+(?:the\s+)?(?:site|website)|https?:\/\//i.test(`${input.topicOrContent} ${input.changeRequestFeedback || ''}`);
  }

  protected requiresResearch(input: ResearchAndScriptRequest): boolean {
    void input;
    return true;
  }

  protected videoComplexity(input: ResearchAndScriptRequest): VideoComplexity {
    const content = `${input.topicOrContent} ${input.changeRequestFeedback || ''}`.trim();
    if (this.requiresResearch(input)) return 'production-explainer';
    if (content.length > 180 || /\b(explain|explainer|education|educational|story|storyboard|comparison|versus|vs\.?|multiple|mechanism|process|professional|cinematic|brand film|commercial)\b/i.test(content)) {
      return 'production-explainer';
    }
    if (/\b(appear|move|go|travel|fly|jump|fall|rotate|spin|bounce|open|close|transform|animate|show)\b/i.test(content)) {
      return 'simple-motion';
    }
    return 'production-explainer';
  }

  protected projectRenderContract(): Record<string, unknown> {
    const models = INSTALLED_MODEL_MANIFEST;
    return {
      composition: { id: 'MainComposition', width: 1080, height: 1920, fps: 30, renderer: 'Remotion; fixed composition; no generated TSX or other renderers' },
      styleBrief: { required: true, vocabulary: MOTION_CONTRACT, signature: 'archetype + motionPersonality + background + primary hue bucket' },
      sceneRules: { count: '7-9', plannedDurationSecondsEach: '2.5-5', totalSeconds: '25-40 unless the request specifies 20-40 seconds', transitionFrames: '8-15 between scenes; none after final scene', objectsPerScene: `2-${MAX_BLUEPRINT_OBJECTS_PER_SCENE}`, narrationWordsPerPlannedSecondMax: 1.5, narrationTailSeconds: 8 / 30, measuredTiming: 'Kokoro measured audio must fit approved scene frames; approved narration is never sped up. Validate every scene before approval.', headlineWordsMax: 6, headlineCharactersMax: 40 },
      sceneSchema: ['scene_number', 'role', 'template', 'duration_sec', 'on_screen_text', 'subtitle', 'key_takeaways', 'concept_nodes', 'metric_data', 'image_search_query', 'narration', 'visual_direction', 'motion_cue', 'continuity_to_next', 'transition_out_frames', 'theme_color', 'visual_type="blueprint"', 'visual_blueprint={purpose,layout,camera_motion,asset_queries,objects}'],
      objectSchema: { required: ['id', 'x', 'y', 'motion', 'render_spec', 'motion_plan'], optional: ['label', 'detail', 'to_x', 'to_y', 'scale', 'rotation', 'color'], renderSpecFields: ['type', 'primitive', 'model_id', 'asset_download_url', 'model_download_url', 'asset_source_url', 'asset_license', 'asset_attribution', 'viewBox', 'paths', 'circles', 'rects', 'lines', 'polygons', 'text', 'asset_query'], motionPlan: { enter_frame: 'integer frame', hold_start_frame: 'integer frame', hold_end_frame: 'integer frame', exit_frame: 'integer frame', stagger_frames: 'integer 0-20', easing: ['spring', 'easeOut', 'linear'], idle: ['float', 'pulse', 'orbit', 'shimmer', 'drift'], focal: 'optional boolean' }, vectorShapeListMax: 24 },
      supported: { roles: ['hook', 'body', 'cta'], templates: SUPPORTED_TEMPLATES, renderTypes: SUPPORTED_RENDER_TYPES, procedural3D: SUPPORTED_3D_PRIMITIVES, imageFormats: ['PNG', 'JPEG', 'WebP', 'GIF'], external3DFormat: 'self-contained GLB 2.0', externalModelMaxMB: 30, externalImageMaxMB: 20 },
      installedModelLibrary: { file: models.library_file || null, validModelIds: Object.keys(models.models || {}) },
      assetHandoff: 'Return exact HTTPS direct-download URLs, source page URLs, license labels, and attribution. The read-only CLI selects assets; after Gate 1 the backend downloads, validates, stores, and stages them in the project preview-version folder, then injects project-local Remotion public URLs into props. Never claim an asset was downloaded. No asset provider account, Poly Pizza integration, or asset-catalog API key is required.',
      motionAndAudio: { animation: 'Every image, vector, text, and 3D object is frame-animated by Remotion; TSX is an internal composition input.', sfxRoles: ['pop', 'click', 'tick', 'whoosh', 'slide', 'riser', 'impact', 'sparkle', 'chime', 'draw', 'count', 'ding'], soundChoice: 'Match each audible effect to the object/action; transitions use whoosh/slide. Avoid redundant sounds.', synchronization: 'Schedule cue hit frame on the visible event, subtract measured transient duration from source start, globalize scene-local frames using exact transition overlaps, mix narration/SFX/bed in Remotion, verify audio/video duration and each transient before MP4 delivery.' },
      delivery: { finalContainer: 'MP4', completedVideoUrl: '/media/videos/{projectId}_final.mp4', internalInputs: ['scene props JSON', 'per-scene narration', 'per-preview SFX', 'audio bed', 'downloaded image/GLB assets'], reviewStage: 'Gate 2 plays a review MP4; only the approved final MP4 is delivered as the completed video.' },
    };
  }

  protected visualObjectSignature(object: any): string {
    const spec = object?.render_spec || {};
    return JSON.stringify({
      id: object?.id,
      label: object?.label,
      type: spec.type,
      primitive: spec.primitive,
      model_id: spec.model_id,
      asset_download_url: spec.asset_download_url,
      model_download_url: spec.model_download_url,
      x: object?.x,
      y: object?.y,
      motion: object?.motion,
    });
  }

  protected tryParseJson(text: string): any {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  protected extractJson(text: string): any {
    const trimmed = text.trim();

    // 0. Unwrap NDJSON lines (e.g. from Codex CLI or streaming outputs)
    const lines = trimmed.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const obj = JSON.parse(lines[i]);
        if (obj?.type === 'item.completed' && obj.item?.type === 'agent_message' && typeof obj.item?.text === 'string') {
          const inner = this.extractJson(obj.item.text);
          if (inner && typeof inner === 'object' && Array.isArray(inner.scenePlan)) return inner;
        }
        if (obj?.response && typeof obj.response === 'string') {
          const inner = this.extractJson(obj.response);
          if (inner && typeof inner === 'object' && Array.isArray(inner.scenePlan)) return inner;
        }
      } catch {}
    }

    const directParsed = this.tryParseJson(trimmed);
    if (directParsed && typeof directParsed === 'object') {
      if (Array.isArray(directParsed.scenePlan)) return directParsed;
      if (typeof directParsed.response === 'string') {
        const inner = this.extractJson(directParsed.response);
        if (inner && typeof inner === 'object' && Array.isArray(inner.scenePlan)) return inner;
      }
      if (directParsed.item?.type === 'agent_message' && typeof directParsed.item?.text === 'string') {
        const inner = this.extractJson(directParsed.item.text);
        if (inner && typeof inner === 'object' && Array.isArray(inner.scenePlan)) return inner;
      }
    }

    const filePathRegex = /(?:\/[\w.-]+)+\.(?:json|txt)/g;
    const fileMatches = trimmed.match(filePathRegex);
    if (fileMatches) {
      const candidates = [...new Set(fileMatches)].filter(p => !p.includes('/node_modules/') && !p.includes('/.git/'));
      for (const filePath of candidates) {
        if (existsSync(filePath)) {
          try {
            const content = readFileSync(filePath, 'utf-8');
            const parsed = this.tryParseJson(content);
            if (parsed && typeof parsed === 'object' && Array.isArray(parsed.scenePlan)) {
              return parsed;
            }
          } catch {}
        }
      }
    }

    const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/gi;
    let blockMatch;
    const candidates: string[] = [];
    while ((blockMatch = codeBlockRegex.exec(text)) !== null) {
      candidates.push(blockMatch[1].trim());
    }
    candidates.sort((a, b) => b.length - a.length);

    for (const candidate of candidates) {
      const parsed = this.tryParseJson(candidate);
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.scenePlan)) {
        return parsed;
      }
    }
    for (const candidate of candidates) {
      const parsed = this.tryParseJson(candidate);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }

    let braceStart = -1;
    let depth = 0;
    let inString = false;
    let escape = false;
    const balancedBlocks: string[] = [];

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (char === '\\') {
        escape = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;

      if (char === '{') {
        if (depth === 0) braceStart = i;
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0 && braceStart !== -1) {
          balancedBlocks.push(text.slice(braceStart, i + 1));
          braceStart = -1;
        }
      }
    }

    balancedBlocks.sort((a, b) => b.length - a.length);
    for (const block of balancedBlocks) {
      const parsed = this.tryParseJson(block);
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.scenePlan)) {
        return parsed;
      }
    }
    for (const block of balancedBlocks) {
      const parsed = this.tryParseJson(block);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }

    if (directParsed && typeof directParsed === 'object') {
      return directParsed;
    }

    throw new Error(`Failed to parse JSON plan from AI response: ${text.slice(0, 300)}...`);
  }

  protected validateTemplateRequirements(scene: any, index: number): void {
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
        if (nodes.length !== 2 && items.length !== 2 && objectLabels.length < 2) {
          throw new Error(`${label} ${scene.template} requires two comparison sides.`);
        }
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
        if (items.length < 3 && nodes.length < 3 && objectLabels.length < 3) throw new Error(`${label} icon-grid requires at least three related items.`);
        break;
    }
  }

  protected normalizeGeneratedPlan(parsed: any, input?: ResearchAndScriptRequest): any {
    if (!parsed || typeof parsed !== 'object') return parsed;

    if (!Array.isArray(parsed.scenePlan) && typeof parsed === 'object') {
      const candidates = Object.values(parsed).filter((value) => Array.isArray(value)) as any[][];
      const match = candidates.find((arr) => arr.length >= 7 && arr.length <= 9 && arr.some((item) => item && typeof item === 'object' && ('role' in item || 'template' in item || 'visual_blueprint' in item)));
      if (match) parsed.scenePlan = match;
    }

    if (!parsed.styleBrief || typeof parsed.styleBrief !== 'object') {
      parsed.styleBrief = { ...DEFAULT_STYLE_BRIEF };
    } else {
      const brief = parsed.styleBrief;
      const allowedArchetypes = new Set(MOTION_CONTRACT.archetypes as string[]);
      const allowedPersonalities = new Set(MOTION_CONTRACT.motionPersonalities as string[]);
      const allowedBackgrounds = new Set(MOTION_CONTRACT.backgrounds as string[]);
      const allowedSfxPacks = new Set(MOTION_CONTRACT.sfxPacks as string[]);
      const allowedTransitions = new Set(MOTION_CONTRACT.transitions as string[]);

      if (!allowedArchetypes.has(brief.archetype)) brief.archetype = DEFAULT_STYLE_BRIEF.archetype;
      if (!allowedPersonalities.has(brief.motionPersonality)) brief.motionPersonality = DEFAULT_STYLE_BRIEF.motionPersonality;
      if (!allowedBackgrounds.has(brief.background)) brief.background = DEFAULT_STYLE_BRIEF.background;
      if (!allowedSfxPacks.has(brief.sfxPack)) brief.sfxPack = DEFAULT_STYLE_BRIEF.sfxPack;
      if (!brief.palette || typeof brief.palette !== 'object') {
        brief.palette = { ...DEFAULT_STYLE_BRIEF.palette };
      } else {
        for (const field of ['bg', 'primary', 'accent', 'text'] as const) {
          if (!/^#[0-9a-f]{6}$/i.test(brief.palette[field] || '')) {
            brief.palette[field] = DEFAULT_STYLE_BRIEF.palette[field];
          }
        }
      }
      if (contrastRatio(brief.palette.text, brief.palette.bg) < 4.5) {
        brief.palette.text = '#FFFFFF';
        if (contrastRatio(brief.palette.text, brief.palette.bg) < 4.5) {
          brief.palette.bg = '#0A0A0A';
        }
      }
      if (!Array.isArray(brief.transitionSet) || !brief.transitionSet.length) {
        brief.transitionSet = [...DEFAULT_STYLE_BRIEF.transitionSet];
      } else {
        brief.transitionSet = brief.transitionSet.map(String).filter((t: string) => allowedTransitions.has(t));
        if (!brief.transitionSet.length) brief.transitionSet = [...DEFAULT_STYLE_BRIEF.transitionSet];
      }
      if (!brief.bedMood || typeof brief.bedMood !== 'string' || !brief.bedMood.trim()) {
        brief.bedMood = DEFAULT_STYLE_BRIEF.bedMood;
      }
    }

    if (input?.selectedTheme) {
      const chosen = getThemeById(input.selectedTheme);
      parsed.styleBrief.archetype = chosen.archetype;
      parsed.styleBrief.motionPersonality = chosen.motionPersonality;
      parsed.styleBrief.background = chosen.background;
      parsed.styleBrief.sfxPack = chosen.sfxPack;
      parsed.styleBrief.bedMood = chosen.bedMood;
      parsed.styleBrief.palette = {
        bg: chosen.palette.bg,
        primary: chosen.palette.primary,
        accent: chosen.palette.accent,
        text: chosen.palette.text,
      };
      parsed.styleProfile = styleProfileFromBrief(parsed.styleBrief);
      parsed.styleProfile.surface = chosen.palette.surface;
    }

    if (!parsed.styleProfile || typeof parsed.styleProfile !== 'object') {
      parsed.styleProfile = styleProfileFromBrief(parsed.styleBrief);
    } else {
      const sp = parsed.styleProfile;
      const allowedFamilies = new Set(['cinematic-neon', 'editorial-paper', 'playful-pop', 'technical-terminal', 'documentary-grid']);
      if (!allowedFamilies.has(sp.family)) sp.family = styleProfileFromBrief(parsed.styleBrief).family;
      if (!sp.motif || typeof sp.motif !== 'string' || !sp.motif.trim()) sp.motif = `${parsed.styleBrief.archetype} motion field`;
      for (const field of ['background', 'surface', 'text', 'primary', 'secondary'] as const) {
        if (!/^#[0-9a-f]{6}$/i.test(sp[field] || '')) {
          sp[field] = field === 'secondary' ? parsed.styleBrief.palette.accent : field === 'surface' ? '#111827' : parsed.styleBrief.palette[field as 'bg' | 'primary' | 'accent' | 'text'];
        }
      }
      if (contrastRatio(sp.text, sp.background) < 4.5) {
        sp.text = '#FFFFFF';
        if (contrastRatio(sp.text, sp.background) < 4.5) sp.background = '#05070F';
      }
      if (!sp.motion_language || typeof sp.motion_language !== 'string') sp.motion_language = `${parsed.styleBrief.motionPersonality} kinetic motion`;
      if (!sp.transition_language || typeof sp.transition_language !== 'string') sp.transition_language = parsed.styleBrief.transitionSet.join(' and ');
    }

    if (!Array.isArray(parsed.scenePlan) || parsed.scenePlan.length === 0) return parsed;

    const allowedTemplates = new Set<string>(SUPPORTED_TEMPLATES);
    const styleProfile = parsed.styleProfile;

    for (let index = 0; index < parsed.scenePlan.length; index += 1) {
      const scene = parsed.scenePlan[index];
      if (!scene || typeof scene !== 'object') continue;

      scene.scene_number = index + 1;
      if (index === 0) {
        scene.role = 'hook';
        scene.template = 'question-hook';
        if (!/[?؟]/.test(scene.on_screen_text || '')) {
          scene.on_screen_text = scene.on_screen_text ? `${scene.on_screen_text.replace(/[.!;,]+$/, '')}?` : 'Curious How This Works?';
        }
      } else if (index === parsed.scenePlan.length - 1) {
        scene.role = 'cta';
        scene.template = 'cta-outro';
        const ctaActions = /(follow|save|share|like|subscribe|learn|try|comment|visit|watch|join)/i;
        if (!ctaActions.test(`${scene.on_screen_text || ''} ${scene.subtitle || ''}`)) {
          scene.on_screen_text = 'Learn More Today';
          scene.subtitle = 'Visit and explore the breakthrough right now.';
        }
        scene.transition_out_frames = 0;
        scene.continuity_to_next = 'None (final scene)';
      } else {
        scene.role = 'body';
        if (!allowedTemplates.has(scene.template) || scene.template === 'question-hook' || scene.template === 'cta-outro') {
          const bodyTemplates = ['hero-object', 'stat-callout', 'fact-card', 'split-compare', 'steps-numbered'];
          scene.template = bodyTemplates[index % bodyTemplates.length];
        }
      }

      if (typeof scene.on_screen_text === 'string') {
        const words = scene.on_screen_text.trim().split(/\s+/);
        if (words.length > 6) scene.on_screen_text = words.slice(0, 6).join(' ');
        if (scene.on_screen_text.length > 40) scene.on_screen_text = scene.on_screen_text.slice(0, 40).trim();
      } else {
        scene.on_screen_text = `Scene ${index + 1}`;
      }

      if (typeof scene.subtitle !== 'string' || !scene.subtitle.trim()) {
        scene.subtitle = `Explaining key concept for scene ${index + 1}.`;
      }

      if (!/^#[0-9a-f]{6}$/i.test(scene.theme_color || '')) {
        scene.theme_color = index % 2 === 0 ? styleProfile.primary : styleProfile.secondary;
      }

      if (index < parsed.scenePlan.length - 1) {
        const frames = Number(scene.transition_out_frames);
        if (!Number.isInteger(frames) || frames < 8 || frames > 15) {
          scene.transition_out_frames = 12;
        }
        if (!scene.continuity_to_next || typeof scene.continuity_to_next !== 'string' || !scene.continuity_to_next.trim()) {
          scene.continuity_to_next = 'Camera push carries visual momentum into the next scene.';
        }
      }

      if (!scene.visual_blueprint || typeof scene.visual_blueprint !== 'object') {
        scene.visual_blueprint = {
          purpose: `Illustrate scene ${index + 1} concepts visually`,
          layout: 'center focused layout with accent graphics',
          camera_motion: 'gentle push in',
          asset_queries: [],
          objects: []
        };
      }
      const bp = scene.visual_blueprint;
      if (!bp.purpose || typeof bp.purpose !== 'string') bp.purpose = `Illustrate scene ${index + 1} concepts visually`;
      if (!bp.layout || typeof bp.layout !== 'string') bp.layout = 'center focused layout with accent graphics';
      if (!bp.camera_motion || typeof bp.camera_motion !== 'string') bp.camera_motion = 'gentle push in';
      if (!Array.isArray(bp.asset_queries)) bp.asset_queries = [];
      if (!Array.isArray(bp.objects)) bp.objects = [];

      if (bp.objects.length < 2) {
        bp.objects.push({
          id: `scene_${index + 1}_core_badge`,
          label: scene.on_screen_text || `Scene ${index + 1} Emblem`,
          detail: 'Primary focus badge',
          x: 0.5,
          y: 0.45,
          scale: 1,
          rotation: 0,
          color: scene.theme_color || styleProfile.primary,
          motion: 'scale spring entrance with gentle float',
          motion_plan: { enter_frame: 6, hold_start_frame: 18, hold_end_frame: 90, exit_frame: 110, stagger_frames: 3, easing: 'spring', idle: 'float', focal: true },
          render_spec: {
            type: 'vector',
            viewBox: [0, 0, 200, 200],
            paths: [{ d: 'M 100,20 L 180,65 L 180,155 L 100,195 L 20,155 L 20,65 Z', stroke: scene.theme_color || styleProfile.primary, strokeWidth: 3, fill: 'none' }],
            circles: [{ cx: 100, cy: 100, r: 25, fill: scene.theme_color || styleProfile.primary }],
          }
        });
        bp.objects.push({
          id: `scene_${index + 1}_accent_ring`,
          label: 'Accent Ring',
          detail: 'Secondary visual rhythm',
          x: 0.5,
          y: 0.75,
          scale: 0.9,
          rotation: 0,
          color: styleProfile.secondary,
          motion: 'staggered fade and pulse',
          motion_plan: { enter_frame: 14, hold_start_frame: 24, hold_end_frame: 92, exit_frame: 110, stagger_frames: 2, easing: 'easeOut', idle: 'pulse', focal: false },
          render_spec: {
            type: 'vector',
            viewBox: [0, 0, 300, 60],
            rects: [{ x: 10, y: 10, width: 280, height: 40, rx: 8, stroke: styleProfile.secondary, strokeWidth: 2, fill: 'none' }],
            circles: [{ cx: 40, cy: 30, r: 6, fill: styleProfile.secondary }, { cx: 260, cy: 30, r: 6, fill: styleProfile.secondary }],
          }
        });
      }

      if (scene.template === 'stat-callout') {
        if (!scene.metric_data || typeof scene.metric_data !== 'object' || typeof scene.metric_data.label !== 'string' || !Number.isFinite(scene.metric_data.value)) {
          scene.metric_data = { label: scene.on_screen_text || 'Performance Metric', value: 95, unit: '%' };
        }
      }

      if (['split-compare', 'before-after'].includes(scene.template)) {
        const nodes = Array.isArray(scene.concept_nodes) ? scene.concept_nodes : [];
        const items = Array.isArray(scene.key_takeaways) ? scene.key_takeaways : [];
        if (nodes.length !== 2 && items.length !== 2) {
          scene.concept_nodes = [
            { label: 'Traditional Approach', sub: 'Slow and fragmented' },
            { label: 'Modern Unified System', sub: 'Instant cryptographic trust' }
          ];
        }
      }

      if (['list-reveal', 'steps-numbered', 'timeline', 'icon-grid'].includes(scene.template)) {
        const items = Array.isArray(scene.key_takeaways) ? scene.key_takeaways.filter((t: any) => typeof t === 'string' && t.trim()) : [];
        const nodes = Array.isArray(scene.concept_nodes) ? scene.concept_nodes : [];
        const objLabels = bp.objects.map((o: any) => o.label).filter((l: any) => typeof l === 'string' && l.trim());
        const combined = Array.from(new Set([...items, ...nodes.map((n: any) => n.label), ...objLabels]));
        if (combined.length < 3) {
          const fallbacks = ['Visual Hierarchy', 'Material Styling', 'Motion Dynamic', 'Accent Details'];
          for (const fallback of fallbacks) {
            if (combined.length >= 3) break;
            if (!combined.includes(fallback)) combined.push(fallback);
          }
        }
        scene.key_takeaways = combined.slice(0, 4);
      }

      if (input && this.isWebsiteVisit(input)) {
        const siteUrl = input.topicOrContent.trim().startsWith('http') ? input.topicOrContent.trim() : 'https://example.com';
        const variants: Array<'hero' | 'about-grid' | 'product-split' | 'contact'> = ['hero', 'about-grid', 'product-split', 'hero', 'about-grid', 'product-split', 'contact'];
        if (!bp.website_view) {
          bp.website_view = {
            url: siteUrl,
            route: index === 0 ? '/' : index === parsed.scenePlan.length - 1 ? '/contact' : `/section/${index + 1}`,
            section: index === 0 ? 'Hero' : index === parsed.scenePlan.length - 1 ? 'Contact' : `Feature ${index + 1}`,
            layout_variant: variants[index % variants.length],
            nav_items: ['Home', 'Features', 'Docs', 'Contact'],
            hero_label: 'Platform Overview',
            hero_heading: scene.on_screen_text,
            hero_body: scene.subtitle,
            panels: [
              { title: scene.on_screen_text, body: scene.subtitle, accent: styleProfile.primary },
              { title: 'Core Advantage', body: 'Engineered for seamless low latency execution', accent: styleProfile.secondary }
            ],
            cta: index === parsed.scenePlan.length - 1 ? 'Get Started' : 'Learn More'
          };
        }
      }
    }

    const requestedDuration = input ? this.requestedDurationSec(input) : undefined;
    const targetTotal = requestedDuration || 30;
    const timelineSceneTotal = targetTotal + this.sceneTransitionOverlapSec(parsed.scenePlan);
    const count = parsed.scenePlan.length;
    const baseSec = Math.round((timelineSceneTotal / count) * 100) / 100;
    if (baseSec >= 2.5 && baseSec <= 5) {
      let runningSum = 0;
      for (let i = 0; i < count - 1; i += 1) {
        parsed.scenePlan[i].duration_sec = baseSec;
        runningSum += baseSec;
      }
      parsed.scenePlan[count - 1].duration_sec = Math.round((timelineSceneTotal - runningSum) * 100) / 100;
    }

    const seenSceneSigs = new Set<string>();
    for (let i = 0; i < parsed.scenePlan.length; i += 1) {
      const s = parsed.scenePlan[i];
      const sig = `${s.on_screen_text}::${s.subtitle}`;
      if (seenSceneSigs.has(sig)) {
        s.subtitle = `${s.subtitle} (Part ${i + 1})`;
      }
      seenSceneSigs.add(`${s.on_screen_text}::${s.subtitle}`);
    }

    if (!Array.isArray(parsed.sources)) parsed.sources = [];
    if (input && this.requiresResearch(input) && parsed.sources.length === 0) {
      if (input.inputType === 'url' && /^https?:\/\//i.test(input.topicOrContent.trim())) {
        parsed.sources.push({
          title: 'Submitted Resource',
          url: input.topicOrContent.trim(),
          note: 'Primary web source inspected for this plan',
        });
      }
    }

    return parsed;
  }

  protected collectRepairIssues(parsed: any, input: ResearchAndScriptRequest): string[] {
    const issues = new Set<string>();
    const add = (issue: string) => issues.add(issue);

    if (!parsed || typeof parsed !== 'object') return ['AI returned no structured script plan.'];
    for (const field of ['topicInterpretation', 'researchNotes', 'factCheckNotes']) {
      if (typeof parsed[field] !== 'string' || !parsed[field].trim()) add(`AI returned no ${field}.`);
    }
    const researchRequired = this.requiresResearch(input);
    if (researchRequired) {
      if (!Array.isArray(parsed.sources) || parsed.sources.length === 0) {
        add('AI returned no research sources; deep research requires at least 3-5 verified primary sources from multiple authoritative websites.');
      } else {
        const nonWikiSources = parsed.sources.filter((s: any) => !/wikipedia\.org|wikimedia\.org/i.test(s?.url || ''));
        if (nonWikiSources.length < 3) {
          add(`Deep research requires at least 3 distinct authoritative primary sources from different websites (.edu, .gov, peer-reviewed journals, science publications, official documentation). Found only ${nonWikiSources.length} non-Wikipedia source(s).`);
        }
      }
    }
    if (typeof parsed.narration !== 'string' || !parsed.narration.trim()) {
      add('AI returned no narration for the submitted content.');
    }
    if (!Array.isArray(parsed.scenePlan) || parsed.scenePlan.length === 0) {
      return [...issues, 'AI returned no scene plan for the submitted content.'];
    }

    const scenes = parsed.scenePlan;
    if (scenes.length < 7 || scenes.length > 9) {
      add(`AI returned ${scenes.length} scenes; every video must contain 7-9 scenes.`);
    }
    const requestedDuration = this.requestedDurationSec(input);
    const plannedDuration = this.actualTimelineDurationSec(scenes);
    const narrationWords = scenes.reduce((total: number, scene: any) => total + (String(scene?.narration || '').match(/\S+/g) || []).length, 0);
    const narrationBudget = Math.floor((requestedDuration || plannedDuration) * 1.5);
    if (narrationWords > narrationBudget) add(`Narration is ${narrationWords} words; hard maximum is ${narrationBudget} words for ${requestedDuration || plannedDuration}s at 1.5 words/second. Rewrite all scene narration to fit; do not preserve an overlong narration.`);
    if (requestedDuration && Math.abs(plannedDuration - requestedDuration) > 0.001) {
      add(`AI planned a ${plannedDuration.toFixed(2)}s rendered timeline after transition overlaps, but the request requires exactly ${requestedDuration}s.`);
    }

    const renderTypes = new Set<string>(SUPPORTED_RENDER_TYPES);
    const templates = new Set<string>(SUPPORTED_TEMPLATES);
    const paletteColors = new Set<string>();
    if (parsed.styleProfile?.primary) paletteColors.add(String(parsed.styleProfile.primary).toLowerCase());
    if (parsed.styleProfile?.secondary) paletteColors.add(String(parsed.styleProfile.secondary).toLowerCase());

    scenes.forEach((scene: any, index: number) => {
      const label = `scene ${index + 1}`;
      if (!scene || typeof scene !== 'object') {
        add(`AI returned no object for ${label}.`);
        return;
      }
      if (scene.scene_number !== index + 1) add(`AI scene numbering is invalid at ${label}.`);
      if (!Number.isFinite(scene.duration_sec) || scene.duration_sec < 2.5 || scene.duration_sec > 5) {
        add(`AI returned a duration outside the 2.5-5 second quality range for ${label}.`);
      }
      if (!['hook', 'body', 'cta'].includes(scene.role)) add(`AI returned no valid hook/body/cta role for ${label}.`);
      if (!templates.has(scene.template)) add(`AI returned no supported reusable template for ${label}.`);
      if (index === 0 && scene.role !== 'hook') add('The first scene must be a hook.');
      if (index === scenes.length - 1 && scene.role !== 'cta') add('The final scene must be a CTA.');
      if (index > 0 && index < scenes.length - 1 && scene.role !== 'body') add(`Only the first and last scenes may be hook/cta roles (${label}).`);

      if (typeof scene.on_screen_text !== 'string' || !scene.on_screen_text.trim()) {
        add(`AI returned no on_screen_text for ${label}.`);
      } else {
        const headline = scene.on_screen_text.trim();
        if (headline.split(/\s+/).length > 6) add(`Headline exceeds six words for ${label}.`);
        if (headline.length > 40) add(`Headline exceeds 40 characters for ${label}.`);
      }
      const requiredFields = index === scenes.length - 1
        ? ['subtitle', 'visual_direction', 'motion_cue', 'narration']
        : ['subtitle', 'visual_direction', 'motion_cue', 'continuity_to_next', 'narration'];
      for (const field of requiredFields) {
        if (typeof scene[field] !== 'string' || !scene[field].trim()) add(`AI returned no ${field} for ${label}.`);
      }
      if (scene.visual_type !== 'blueprint') add(`AI must return visual_type "blueprint" for ${label}.`);
      if (!/^#[0-9a-f]{6}$/i.test(scene.theme_color || '')) add(`AI returned an invalid theme_color for ${label}.`);
      else paletteColors.add(scene.theme_color.toLowerCase());

      const blueprint = scene.visual_blueprint;
      if (!blueprint || typeof blueprint !== 'object') {
        add(`AI returned no visual_blueprint for ${label}.`);
        return;
      }
      if (!Array.isArray(blueprint.objects) || blueprint.objects.length < 2 || blueprint.objects.length > 5) {
        add(`AI returned an incomplete visual blueprint for ${label}; it must contain 2-${MAX_BLUEPRINT_OBJECTS_PER_SCENE} objects.`);
        return;
      }

      blueprint.objects.forEach((object: any, objectIndex: number) => {
        if (!object || typeof object.id !== 'string' || !object.render_spec || !renderTypes.has(object.render_spec.type)) {
          add(`AI returned an invalid visual blueprint object ${objectIndex + 1} for ${label}; each object needs a unique id and render_spec.type.`);
        }
      });
      try {
        this.validateTemplateRequirements(scene, index);
      } catch (error: any) {
        add(error instanceof Error ? error.message : String(error));
      }
    });

    return [...issues];
  }

  protected validatePlan(parsed: any, input: ResearchAndScriptRequest): void {
    if (!parsed || typeof parsed !== 'object') throw new Error('AI returned no structured script plan.');
    for (const field of ['topicInterpretation', 'researchNotes', 'factCheckNotes']) {
      if (typeof parsed[field] !== 'string' || !parsed[field].trim()) {
        throw new Error(`AI returned no ${field}.`);
      }
    }
    if (typeof parsed.narration !== 'string' || !parsed.narration.trim()) {
      throw new Error('AI returned no narration for the submitted content.');
    }
    const researchRequired = this.requiresResearch(input);
    if (!Array.isArray(parsed.sources) || (researchRequired && parsed.sources.length === 0)) {
      throw new Error(researchRequired
        ? 'AI returned no research sources; refusing to claim a researched script.'
        : 'AI returned an invalid sources array for a creative-only script.');
    }
    if (researchRequired) {
      const nonWikiSources = parsed.sources.filter((s: any) => !/wikipedia\.org|wikimedia\.org/i.test(s?.url || ''));
      if (nonWikiSources.length < 3) {
        throw new Error(
          `Deep research requires at least 3 distinct authoritative primary sources from different websites (.edu, .gov, peer-reviewed journals, official documentation), not Wikipedia/Wikimedia alone. Found only ${nonWikiSources.length} non-Wikipedia source(s).`
        );
      }
    }
    for (const source of parsed.sources) {
      if (!source || typeof source.title !== 'string' || !/^https?:\/\//i.test(source.url || '')) {
        throw new Error('AI returned an invalid research source.');
      }
    }
    if (!Array.isArray(parsed.scenePlan) || parsed.scenePlan.length === 0) {
      throw new Error('AI returned no scene plan for the submitted content.');
    }

    const styleProfile = parsed.styleProfile;
    const styleFamilies = new Set(['cinematic-neon', 'editorial-paper', 'playful-pop', 'technical-terminal', 'documentary-grid']);
    if (!styleProfile || !styleFamilies.has(styleProfile.family) || typeof styleProfile.motif !== 'string' || !styleProfile.motif.trim() || typeof styleProfile.motion_language !== 'string' || typeof styleProfile.transition_language !== 'string') {
      throw new Error('AI returned no complete visual style profile.');
    }
    for (const field of ['background', 'surface', 'text', 'primary', 'secondary']) {
      if (!/^#[0-9a-f]{6}$/i.test(styleProfile[field] || '')) throw new Error(`AI returned an invalid style profile color: ${field}.`);
    }
    if (contrastRatio(styleProfile.text, styleProfile.background) < 4.5) {
      throw new Error('AI style profile text/background contrast is below the 4.5:1 accessibility threshold.');
    }

    const brief = parsed.styleBrief;
    const allowedArchetypes = new Set((MOTION_CONTRACT.archetypes as string[]) || []);
    const allowedPersonalities = new Set((MOTION_CONTRACT.motionPersonalities as string[]) || []);
    const allowedBackgrounds = new Set((MOTION_CONTRACT.backgrounds as string[]) || []);
    const allowedSfxPacks = new Set((MOTION_CONTRACT.sfxPacks as string[]) || []);
    const allowedTransitions = new Set((MOTION_CONTRACT.transitions as string[]) || []);
    if (!brief || !allowedArchetypes.has(brief.archetype) || !allowedPersonalities.has(brief.motionPersonality) || !allowedBackgrounds.has(brief.background) || !allowedSfxPacks.has(brief.sfxPack) || !Array.isArray(brief.transitionSet) || !brief.transitionSet.length || !brief.transitionSet.every((value: unknown) => allowedTransitions.has(String(value))) || !brief.bedMood?.trim()) {
      throw new Error('AI returned no complete styleBrief from the supported motion vocabulary.');
    }
    for (const field of ['bg', 'primary', 'accent', 'text']) {
      if (!/^#[0-9a-f]{6}$/i.test(brief.palette?.[field] || '')) throw new Error(`AI returned an invalid styleBrief palette color: ${field}.`);
    }
    if (contrastRatio(brief.palette.text, brief.palette.bg) < 4.5) {
      throw new Error('AI styleBrief text/background contrast is below the 4.5:1 accessibility threshold.');
    }

    const requestedDuration = this.requestedDurationSec(input);
    const plannedDuration = this.actualTimelineDurationSec(parsed.scenePlan);
    const narrationWords = parsed.scenePlan.reduce((total: number, scene: any) => total + (String(scene?.narration || '').match(/\S+/g) || []).length, 0);
    const narrationBudget = Math.floor((requestedDuration || plannedDuration) * 1.5);
    if (narrationWords > narrationBudget) {
      throw new Error(`Narration is ${narrationWords} words; the ${requestedDuration || plannedDuration}s target allows at most ${narrationBudget} words (1.5 words/second).`);
    }
    if (requestedDuration && Math.abs(plannedDuration - requestedDuration) > 0.001) {
      throw new Error(`AI planned a ${plannedDuration.toFixed(2)}s rendered timeline after transition overlaps, but the request requires exactly ${requestedDuration}s.`);
    }
    if (parsed.scenePlan.length < 7 || parsed.scenePlan.length > 9) {
      throw new Error(`AI returned ${parsed.scenePlan.length} scenes; every video must contain 7-9 scenes.`);
    }

    const renderTypes = new Set<string>(SUPPORTED_RENDER_TYPES);
    const templates = new Set<string>(SUPPORTED_TEMPLATES);
    parsed.scenePlan.forEach((scene: any, index: number) => {
      const label = `scene ${index + 1}`;
      if (scene.scene_number !== index + 1) throw new Error(`AI scene numbering is invalid at ${label}.`);
      if (!Number.isFinite(scene.duration_sec) || scene.duration_sec < 2.5 || scene.duration_sec > 5) {
        throw new Error(`AI returned a duration outside the 2.5-5 second quality range for ${label}.`);
      }
      if (!['hook', 'body', 'cta'].includes(scene.role)) throw new Error(`AI returned no valid hook/body/cta role for ${label}.`);
      if (!templates.has(scene.template)) throw new Error(`AI returned no supported reusable template for ${label}.`);
      if (index === 0 && scene.role !== 'hook') throw new Error('The first scene must be a hook.');
      if (index === parsed.scenePlan.length - 1 && scene.role !== 'cta') throw new Error('The final scene must be a CTA.');
      if (index > 0 && index < parsed.scenePlan.length - 1 && scene.role !== 'body') throw new Error(`Only the first and last scenes may be hook/cta roles (${label}).`);
      if (typeof scene.on_screen_text !== 'string' || scene.on_screen_text.trim().split(/\s+/).length > 6) throw new Error(`Headline exceeds six words for ${label}.`);
      if (typeof scene.on_screen_text !== 'string' || scene.on_screen_text.trim().length > 40) throw new Error(`Headline exceeds 40 characters for ${label}.`);

      const blueprint = scene.visual_blueprint;
      if (!blueprint || !Array.isArray(blueprint.objects) || blueprint.objects.length < 2 || blueprint.objects.length > 5) {
        throw new Error(`AI returned an incomplete visual blueprint for ${label}; require 2-${MAX_BLUEPRINT_OBJECTS_PER_SCENE} objects.`);
      }

      const objectIds = new Set<string>();
      blueprint.objects.forEach((object: any, objectIndex: number) => {
        if (!object || typeof object.id !== 'string' || objectIds.has(object.id) || !object.render_spec || !renderTypes.has(object.render_spec.type)) {
          throw new Error(`AI returned an invalid visual blueprint object ${objectIndex + 1} for ${label}.`);
        }
        objectIds.add(object.id);
      });
      this.validateTemplateRequirements(scene, index);
    });

    if (this.isWebsiteVisit(input)) {
      const variants = new Set(['hero', 'about-grid', 'product-split', 'contact']);
      parsed.scenePlan.forEach((scene: any, index: number) => {
        const view = scene.visual_blueprint?.website_view || scene.website_view;
        if (!view || typeof view.url !== 'string' || !variants.has(view.layout_variant)) {
          throw new Error(`AI returned no complete website tour view for scene ${index + 1}.`);
        }
      });
    }
  }

  protected buildProductionPrompt(
    req: ResearchAndScriptRequest,
    productionSkill: string,
    researchSkill: string,
    rendererContract: Record<string, unknown>,
    shouldKeepNarration: boolean,
    preparationDossier?: PreparedMotionDossier
  ): string {
    const isRevision = !!req.changeRequestFeedback;
    const requestedDuration = this.requestedDurationSec(req);
    const websiteTour = this.isWebsiteVisit(req);
    const researchRequired = this.requiresResearch(req);
    const videoComplexity = this.videoComplexity(req);
    const selectedThemeObj = req.selectedTheme ? getThemeById(req.selectedTheme) : undefined;
    const themeDirective = selectedThemeObj
      ? `USER-SELECTED MOTION GRAPHICS THEME:
- Theme: "${selectedThemeObj.name}" (ID: ${selectedThemeObj.id})
- Tagline: ${selectedThemeObj.tagline}
- Target Archetype: ${selectedThemeObj.archetype}
- Required Palette: Background: ${selectedThemeObj.palette.bg}, Surface: ${selectedThemeObj.palette.surface}, Primary: ${selectedThemeObj.palette.primary}, Accent: ${selectedThemeObj.palette.accent}, Text: ${selectedThemeObj.palette.text}
- Required Fonts: Heading: ${selectedThemeObj.fonts.heading}, Body: ${selectedThemeObj.fonts.body}
- Motion Personality: ${selectedThemeObj.motionPersonality}
- Background System: ${selectedThemeObj.background}
- SFX Pack: ${selectedThemeObj.sfxPack}
- Bed Mood: ${selectedThemeObj.bedMood}
- Theme & Asset Search Directives:
  ${selectedThemeObj.assetPromptGuide}

MANDATORY THEME COMPLIANCE:
- Set styleBrief.archetype strictly to "${selectedThemeObj.archetype}".
- Set styleBrief.motionPersonality to "${selectedThemeObj.motionPersonality}".
- Set styleBrief.background to "${selectedThemeObj.background}".
- Set styleBrief.sfxPack to "${selectedThemeObj.sfxPack}".
- Set styleBrief.bedMood to "${selectedThemeObj.bedMood}".
- Set styleBrief.palette to bg="${selectedThemeObj.palette.bg}", primary="${selectedThemeObj.palette.primary}", accent="${selectedThemeObj.palette.accent}", text="${selectedThemeObj.palette.text}".
- All visual scenes and blueprints MUST follow this theme's layout and asset guidance.`
      : '';

    const taskDirective = researchRequired
      ? 'You are a Senior Video Production Director, Academic Researcher, and Remotion Expert acting in accordance with repository production rules and the deep-researcher skill. You MUST conduct deep, multi-query scholarly/technical web research across multiple independent authoritative websites to extract verified mechanisms, quantitative facts, and 3-5 primary academic/institutional sources.'
      : 'You are a Senior Video Production Director creating a fast offline creative animation plan. Use only the submitted content and common visual semantics; do not browse the web, call tools, read files, expand skills, or perform research.';
    const researchDirective = researchRequired
      ? `LIVE DEEP RESEARCH DIRECTIVE (Governed by .agents/skills/deep-researcher/SKILL.md):
- You MUST conduct deep, multi-angle scholarly and technical web research across MULTIPLE distinct authoritative websites using web search.
- Multi-query angles to investigate across different websites:
  1) Mechanism & Causality: How does it work at a physical/biochemical/computational level?
  2) Concrete Measurements & Metrics: Exact numbers, speeds, frequencies, percentages, dates, and quantitative thresholds for on-screen counters.
  3) Primary Literature & Breakthrough Papers: Landmark peer-reviewed papers, patents, or institutional reports.
  4) Visual & Spatial Entities: Real physical structures, vectors, and diagrams that accurately represent the concept.
- You MUST return at least 3-5 distinct, authoritative primary sources from DIFFERENT web domains in the "sources" field (e.g. .edu, .gov, nih.gov, science.org, nature.com, pnas.org, official documentation).
- STRICTLY FORBIDDEN: Relying on Wikipedia or Wikimedia Commons as the sole source. Wikipedia/Wikimedia alone is strictly rejected. Every topic must cite at least 3 distinct primary external web sources.
- Also search for the best relevant real images and downloadable GLB models needed by the scene plan.
- Do NOT run shell commands, do not create or edit files. Return ONLY the final JSON schema.`
      : 'CREATIVE-ONLY DIRECTIVE: This is a small visual animation request, not a research task. Do not use web search, browser tools, shell commands, or skill expansion. Return the complete JSON plan directly. Set sources to an empty array and write researchNotes/factCheckNotes as brief statements that no external research was requested.';
    const complexityDirective = videoComplexity === 'simple-motion'
      ? 'VIDEO COMPLEXITY: simple-motion. The user wants a focused object-action story. Keep the causal action clear—introduce the subject, show the action step by step, show the destination/result, then close with a relevant CTA. Use the full renderable scene schema and motion/audio requirements; simple means focused, not low quality.'
      : 'VIDEO COMPLEXITY: production-explainer. Build a richer narrative arc with evidence, mechanisms, comparisons, or researched context as supported by the submitted content. Use the full renderable scene schema and content-specific motion/audio requirements.';

    const preparationDirective = preparationDossier
      ? contentPreparationService.formatDossierForPrompt(preparationDossier)
      : '';

    return `REQUIRED ORDER: First read and follow the repository video-production skill, the deep-researcher skill (if research-required), and the project renderer contract below. The actual project renderer contract is authoritative where the skill lists generic defaults. Second, use web search to deeply research the submitted content across multiple angles and select suitable asset candidates. Third, create the scene plan using only supported project capabilities. Do not plan first and research afterward.

${researchSkill ? `REPOSITORY DEEP-RESEARCHER SKILL (.agents/skills/deep-researcher/SKILL.md):\n${researchSkill}\n\n` : ''}REPOSITORY VIDEO-PRODUCTION SKILL (.agents/skills/video-production-director/SKILL.md):
${productionSkill}

ACTUAL PROJECT RENDERER CONTRACT (generated from the installed Remotion project and backend validators):
${JSON.stringify(rendererContract, null, 2)}

${taskDirective}

${complexityDirective}

${preparationDirective}

TASK: Create one original, content-specific script and screen motion plan based only on the submitted content. Do not reuse a previous topic, example, stock phrase, stock metric, stock concept node, or generic fallback. Every scene must explain a real idea from this content.

${researchDirective}
Research workflow: verify content facts first using authoritative web sources, then search for the most relevant open-license images or self-contained GLB models only when they improve the explanation. Return direct asset URLs and provenance in the plan. Never download files in the read-only CLI; after Gate 1 the backend owns downloading into the project folder and returns project-local URLs to the Remotion props. Do not emit TSX, stand-alone audio files, or extra video deliverables. The production architecture uses 1 master audio track containing the full voiceover, object SFX, and ambient bed mixed together. Remotion renders the TSX composition with 1 master audio file.

BEGIN SUBMITTED CONTENT
${req.topicOrContent}
END SUBMITTED CONTENT
INPUT TYPE: ${req.inputType}
${themeDirective ? `\n${themeDirective}\n` : ''}
BACKEND-CONTROLLED PRODUCTION RULES:
${BACKEND_PRODUCTION_RULES}
${requestedDuration ? `TARGET DURATION: final rendered composition exactly ${requestedDuration} seconds. Hard narration limit: at most ${Math.floor(requestedDuration * 1.5)} spoken words TOTAL across all scenes (1.5 words/second). Count every spoken word before returning JSON. Spread the words across 7-9 scenes proportionally to their duration; aim for no more than ${Math.max(1, Math.floor((requestedDuration * 1.5) / 8))} words per scene on average. If the submitted content is too broad, select the most important points and omit secondary details. Never exceed the total word limit. Keep at least 0.27 seconds of audio tail per scene. Scene durations must sum to target plus transition overlap frames divided by 30 fps.` : ''}
${this.requiresImportedImage(req) ? 'IMPORTED IMAGE REQUIREMENT: Include at least one real image object with render_spec.type "image". The AI must web-search and select the best relevant open-license image, then return its direct downloadable file URL as asset_download_url, its source page as asset_source_url, exact asset_license, and any required asset_attribution. Keep it in the visual safe area; never place it under the text safe area.' : ''}
${this.requiresSceneRelevantImages(req) ? 'EDUCATIONAL SUBJECT IMAGE REQUIREMENT: This request teaches a visual subject. Every scene must include at least one AI-selected image object directly relevant to that scene (for example, each fruit scene must show that fruit). Give each image a specific asset_query matching the object subject, use a verified direct download URL and license, and never reuse a different scene or object image as a fallback.' : ''}
${this.requiresProduct3D(req) ? 'PRODUCT 3D REQUIREMENT: Include at least one content-specific 3D object. The AI must web-search for a relevant, openly licensed downloadable GLB and return model_download_url, asset_source_url, asset_license, and asset_attribution. For a keyboard, the model must be an actual keyboard, not a generic vector or text object. If no suitable licensed downloadable model can be verified, state that in the object detail and use a content-specific procedural 3D object.' : ''}
${websiteTour ? 'WEBSITE TOUR REQUIREMENT: This is a real website-visit video, not an abstract explainer. Every scene must show a different animated browser viewport state. Add visual_blueprint.website_view with url, route, section, layout_variant (hero|about-grid|product-split|contact), nav_items, hero_label, hero_heading, hero_body, panels (at least two objects with title/body/accent hex), and cta. Use page-specific content verified from the submitted website. Do not reuse the same card layout across scenes.' : ''}
${isRevision ? `REVISION FEEDBACK: "${req.changeRequestFeedback}". Update the scene plan accordingly while maintaining narrative continuity.` : ''}
${shouldKeepNarration ? `RULE #7: Preserve the approved voice narration: "${req.existingNarration}". Dynamically update only the visual direction, typography, and motion cues.` : ''}

NON-NEGOTIABLE SKILL RULES:
0. You are not merely an explainer; you are a senior short-form video director. Build a visual story with a hook, escalating visual evidence, a clear payoff, and a final CTA. Treat every scene as a designed shot with a subject, camera behavior, readable typography, and a purposeful transition. Work within the renderer contract; do not invent scene fields, object types, library model IDs, packages, TSX components, canvas sizes, or timing limits.
1. Never produce a video that is only static images. Every scene needs real, purposeful motion.
2. Provide concise, captivating voice-over narration. The total spoken narration must stay at or below ${requestedDuration ? `${Math.floor(requestedDuration * 1.5)} words for ${requestedDuration} seconds` : '1.5 words per second of requested runtime'}. Count the scene narration words before returning. Preserve only the key ideas needed for the story; do not exceed the limit to make the explanation more complete.
2a. For each scene, decide whether an actual image or 3D file improves understanding. When selecting one, put its exact direct file URL, source page, license, and attribution in that object\'s render_spec. asset_queries are planning notes only; the backend downloads only the exact returned URLs after Gate 1 and does not choose replacement media. If a real asset is unavailable or unsuitable, author accurate vectors/procedural geometry instead. A shared model_id must exactly match one of the IDs in the supplied capability contract.
3. Design a unique color scheme, visual motif, and kinetic animation tailored specifically to this topic. First choose and explain a top-level styleBrief from the supported renderer vocabulary; every scene must inherit its palette, font, background, motion personality, transition set, SFX pack, and bed mood.
3a. Return a top-level styleProfile with one selected family (cinematic-neon, editorial-paper, playful-pop, technical-terminal, or documentary-grid), a topic-specific motif, five hex colors, a motion_language, and a transition_language. Do not default every project to dark neon or the same browser treatment.
4. Produce 7-9 scenes whose final rendered timeline after transition overlaps is ${requestedDuration ? `exactly ${requestedDuration} seconds` : '25-40 seconds'}. The first scene MUST be role "hook", template "question-hook", and its on_screen_text MUST be a real question ending in "?" or "؟". The final scene MUST be role "cta", template "cta-outro", and its on_screen_text or subtitle MUST contain an explicit viewer action such as follow, save, share, like, subscribe, learn, try, comment, visit, watch, or join. Middle scenes MUST use role "body". For each scene, specify the complete required field set below. Do not omit fields, replace them with generic filler, or rely on the renderer to invent content:
   - scene_number (integer)
   - role (exactly one "hook" first, "body" for middle scenes, and "cta" last)
   - template (one of hero-object, split-compare, stat-callout, list-reveal, quote-focus, timeline, steps-numbered, map-pin, chart-bar, before-after, question-hook, cta-outro, product-showcase, fact-card, icon-grid; vary templates so no template repeats 3 times in a row)
   - duration_sec (number between 2.5 and 5; include transition overlaps when calculating the total scene duration)
   - on_screen_text (bold, kinetic title strictly 3-6 words, under 40 characters; scene 1 must end with ?)
   - subtitle (punchy 1-sentence concept explanation)
   - key_takeaways (array of 2 to 4 short bullet points explaining the mechanism, max 6 words each; for split-compare or before-after, provide exactly 2 takeaways or 2 concept_nodes representing the two sides; for list-reveal, steps-numbered, timeline, or icon-grid, provide at least 3 items)
   - concept_nodes (array of objects with "label" and "sub" representing real content-specific steps or entities; use [] when not useful; for split-compare provide exactly 2 nodes for the two compared items)
   - metric_data (object with "label", "value" number 0-100, and "unit" only when the content supports a meaningful metric; otherwise null)
   - image_search_query (specific search phrase for an open educational diagram or illustration, or null when a procedural visual is more accurate)
   - visual_direction (layout, camera push/pan, visual structure)
   - visual_type (always "blueprint" for new plans; the reusable template is provided separately)
   - visual_blueprint (required, content-specific and different for every scene; include 2-${MAX_BLUEPRINT_OBJECTS_PER_SCENE} objects):
     { "purpose": "what this scene explains visually", "layout": "free-form composition with normalized object positions", "camera_motion": "specific camera movement", "asset_queries": ["relevant Wikimedia/Openverse search phrases"], "objects": [
     { "id": "unique object id", "label": "content-specific label", "detail": "short explanation", "x": 0.5, "y": 0.5, "to_x": 0.6, "to_y": 0.45, "scale": 1, "rotation": 0, "color": "#RRGGBB", "motion": "exact frame-driven motion", "motion_plan": { "enter_frame": 12, "hold_start_frame": 30, "hold_end_frame": 112, "exit_frame": 132, "stagger_frames": 5, "easing": "spring|easeOut|linear", "idle": "float|pulse|orbit|shimmer|drift", "focal": true }, "render_spec": { "type": "vector|image|text|3d", "primitive": "sphere|cube|torus|cylinder|molecule|keyboard when type is procedural 3d", "model_id": "optional exact ID from installed shared GLB", "asset_download_url": "direct downloadable image URL when type is image", "model_download_url": "direct downloadable GLB URL when type is 3d and an external model is selected", "asset_source_url": "source page URL", "asset_license": "verified license name", "asset_attribution": "required attribution text or empty for CC0/public domain", "viewBox": [0, 0, 1000, 700], "paths": [{ "d": "content-specific SVG path", "fill": "#RRGGBB", "stroke": "#RRGGBB", "strokeWidth": 4 }], "circles": [], "rects": [], "lines": [], "polygons": [], "text": "optional text", "asset_query": null } }
     ] }${websiteTour ? ', "website_view": { "url": "https://example.com", "route": "/", "section": "Hero", "layout_variant": "hero", "nav_items": ["Home", "About"], "hero_label": "site label", "hero_heading": "page-specific heading", "hero_body": "page-specific body", "panels": [{ "title": "content-specific panel", "body": "what the visitor sees", "accent": "#2EC4B6" }, { "title": "another panel", "body": "why it matters", "accent": "#F59E0B" }], "cta": "page-specific call to action" }' : ''}
      Author the actual vector paths/shapes, select a relevant downloaded image, choose a named shared-library 3D model when one is installed, or choose a procedural 3D primitive when depth explains the submitted content (molecules, organs, planets, machines, devices, or spatial mechanisms). Keep each scene visually clear and focused with 2-4 primary objects (1 hero focal element + 1-2 key labels or indicators; do not exceed 4 objects per scene) with concise SVG paths. Every object must have a purposeful motion description. Any image or 3D model object must appear visibly animated in the shot; a static placement alone does not satisfy the motion requirement. Design object entrance, travel/rotation/reveal, and exit so the visuals and their generated sound cues share the same event timing. Do not choose from a fixed object-kind list. Every object must be visually distinct through its geometry, placement, styling, label, or motion and explain a real part of the submitted content. Reusing a primitive is allowed when the objects have different visual placement or purpose. Never return a generic diagram, network, metric, or headline template. Keep each vector shape list at or below 16 entries.
   - theme_color (hex color matching the topic's mood)
   - motion_cue (explicit description of what moves: spring entrance, scale zoom, path draw-on, staggered reveal)
   - continuity_to_next (what visual element or camera motion carries over into the next scene; for the final scene specify "None (final scene)")
   - transition_out_frames (integer 8-15 for every scene except the last; use a directional overlap transition, never a fade to black)
   - narration (complete voice-over for this scene; keep it to at most 1.7 words per planned second so natural speech fits without stretching the video)

CRITICAL OUTPUT FORMAT REQUIREMENTS:
1. Return ONLY the raw, complete JSON object.
2. Do NOT truncate or abbreviate the JSON with "...", "etc.", or summaries like "[ 7 scenes ... ]".
3. Output the full text of all scenes directly in your response starting with { and ending with }.
4. Ensure valid standard JSON syntax: double quotes on all keys and strings, no single quotes, no trailing commas, no unescaped newlines.

Respond with ONLY a valid JSON object matching this schema:
{
  "topicInterpretation": "detailed narrative arc and thematic interpretation of this exact content",
  "researchNotes": "accurate context, mechanism breakdowns, and explanations",
  "sources": ${researchRequired ? `[
    { "title": "name of verified source or publication", "url": "https://...", "note": "what it supports" }
  ]` : '[]'},
  "factCheckNotes": "verification notes and cross-checked facts",
  "styleBrief": {
    "archetype": "kinetic-type|isometric-diagram|data-story|paper-cutout|neo-brutalist|glass-ui|blueprint-technical|retro-terminal",
    "palette": { "bg": "#RRGGBB", "primary": "#RRGGBB", "accent": "#RRGGBB", "text": "#RRGGBB" },
    "fonts": { "heading": "Arial|Georgia|Trebuchet MS|Courier New|Impact", "body": "Arial|Georgia|Trebuchet MS|Courier New" },
    "motionPersonality": "snappy|fluid|bouncy|precise",
    "transitionSet": ["slide", "wipe", "flip", "fade", "push", "whip"],
    "background": "grid|particles|gradient-flow|halftone|lines",
    "sfxPack": "digital|organic|cinematic|playful",
    "bedMood": "short topic-specific mood"
  },
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
      "on_screen_text": "A question about this topic?",
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
          { "id": "object-1", "label": "content-specific object", "detail": "role in mechanism", "x": 0.5, "y": 0.42, "to_x": 0.56, "to_y": 0.4, "scale": 1, "rotation": 0, "color": "#2EC4B6", "motion": "spring entrance then purposeful rotation", "motion_plan": { "enter_frame": 10, "hold_start_frame": 25, "hold_end_frame": 100, "exit_frame": 120, "stagger_frames": 3, "easing": "spring", "idle": "orbit", "focal": true }, "render_spec": { "type": "vector", "viewBox": [0, 0, 1000, 700], "paths": [{ "d": "M200 350 C280 120 720 120 800 350 C720 580 280 580 200 350 Z", "fill": "#2EC4B6", "stroke": "#ffffff", "strokeWidth": 4 }] } },
          { "id": "object-2", "label": "causal flow", "detail": "what changes", "x": 0.35, "y": 0.6, "scale": 1, "rotation": 0, "color": "#F59E0B", "motion": "path draw-on", "motion_plan": { "enter_frame": 15, "hold_start_frame": 30, "hold_end_frame": 105, "exit_frame": 120, "stagger_frames": 2, "easing": "easeOut", "idle": "pulse", "focal": false }, "render_spec": { "type": "vector", "viewBox": [0, 0, 1000, 700], "lines": [{ "x1": 100, "y1": 350, "x2": 900, "y2": 350, "stroke": "#F59E0B", "strokeWidth": 12 }] } }
        ]
      },
      "narration": "the narration for this content-specific scene"
    }
  ]
}`;
  }

  protected buildRepairPrompt(basePrompt: string, repairIssues: string[], attempt: number): string {
    return `${basePrompt}

REPAIR PASS ${attempt}: The previous JSON failed one or more validation checks. Fix the complete list below in the same response:
${repairIssues.map((issue) => `- ${issue}`).join('\n')}

Return a completely corrected raw JSON object directly in your response only. Do not explain the repair, and do not abbreviate any scene with summaries or "...".
The following rules are hard requirements, not suggestions:
- scenePlan has 7-9 scenes numbered consecutively from 1
- scene 1 has role "hook", template "question-hook", and on_screen_text ending in ? or ؟
- the final scene has role "cta", template "cta-outro", and on_screen_text or subtitle includes one of: follow, save, share, like, subscribe, learn, try, comment, visit, watch, join
- every middle scene has role "body"
- every visual_blueprint has non-empty purpose, layout, camera_motion, an asset_queries array, and at least two distinct objects
- every object has a unique id, x/y values from 0 to 1, and a valid render_spec.type
- for split-compare or before-after, provide exactly two comparison sides in concept_nodes or key_takeaways; for list-reveal, steps-numbered, timeline, or icon-grid, provide at least 3 items in key_takeaways or concept_nodes
- for the final scene, continuity_to_next should be "None (final scene)"
- do not change the submitted topic or invent a generic CTA unrelated to it
Before responding, validate the first and final scene against these rules. Do not return placeholders, a partial blueprint, or another invalid repair.`;
  }

  protected abstract executePlan(
    prompt: string,
    timeoutMs: number,
    projectId: string | undefined,
    deadlineAt: number,
    fastCreative?: boolean
  ): Promise<{ output: string; tokenUsage: TokenUsage; parsed: any }>;

  abstract providerTimeoutMs(fastCreative?: boolean): number;
  abstract providerTotalTimeoutMs(fastCreative?: boolean): number;

  async generateScript(req: ResearchAndScriptRequest): Promise<ResearchAndScriptResult> {
    const isRevision = !!req.changeRequestFeedback;
    const shouldKeepNarration = Boolean(
      req.existingNarration &&
      !req.changeRequestFeedback?.toLowerCase().includes('change narration') &&
      !req.changeRequestFeedback?.toLowerCase().includes('rewrite narration')
    );

    const fastCreative = !this.requiresResearch(req);
    const videoComplexity = this.videoComplexity(req);
    const productionSkill = await readFile(path.join(projectPaths.root, '.agents/skills/video-production-director/SKILL.md'), 'utf8');
    let researchSkill = '';
    if (!fastCreative) {
      try {
        researchSkill = await readFile(path.join(projectPaths.root, '.agents/skills/deep-researcher/SKILL.md'), 'utf8');
      } catch (err: any) {
        console.warn(`[${this.name}] Note: deep-researcher skill could not be read: ${err?.message}`);
      }
    }
    const rendererContract = this.projectRenderContract();

    // Preparation Layer: Analyze content, classify domain, curate motion references & visual metaphors
    const contentStr = req.topicOrContent || (req as any).topic || 'Untitled Topic';
    const preparationDossier = contentPreparationService.prepare(contentStr, req.inputType || 'topic');

    if (req.projectId) {
      realtime.publish({
        type: 'pipeline_progress',
        projectId: req.projectId,
        stage: 'research',
        progress: 10,
        status: `Preparation layer: Synthesized ${preparationDossier.domainLabel} motion animation references`
      });
    }

    const prompt = this.buildProductionPrompt(req, productionSkill, researchSkill, rendererContract, shouldKeepNarration, preparationDossier);

    try {
      const contentStr = req.topicOrContent || (req as any).topic || 'Untitled Topic';
      console.log(`[${this.name}] Running dynamic content-driven planning for "${contentStr.slice(0, 60)}"...`);
      const timeoutMs = this.providerTimeoutMs(fastCreative);
      const totalTimeoutMs = this.providerTotalTimeoutMs(fastCreative);
      const deadlineAt = Date.now() + totalTimeoutMs;
      console.log(`[${this.name}] Planning mode: ${fastCreative ? 'creative-fast' : 'research'}; complexity: ${videoComplexity}; budget: ${Math.round(totalTimeoutMs / 1000)}s total; ${Math.round(timeoutMs / 1000)}s per attempt.`);

      let plan = await this.executePlan(prompt, timeoutMs, req.projectId, deadlineAt, fastCreative);
      let response = plan;
      let parsed = this.normalizeGeneratedPlan(plan.parsed, req);
      let validationError: Error | undefined;

      for (let repairAttempt = 0; repairAttempt < 3; repairAttempt += 1) {
        try {
          this.validatePlan(parsed, req);
          validationError = undefined;
          break;
        } catch (error: any) {
          validationError = error instanceof Error ? error : new Error(String(error));
          if (repairAttempt === 2) {
            console.error(`[${this.name}] Validation failed after ${repairAttempt} repair attempts: ${validationError.message}`);
            throw validationError;
          }

          const repairIssues = Array.from(new Set([
            validationError.message,
            ...this.collectRepairIssues(parsed, req),
          ]));
          console.warn(`[${this.name}] Plan failed validation; requesting repair ${repairAttempt + 1}/2: ${repairIssues.join(' | ')}`);
          const repairPrompt = this.buildRepairPrompt(prompt, repairIssues, repairAttempt + 1);
          plan = await this.executePlan(repairPrompt, timeoutMs, req.projectId, deadlineAt, fastCreative);
          response = plan;
          parsed = this.normalizeGeneratedPlan(plan.parsed, req);
        }
      }
      if (validationError) throw validationError;

      return {
        topicInterpretation: parsed.topicInterpretation,
        researchNotes: parsed.researchNotes,
        sources: parsed.sources,
        factCheckNotes: parsed.factCheckNotes,
        narration: shouldKeepNarration ? req.existingNarration! : parsed.narration,
        scenePlan: parsed.scenePlan,
        styleBrief: parsed.styleBrief,
        styleProfile: parsed.styleProfile as StyleProfile,
        searchStatus: 'active',
        providerName: this.name,
        tokenUsage: response.tokenUsage
      };
    } catch (error: any) {
      console.error(`[${this.name}] Provider planning failed:`, error?.message || error);
      throw new Error(`[${this.name}] Video planning failed: ${error?.message || error}`);
    }
  }

  async generateAnimationCode(req: AnimationCodeRequest): Promise<AnimationCodeResult> {
    if (!req.scenePlan.length) throw new Error(`Cannot create animation instructions without an approved ${this.name.toUpperCase()} scene plan.`);
    const totalDurationSec = this.actualTimelineDurationSec(req.scenePlan);
    const fps = 30;
    const durationInFrames = totalDurationSec * fps;

    return {
      compositionCode: `// ${this.name.toUpperCase()} scene plan consumed through isolated Remotion input props`,
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
