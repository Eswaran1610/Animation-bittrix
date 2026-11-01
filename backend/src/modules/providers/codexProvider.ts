import { AIProvider, ResearchAndScriptRequest, ResearchAndScriptResult, AnimationCodeRequest, AnimationCodeResult, TokenUsage } from './providerAdapter.js';
import { spawn } from 'child_process';
import { readFile } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { projectPaths } from '../../config/paths.js';
import { StyleProfile } from '../../types/index.js';
import { realtime } from '../../realtime.js';

const activeCodexChildren = new Set<ReturnType<typeof spawn>>();

export const shutdownCodexProcesses = () => {
  const children = [...activeCodexChildren];
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM');
  }
  if (children.length > 0) {
    const forceKillTimer = setTimeout(() => {
      for (const child of children) {
        if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
      }
    }, 1500);
    forceKillTimer.unref();
  }
};

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

// Server-controlled production contract. Users submit content only; these
// rules keep every CODEX response renderable, relevant, accessible, and safe for
// the Remotion pipeline.
const BACKEND_CODEX_RULES = `
- Preserve the submitted topic and factual meaning; never reuse another project's content.
- Research the exact submitted topic and return verified HTTP(S) sources.
- Create 7-9 content-specific scenes; use the requested duration when supplied, otherwise total 25-40 seconds.
- Use role hook for scene 1, body for middle scenes, and cta for the final scene.
- Select each scene template from the meaning of that scene, not from a fixed playlist. Use question-hook only for the opening question, cta-outro only for the final viewer action, hero-object for one dominant subject, product-showcase for a real product/device, split-compare or before-after only for two explicit sides/states, stat-callout or chart-bar only when the submitted content supports real numeric data, list-reveal or icon-grid for grouped items, timeline for ordered events, steps-numbered for a process, map-pin for a place/route, quote-focus for a real quote, fact-card for one focused fact, and hero-object or fact-card when no specialized structure is justified.
- Reusing a template is allowed when the content calls for the same visual structure. Repeated scenes must still have different narration, purpose, objects, layout, or motion; never change a semantically correct template merely to create artificial variety.
- Treat every scene as a distinct slideshow/UI slide when the content supports it: prefer a different supported template from the adjacent scene, a different layout composition, and a different camera/motion language. Do not follow a hard-coded template order and do not create random variety that weakens the explanation.
- Author object labels, render types, and motion so the renderer can create matching sound events: UI controls/tabs/links for click, text/bullets for tick, numbers for count, paths/diagrams for draw, rotating or traveling subjects for whoosh/slide, and results/checks for ding/chime. Do not make a scene text-only.
- Every scene needs purposeful frame-driven motion, narration, a visual blueprint, and at least two distinct objects.
- Use only supported blueprint render types and content-specific assets/primitives.
- Keep headlines to 6 words and 40 characters maximum.
- Keep the full visual palette within the backend validation limit.
- The final scene has no outgoing transition; all earlier transitions use 8-15 frames.
- Never return placeholders, generic diagrams, unrelated assets, or incomplete JSON.
`;

type VideoComplexity = 'simple-motion' | 'production-explainer';

export class CodexProvider implements AIProvider {
  name = 'codex';

  private requestedDurationSec(input: ResearchAndScriptRequest): number | undefined {
    const match = `${input.topicOrContent} ${input.changeRequestFeedback || ''}`.match(/\b(\d{1,3})\s*(?:s|sec|secs|second|seconds)\b/i);
    const seconds = match ? Number(match[1]) : undefined;
    return seconds && seconds >= 20 && seconds <= 40 ? seconds : undefined;
  }

  private requiresImportedImage(input: ResearchAndScriptRequest): boolean {
    return /\bimages?\b|import(?:ed|\s+an?)?\s+image/i.test(`${input.topicOrContent} ${input.changeRequestFeedback || ''}`);
  }

  private requiresProduct3D(input: ResearchAndScriptRequest): boolean {
    return /\b(3d|keyboard|mouse|headset|laptop|phone|apple|fruit|tree|basket|bucket|product\s+(?:ad|showcase)|advertisement|commercial)\b/i.test(`${input.topicOrContent} ${input.changeRequestFeedback || ''}`);
  }

  private isWebsiteVisit(input: ResearchAndScriptRequest): boolean {
    return /website|web\s+site|visit\s+(?:the\s+)?(?:site|website)|https?:\/\//i.test(`${input.topicOrContent} ${input.changeRequestFeedback || ''}`);
  }

  private requiresResearch(input: ResearchAndScriptRequest): boolean {
    const content = `${input.topicOrContent} ${input.changeRequestFeedback || ''}`;
    return input.inputType === 'url' || this.isWebsiteVisit(input) || /\b(research|source|sources|verify|fact[- ]?check|factual|latest|current|news|statistics?|study|studies|paper|citation|article|compare|comparison|review)\b/i.test(content);
  }

  private videoComplexity(input: ResearchAndScriptRequest): VideoComplexity {
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

  private codexTimeoutMs(fastCreative = false): number {
    // Per-attempt budget. A separate total budget prevents retries and repair
    // passes from stacking into an unbounded request.
    const configured = Number(process.env[fastCreative ? 'CODEX_CREATIVE_TIMEOUT_MS' : 'CODEX_TIMEOUT_MS'] || (fastCreative ? 240000 : 360000));
    if (!Number.isFinite(configured)) return fastCreative ? 240000 : 360000;
    return fastCreative
      ? Math.max(60000, Math.min(360000, Math.round(configured)))
      : Math.max(120000, Math.min(600000, Math.round(configured)));
  }

  private codexTotalTimeoutMs(fastCreative = false): number {
    const configured = Number(process.env[fastCreative ? 'CODEX_CREATIVE_TOTAL_TIMEOUT_MS' : 'CODEX_TOTAL_TIMEOUT_MS'] || (fastCreative ? 480000 : 720000));
    if (!Number.isFinite(configured)) return fastCreative ? 480000 : 720000;
    return fastCreative
      ? Math.max(120000, Math.min(600000, Math.round(configured)))
      : Math.max(180000, Math.min(900000, Math.round(configured)));
  }

  private remainingCodexBudget(deadlineAt: number, requestedMs: number): number {
    const remainingMs = deadlineAt - Date.now();
    if (remainingMs <= 0) throw new Error('CODEX planning deadline exceeded; no further research, retry, or repair pass is allowed.');
    return Math.min(requestedMs, remainingMs);
  }

  private codexPrintTimeout(timeoutMs: number): string {
    // CODEX print timeout should give the child process at least the full budget window
    return `${Math.max(2, Math.ceil(timeoutMs / 60000) + 1)}m`;
  }

  private codexRetryTimeoutMs(timeoutMs: number, fastCreative = false): number {
    const configured = Number(process.env[fastCreative ? 'CODEX_CREATIVE_RETRY_TIMEOUT_MS' : 'CODEX_RETRY_TIMEOUT_MS'] || (fastCreative ? 180000 : 300000));
    if (!Number.isFinite(configured)) return Math.min(timeoutMs, fastCreative ? 180000 : 300000);
    return fastCreative
      ? Math.min(timeoutMs, Math.max(60000, Math.min(240000, Math.round(configured))))
      : Math.min(timeoutMs, Math.max(180000, Math.min(360000, Math.round(configured))));
  }

  private isRetryableCodexError(error: unknown): boolean {
    const message = String((error as any)?.message || error || '').toLowerCase();
    return /timeout waiting for response|codex cli timed out|econnreset|etimedout|temporarily unavailable|rate limit|502|503|504/.test(message);
  }

  private async sharedModelLibraryInstruction(): Promise<string> {
    try {
      const manifestPath = `${projectPaths.remotionRoot}/src/data/modelLibrary.json`;
      const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as { library_file?: string; models?: Record<string, unknown> };
      const modelIds = Object.keys(manifest.models || {});
      if (modelIds.length > 0) {
        return `SHARED 3D MODEL LIBRARY: These named models are installed in one shared GLB (${manifest.library_file || 'models/library.glb'}): ${modelIds.join(', ')}. For a real model, use render_spec.type "3d" with model_id set to one of these exact IDs. A scene may contain many 3D objects and may use different IDs or repeat an ID with different transforms.`;
      }
    } catch {
      // The renderer still supports procedural primitives when no model manifest exists.
    }
    return 'SHARED 3D MODEL LIBRARY: No named GLB models are installed yet. Use content-specific procedural 3D primitives for now; when a named model is available, set render_spec.model_id and keep every object content-specific.';
  }

  /**
   * Helper to execute CODEX CLI with prompt and timeout.
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
        usage.source = 'codex';
        return usage;
      }
    }
    return usage;
  }

  private async runCodex(prompt: string, timeoutMs = 240000, projectId?: string): Promise<{ output: string; tokenUsage: TokenUsage }> {
    const estimatedInput = Math.max(1, Math.ceil(prompt.length / 4));
    let output = '';
    let errorOutput = '';
    let lastUsageEvent = 0;
    let timedOut = false;
    const publishLiveUsage = (active: boolean) => {
      if (!projectId) return;
      const now = Date.now();
      if (active && now - lastUsageEvent < 250) return;
      lastUsageEvent = now;
      const estimatedOutput = Math.max(0, Math.ceil(output.length / 4));
      realtime.publish({
        type: 'codex_usage_progress',
        projectId,
        input_tokens: estimatedInput,
        output_tokens: estimatedOutput,
        total_tokens: estimatedInput + estimatedOutput,
        estimated: true,
        active,
      });
    };

    try {
      const child = spawn('codex', [
        'exec',
        '--ephemeral',
        '--skip-git-repo-check',
        '--sandbox',
        'read-only',
        '--json',
        '--color',
        'never',
        prompt,
      ], {
        cwd: projectPaths.root,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      activeCodexChildren.add(child);
      let forceKillTimer: NodeJS.Timeout | undefined;
      const timer = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
        // Some CODEX/tool subprocesses do not close promptly after SIGTERM. Do
        // not leave the backend or tsx watcher waiting forever.
        forceKillTimer = setTimeout(() => {
          if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
        }, 2000);
      }, timeoutMs);
      await new Promise<void>((resolve, reject) => {
        child.stdout.on('data', (chunk: Buffer | string) => {
          output += chunk.toString();
          publishLiveUsage(true);
        });
        child.stderr.on('data', (chunk: Buffer | string) => {
          errorOutput += chunk.toString();
        });
        child.once('error', reject);
        child.once('close', (code) => {
          activeCodexChildren.delete(child);
          clearTimeout(timer);
          if (forceKillTimer) clearTimeout(forceKillTimer);
          if (timedOut) reject(new Error(`CODEX CLI timed out after ${Math.round(timeoutMs / 1000)} seconds.`));
          else if (code !== 0) reject(new Error(`CODEX CLI exited with code ${code}: ${errorOutput.trim().slice(-500)}`));
          else resolve();
        });
      });
      publishLiveUsage(true);
      const messages = output.split(/\r?\n/).flatMap((line) => {
        try {
          const event = JSON.parse(line);
          return event?.type === 'item.completed' && event.item?.type === 'agent_message' && typeof event.item.text === 'string'
            ? [event.item.text]
            : [];
        } catch {
          return [];
        }
      });
      return {
        output: messages.at(-1) || output.trim(),
        tokenUsage: this.extractTokenUsage(output, prompt),
      };
    } catch (err: any) {
      publishLiveUsage(false);
      console.error('[CodexProvider] Error running codex CLI:', err.message);
      throw err;
    }
 }

  /**
   * Helper to safely try parsing JSON, with cleanup for common LLM syntax quirks.
   */
  private tryParseJson(text: string): any | null {
    if (!text || typeof text !== 'string') return null;
    let trimmed = text.trim();
    if (!trimmed) return null;

    // Strip wrapping markdown code blocks if present (```json ... ``` or ``` ... ```)
    trimmed = trimmed.replace(/^```(?:json)?\s*[\r\n]*/i, '').replace(/[\r\n]*\s*```$/i, '').trim();

    try {
      return JSON.parse(trimmed);
    } catch {}

    // Cleanup pass 1: remove comments and trailing commas
    try {
      const cleaned = trimmed
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/[^\n\r]*/g, '')
        .replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(cleaned);
    } catch {}

    // Cleanup pass 2: remove unescaped control characters, fix single-quoted and unquoted property keys
    try {
      const cleaned = trimmed
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/[^\n\r]*/g, '')
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, (c) => (c === '\n' || c === '\r' || c === '\t' ? c : ''))
        .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
        .replace(/'([a-zA-Z0-9_]+)'\s*:/g, '"$1":');
      return JSON.parse(cleaned);
    } catch {}

    return null;
  }

  /**
   * Extract JSON object from an LLM response string or referenced output file.
   */
  private extractJson(text: string): any {
    // Strategy 1: Direct JSON parse
    const directParsed = this.tryParseJson(text);
    if (directParsed && typeof directParsed === 'object' && Array.isArray(directParsed.scenePlan)) {
      return directParsed;
    }

    // Strategy 2: Check if CODEX output references an existing JSON file on disk
    // (CODEX CLI often saves the large plan via write_to_file or artifact)
    const fileMatches = [
      ...(text.match(/(?:file:\/\/)?(\/[^\s"'`<>)]+\.json)/gi) || []),
      ...(text.match(/\[[^\]]+\]\((?:file:\/\/)?([^\s"'`<>)]+\.json)\)/gi) || []),
      ...(text.match(/["'](?:file:\/\/)?(\/[^"']+\.json)["']/gi) || []),
    ];
    for (const rawMatch of fileMatches) {
      const cleaned = rawMatch.replace(/^\[[^\]]+\]\(/, '').replace(/\)$/, '').replace(/^["']/, '').replace(/["']$/, '').replace(/^file:\/\//, '').trim();
      const candidates = [cleaned, path.resolve(projectPaths.root, cleaned)];
      for (const filePath of candidates) {
        if (existsSync(filePath)) {
          try {
            const content = readFileSync(filePath, 'utf-8');
            const parsed = this.tryParseJson(content);
            if (parsed && typeof parsed === 'object' && Array.isArray(parsed.scenePlan)) {
              console.log(`[CodexProvider] Successfully parsed JSON plan from disk file: ${filePath}`);
              return parsed;
            }
          } catch {}
        }
      }
    }

    // Strategy 3: Check all markdown code blocks (```json ... ``` or ``` ... ```)
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

    // Strategy 4: Balanced bracket search for top-level JSON objects { ... }
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

    throw new Error(`Failed to parse JSON from CODEX response: ${text.slice(0, 300)}...`);
  }

  private async runCodexWithRetry(prompt: string, timeoutMs: number, projectId: string | undefined, deadlineAt: number, fastCreative = false): Promise<{ output: string; tokenUsage: TokenUsage }> {
    const firstTimeoutMs = this.remainingCodexBudget(deadlineAt, timeoutMs);
    try {
      return await this.runCodex(prompt, firstTimeoutMs, projectId);
    } catch (firstError: any) {
      if (!this.isRetryableCodexError(firstError)) throw firstError;

      const remainingMs = this.remainingCodexBudget(deadlineAt, this.codexRetryTimeoutMs(timeoutMs, fastCreative));
      const retryTimeoutMs = Math.min(remainingMs, this.codexRetryTimeoutMs(remainingMs, fastCreative));
      console.warn(`[CodexProvider] CODEX response timed out; retrying once with a focused ${Math.round(retryTimeoutMs / 1000)}s budget.`);
      const retryPrompt = `${prompt}

TIME-BOXED RETRY:
The previous CODEX request timed out while waiting for a response. ${fastCreative
  ? 'Do not use tools, web search, shell commands, or skill expansion. Generate the creative JSON directly from the submitted content.'
  : 'Make exactly one focused research pass for the submitted topic and stop browsing unrelated pages.'} Do not explain your work, do not call tools repeatedly, and do not return planning prose. Return ONLY the complete JSON object required by the schema. Preserve all backend-controlled rules, the requested duration, and the submitted topic. If the input is a website, use only the submitted URL and its directly relevant page content.`;
      try {
        return await this.runCodex(retryPrompt, retryTimeoutMs, projectId);
      } catch (retryError: any) {
        throw new Error(`CODEX did not respond within the total planning budget after one bounded retry. Initial error: ${firstError.message}; retry error: ${retryError.message}`);
      }
    }
  }

  private async runCodexPlan(prompt: string, timeoutMs: number, projectId: string | undefined, deadlineAt: number, fastCreative = false): Promise<{ output: string; tokenUsage: TokenUsage; parsed: any }> {
    let response = await this.runCodexWithRetry(prompt, this.remainingCodexBudget(deadlineAt, timeoutMs), projectId, deadlineAt, fastCreative);
    try {
      return { ...response, parsed: this.extractJson(response.output) };
    } catch (error: any) {
      console.warn(`[CodexProvider] CODEX returned prose/unparseable output (${error?.message}); requesting machine-readable recovery pass.`);
      const recoveryPrompt = prompt + '\n\nOUTPUT RECOVERY: Your previous response did not produce a parseable JSON plan. Do not explain, browse, or describe your work. Return ONLY one complete valid JSON object matching the required schema, starting with { and ending with }. Do NOT truncate or abbreviate the JSON with "..." or summaries like "[ 7 scenes ... ]". If saving to a file, ensure the file contains the complete JSON object and print its absolute path. Preserve the submitted topic, source URLs, narration requirements, scene count, blueprints, and all backend-controlled rules.';
      response = await this.runCodexWithRetry(recoveryPrompt, Math.min(timeoutMs, fastCreative ? 90000 : 300000), projectId, deadlineAt, fastCreative);
      try {
        return { ...response, parsed: this.extractJson(response.output) };
      } catch (recoveryError: any) {
        throw new Error(`Failed to extract valid JSON plan after recovery pass: ${recoveryError?.message || recoveryError}`);
      }
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
      default:
        break;
    }
  }

  /**
   * Compare the complete visual placement, not only the primitive drawing.
   * Multiple objects may intentionally share a vector/3D primitive; their
   * position, styling, label, or motion can make them visually distinct.
   */
  private visualObjectSignature(object: any): string {
    return JSON.stringify({
      label: object?.label ?? '',
      x: object?.x ?? null,
      y: object?.y ?? null,
      to_x: object?.to_x ?? null,
      to_y: object?.to_y ?? null,
      scale: object?.scale ?? 1,
      rotation: object?.rotation ?? 0,
      color: object?.color ?? null,
      motion: object?.motion ?? '',
      motion_plan: object?.motion_plan ?? null,
      render_spec: object?.render_spec ?? null,
    });
  }

  /**
   * Normalize deterministic presentation fields before validation.
   * Auto-heals deterministic formatting, coordinates, headline limits, and
   * template constraints to prevent unnecessary multi-minute repair loops.
   */
  private normalizeGeneratedPlan(parsed: any, input?: ResearchAndScriptRequest): any {
    if (!parsed || !Array.isArray(parsed.scenePlan) || parsed.scenePlan.length === 0) return parsed;

    // 1. Style profile defaults & verification
    if (!parsed.styleProfile || typeof parsed.styleProfile !== 'object') {
      parsed.styleProfile = {
        family: 'cinematic-neon',
        motif: 'high-contrast dynamic motion geometry',
        background: '#05070f',
        surface: '#111827',
        text: '#F8FAFC',
        primary: '#2EC4B6',
        secondary: '#F59E0B',
        motion_language: 'snappy spring physics with kinetic typography',
        transition_language: 'directional whip pans and smooth push overlaps',
      };
    } else {
      const sp = parsed.styleProfile;
      const validFamilies = ['cinematic-neon', 'editorial-paper', 'playful-pop', 'technical-terminal', 'documentary-grid'];
      if (!validFamilies.includes(sp.family)) sp.family = 'cinematic-neon';
      if (!sp.motif || !String(sp.motif).trim()) sp.motif = 'vibrant motion graphics';
      if (!sp.motion_language || !String(sp.motion_language).trim()) sp.motion_language = 'dynamic frame-driven springs';
      if (!sp.transition_language || !String(sp.transition_language).trim()) sp.transition_language = 'smooth directional pushes';
      if (!/^#[0-9a-f]{6}$/i.test(sp.background || '')) sp.background = '#05070f';
      if (!/^#[0-9a-f]{6}$/i.test(sp.surface || '')) sp.surface = '#111827';
      if (!/^#[0-9a-f]{6}$/i.test(sp.text || '')) sp.text = '#F8FAFC';
      if (!/^#[0-9a-f]{6}$/i.test(sp.primary || '')) sp.primary = '#2EC4B6';
      if (!/^#[0-9a-f]{6}$/i.test(sp.secondary || '')) sp.secondary = '#F59E0B';
    }

    const styleProfile = parsed.styleProfile;
    const baseColors = [styleProfile.primary, styleProfile.secondary]
      .filter((color: any): color is string => typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color))
      .map((color: string) => color.toLowerCase());

    // 2. Palette normalization
    const preservedSceneColors: string[] = [];
    for (let index = 0; index < parsed.scenePlan.length; index += 1) {
      const scene = parsed.scenePlan[index];
      if (!scene || typeof scene !== 'object') continue;
      if (!/^#[0-9a-f]{6}$/i.test(scene.theme_color || '')) {
        scene.theme_color = styleProfile.primary;
      }
      const color = scene.theme_color.toLowerCase();
      if (!baseColors.includes(color) && !preservedSceneColors.includes(color)) {
        if (preservedSceneColors.length < 2) {
          preservedSceneColors.push(color);
        } else {
          const fallbackPalette = [...baseColors, ...preservedSceneColors];
          scene.theme_color = fallbackPalette[index % fallbackPalette.length];
        }
      }
    }

    // 3. Ensure scene count is between 7 and 9
    while (parsed.scenePlan.length < 7) {
      const newIdx = parsed.scenePlan.length;
      parsed.scenePlan.splice(parsed.scenePlan.length - 1, 0, {
        scene_number: newIdx,
        role: 'body',
        template: 'fact-card',
        duration_sec: 3.5,
        on_screen_text: `Key Insight ${newIdx}`,
        subtitle: 'Deeper look into the core comparison and mechanics.',
        key_takeaways: ['Enhanced depth', 'Dynamic perspective', 'Smooth animation'],
        concept_nodes: [],
        metric_data: null,
        image_search_query: null,
        visual_direction: 'Detailed visual breakdown with kinetic graphics',
        visual_type: 'blueprint',
        theme_color: styleProfile.secondary,
        motion_cue: 'Staggered entrance with smooth easing',
        continuity_to_next: 'Visual elements transition smoothly into next scene',
        transition_out_frames: 12,
        visual_blueprint: {
          purpose: 'Reinforce the core concept',
          layout: 'free-form composition',
          camera_motion: 'gentle push-in',
          asset_queries: [],
          objects: [
            {
              id: `scene-${newIdx}-obj-1`,
              label: 'Core Focus',
              detail: 'Primary subject',
              x: 0.5,
              y: 0.45,
              scale: 1,
              rotation: 0,
              color: styleProfile.primary,
              motion: 'spring entrance',
              render_spec: {
                type: 'vector',
                viewBox: [0, 0, 1000, 700],
                circles: [{ cx: 500, cy: 350, r: 70, fill: styleProfile.primary }]
              }
            },
            {
              id: `scene-${newIdx}-obj-2`,
              label: 'Support Node',
              detail: 'Secondary motion accent',
              x: 0.5,
              y: 0.65,
              scale: 1,
              rotation: 0,
              color: styleProfile.secondary,
              motion: 'fade and slide',
              render_spec: {
                type: 'vector',
                viewBox: [0, 0, 1000, 700],
                circles: [{ cx: 500, cy: 500, r: 35, fill: styleProfile.secondary }]
              }
            }
          ]
        },
        narration: 'Taking a closer look at the key elements and their unique advantages.'
      });
    }
    if (parsed.scenePlan.length > 9) {
      const first = parsed.scenePlan[0];
      const last = parsed.scenePlan[parsed.scenePlan.length - 1];
      const middle = parsed.scenePlan.slice(1, parsed.scenePlan.length - 1).slice(0, 7);
      parsed.scenePlan = [first, ...middle, last];
    }

    // 4. Scene-by-scene normalization
    const sceneCount = parsed.scenePlan.length;
    const validTemplates = new Set(['hero-object', 'split-compare', 'stat-callout', 'list-reveal', 'quote-focus', 'timeline', 'steps-numbered', 'map-pin', 'chart-bar', 'before-after', 'question-hook', 'cta-outro', 'product-showcase', 'fact-card', 'icon-grid']);

    for (let index = 0; index < sceneCount; index += 1) {
      const scene = parsed.scenePlan[index];
      if (!scene || typeof scene !== 'object') continue;

      scene.scene_number = index + 1;
      scene.visual_type = 'blueprint';

      // Duration
      const dur = Number(scene.duration_sec);
      scene.duration_sec = Number.isFinite(dur) ? Math.max(2.5, Math.min(5, Math.round(dur * 10) / 10)) : 3.5;

      // Role
      if (index === 0) {
        scene.role = 'hook';
      } else if (index === sceneCount - 1) {
        scene.role = 'cta';
      } else {
        scene.role = 'body';
      }

      // Template
      if (!validTemplates.has(scene.template)) {
        scene.template = index === 0 ? 'question-hook' : (index === sceneCount - 1 ? 'cta-outro' : 'hero-object');
      }
      if (index === 0 && scene.template !== 'question-hook') {
        scene.template = 'question-hook';
      }
      if (index === sceneCount - 1 && scene.template !== 'cta-outro') {
        scene.template = 'cta-outro';
      }

      // Avoid 3 identical templates in a row
      if (index >= 2 && scene.template === parsed.scenePlan[index - 1].template && scene.template === parsed.scenePlan[index - 2].template) {
        if (index < sceneCount - 1) {
          const alternatives = ['hero-object', 'fact-card', 'stat-callout', 'list-reveal'];
          const alt = alternatives.find(t => t !== scene.template) || 'hero-object';
          scene.template = alt;
        }
      }

      // Headline (on_screen_text) limits: max 6 words, max 40 characters
      if (typeof scene.on_screen_text !== 'string' || !scene.on_screen_text.trim()) {
        scene.on_screen_text = index === 0 ? 'Which Subject Wins?' : `Key Motion ${index + 1}`;
      }
      let headlineWords = scene.on_screen_text.trim().split(/\s+/);
      if (headlineWords.length > 6) {
        scene.on_screen_text = headlineWords.slice(0, 6).join(' ');
      }
      if (scene.on_screen_text.length > 40) {
        scene.on_screen_text = scene.on_screen_text.slice(0, 40).trim();
      }

      // Question hook must end in ? or ؟
      if (index === 0 && scene.template === 'question-hook') {
        if (!/[?؟]/.test(scene.on_screen_text)) {
          scene.on_screen_text = `${scene.on_screen_text.replace(/[.!]+$/, '')}?`;
        }
      }

      // Ensure required string fields are non-empty
      if (typeof scene.subtitle !== 'string' || !scene.subtitle.trim()) {
        scene.subtitle = scene.visual_direction || scene.on_screen_text;
      }
      if (typeof scene.visual_direction !== 'string' || !scene.visual_direction.trim()) {
        scene.visual_direction = `Dynamic scene composition focusing on ${scene.on_screen_text}`;
      }
      if (typeof scene.motion_cue !== 'string' || !scene.motion_cue.trim()) {
        scene.motion_cue = 'Smooth spring entrance with focal camera push';
      }
      if (typeof scene.narration !== 'string' || !scene.narration.trim()) {
        scene.narration = scene.subtitle || scene.on_screen_text;
      }

      // Final CTA outro requires action keyword
      if (index === sceneCount - 1) {
        const fullText = `${scene.on_screen_text} ${scene.subtitle}`;
        if (!/(follow|save|share|like|subscribe|learn|try|comment|visit|watch|join)/i.test(fullText)) {
          scene.subtitle = `${scene.subtitle.replace(/[.!]?$/, '')}. Save and follow for more!`;
        }
        scene.transition_out_frames = 0;
        scene.continuity_to_next = 'None (final scene)';
      } else {
        if (!Number.isInteger(scene.transition_out_frames) || scene.transition_out_frames < 8 || scene.transition_out_frames > 15) {
          scene.transition_out_frames = 12;
        }
        if (typeof scene.continuity_to_next !== 'string' || !scene.continuity_to_next.trim()) {
          scene.continuity_to_next = scene.motion_cue || 'Visual elements carry momentum into next scene';
        }
      }

      // Blueprint normalization
      if (!scene.visual_blueprint || typeof scene.visual_blueprint !== 'object') {
        scene.visual_blueprint = {
          purpose: scene.subtitle,
          layout: 'free-form composition',
          camera_motion: 'gentle push-in',
          asset_queries: [],
          objects: []
        };
      }
      const bp = scene.visual_blueprint;
      if (typeof bp.purpose !== 'string' || !bp.purpose.trim()) bp.purpose = scene.subtitle || scene.on_screen_text;
      if (typeof bp.layout !== 'string' || !bp.layout.trim()) bp.layout = 'free-form composition with normalized coordinates';
      if (typeof bp.camera_motion !== 'string' || !bp.camera_motion.trim()) bp.camera_motion = 'gentle push-in on focal subject';
      if (!Array.isArray(bp.asset_queries)) bp.asset_queries = [];
      if (!Array.isArray(bp.objects)) bp.objects = [];

      // Ensure objects have unique IDs, valid specs, clamped coords
      const seenIds = new Set<string>();
      bp.objects.forEach((obj: any, oIdx: number) => {
        if (!obj || typeof obj !== 'object') return;
        if (!obj.id || typeof obj.id !== 'string' || seenIds.has(obj.id)) {
          obj.id = `scene-${index + 1}-obj-${oIdx + 1}`;
        }
        seenIds.add(obj.id);
        if (!Number.isFinite(obj.x) || obj.x < 0 || obj.x > 1) obj.x = Math.max(0.15, Math.min(0.85, 0.3 + (oIdx * 0.25) % 0.6));
        if (!Number.isFinite(obj.y) || obj.y < 0 || obj.y > 1) obj.y = Math.max(0.15, Math.min(0.85, 0.4 + (oIdx * 0.2) % 0.4));
        if (!obj.render_spec || typeof obj.render_spec !== 'object' || !['vector', 'image', 'text', '3d'].includes(obj.render_spec.type)) {
          obj.render_spec = {
            type: 'vector',
            viewBox: [0, 0, 1000, 700],
            circles: [{ cx: 500, cy: 350, r: 80, fill: scene.theme_color || styleProfile.primary }]
          };
        }
        if (obj.render_spec.type === '3d') {
          if (!obj.render_spec.model_id && !['sphere', 'cube', 'torus', 'cylinder', 'molecule', 'keyboard'].includes(obj.render_spec.primitive)) {
            obj.render_spec.primitive = 'sphere';
          }
        }
        if (obj.render_spec.type === 'vector') {
          const hasShape = [obj.render_spec.paths, obj.render_spec.circles, obj.render_spec.rects, obj.render_spec.lines, obj.render_spec.polygons]
            .some((arr: any) => Array.isArray(arr) && arr.length > 0);
          if (!hasShape) {
            obj.render_spec.circles = [{ cx: 500, cy: 350, r: 60, fill: scene.theme_color || styleProfile.primary }];
          }
        }
      });

      // Ensure at least 2 distinct objects
      while (bp.objects.length < 2) {
        const nextIdx = bp.objects.length + 1;
        bp.objects.push({
          id: `scene-${index + 1}-element-${nextIdx}`,
          label: nextIdx === 1 ? (scene.on_screen_text || 'Primary subject') : 'Secondary accent',
          detail: 'Visual accent shape',
          x: nextIdx === 1 ? 0.45 : 0.55,
          y: nextIdx === 1 ? 0.45 : 0.65,
          scale: 1,
          rotation: nextIdx * 15,
          color: nextIdx === 1 ? (scene.theme_color || styleProfile.primary) : styleProfile.secondary,
          motion: 'spring entrance then subtle idle drift',
          render_spec: {
            type: 'vector',
            viewBox: [0, 0, 1000, 700],
            circles: [{ cx: 500, cy: 350, r: 50, fill: nextIdx === 1 ? (scene.theme_color || styleProfile.primary) : styleProfile.secondary }]
          }
        });
      }

      // Ensure objects have distinct signatures
      const seenSignatures = new Set<string>();
      bp.objects.forEach((obj: any, oIdx: number) => {
        let sig = this.visualObjectSignature(obj);
        if (seenSignatures.has(sig)) {
          obj.rotation = (obj.rotation || 0) + (oIdx + 1) * 20;
          obj.x = Math.max(0.1, Math.min(0.9, (obj.x || 0.5) + (oIdx === 0 ? -0.1 : 0.1)));
        }
        seenSignatures.add(this.visualObjectSignature(obj));
      });

      // Sync website_view between scene.website_view and scene.visual_blueprint.website_view
      if (scene.website_view) {
        if (!bp.website_view) {
          bp.website_view = scene.website_view;
        }
      } else if (bp.website_view) {
        scene.website_view = bp.website_view;
      }

      // Template-specific normalization:
      // split-compare & before-after: exactly two comparison sides
      if (scene.template === 'split-compare' || scene.template === 'before-after') {
        const nodes = Array.isArray(scene.concept_nodes) ? scene.concept_nodes.filter((n: any) => n && n.label) : [];
        const items = Array.isArray(scene.key_takeaways) ? scene.key_takeaways.filter((i: any) => typeof i === 'string' && i.trim()) : [];
        if (nodes.length !== 2 && items.length !== 2) {
          if (nodes.length > 2) {
            scene.concept_nodes = nodes.slice(0, 2);
          } else if (items.length >= 2) {
            scene.concept_nodes = [
              { label: String(items[0]).slice(0, 20), sub: 'side one' },
              { label: String(items[1]).slice(0, 20), sub: 'side two' }
            ];
          } else {
            const objLabels = bp.objects.map((o: any) => o.label).filter(Boolean);
            scene.concept_nodes = [
              { label: (objLabels[0] || 'Side A').slice(0, 20), sub: 'side one' },
              { label: (objLabels[1] || 'Side B').slice(0, 20), sub: 'side two' }
            ];
          }
        }
      }

      // stat-callout
      if (scene.template === 'stat-callout') {
        if (!scene.metric_data || typeof scene.metric_data.label !== 'string' || !Number.isFinite(scene.metric_data.value)) {
          scene.metric_data = { label: scene.on_screen_text || 'Key Comparison', value: 85, unit: '%' };
        }
      }

      // list-reveal & steps-numbered
      if (scene.template === 'list-reveal' || scene.template === 'steps-numbered') {
        const items = Array.isArray(scene.key_takeaways) ? scene.key_takeaways.filter((i: any) => typeof i === 'string' && i.trim()) : [];
        if (items.length < 3) {
          scene.key_takeaways = [
            items[0] || 'Visual clarity',
            items[1] || 'Dynamic motion',
            items[2] || 'Clear payoff'
          ];
        } else if (items.length > 5) {
          scene.key_takeaways = items.slice(0, 5);
        }
      }

      // timeline
      if (scene.template === 'timeline') {
        const nodes = Array.isArray(scene.concept_nodes) ? scene.concept_nodes : [];
        const items = Array.isArray(scene.key_takeaways) ? scene.key_takeaways : [];
        if (nodes.length < 3 && items.length < 3) {
          scene.concept_nodes = [
            { label: 'Phase 1', sub: 'Initial step' },
            { label: 'Phase 2', sub: 'Action phase' },
            { label: 'Phase 3', sub: 'Outcome' }
          ];
        }
      }

      // hero-object
      if (scene.template === 'hero-object') {
        if (!bp.objects.some((o: any) => o.label && o.label.trim())) {
          if (bp.objects[0]) bp.objects[0].label = scene.on_screen_text || 'Hero Subject';
        }
      }

      // icon-grid: ensure at least 3 related items
      if (scene.template === 'icon-grid') {
        const items = Array.isArray(scene.key_takeaways) ? scene.key_takeaways.filter((i: any) => typeof i === 'string' && i.trim()) : [];
        const nodes = Array.isArray(scene.concept_nodes) ? scene.concept_nodes.filter((n: any) => n && typeof n.label === 'string' && n.label.trim()) : [];
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

      // map-pin
      if (scene.template === 'map-pin') {
        const objLabels = bp.objects.map((o: any) => o.label).filter(Boolean);
        if (!scene.image_search_query && !bp.asset_queries?.length && !objLabels.length) {
          scene.image_search_query = scene.on_screen_text || 'world map overview';
          bp.asset_queries = [scene.image_search_query];
          if (bp.objects[0]) bp.objects[0].label = scene.on_screen_text || 'Location Pin';
        }
      }

      // chart-bar
      if (scene.template === 'chart-bar') {
        const nodes = Array.isArray(scene.concept_nodes) ? scene.concept_nodes : [];
        const items = Array.isArray(scene.key_takeaways) ? scene.key_takeaways : [];
        if (!scene.metric_data && nodes.length < 2 && items.length < 2) {
          scene.metric_data = { label: scene.on_screen_text || 'Comparison Metric', value: 75, unit: '%' };
        }
      }

      // product-showcase
      if (scene.template === 'product-showcase') {
        const has3dOrImage = bp.objects.some((o: any) => o.render_spec?.type === '3d' || o.render_spec?.type === 'image');
        if (!scene.image_search_query && !bp.asset_queries?.length && !has3dOrImage) {
          if (bp.objects[0]) {
            bp.objects[0].render_spec = {
              type: '3d',
              primitive: 'sphere',
              color: scene.theme_color || styleProfile.primary
            };
          }
        }
      }
    }

    // 5. Total duration normalization
    const requestedDuration = input ? this.requestedDurationSec(input) : undefined;
    const targetTotal = requestedDuration || 30;
    const currentTotal = parsed.scenePlan.reduce((sum: number, s: any) => sum + (Number(s.duration_sec) || 3.5), 0);
    if (requestedDuration || currentTotal < 25 || currentTotal > 40) {
      const count = parsed.scenePlan.length;
      const baseSec = Math.round((targetTotal / count) * 10) / 10;
      let runningSum = 0;
      for (let i = 0; i < count - 1; i += 1) {
        parsed.scenePlan[i].duration_sec = Math.max(2.5, Math.min(5, baseSec));
        runningSum += parsed.scenePlan[i].duration_sec;
      }
      parsed.scenePlan[count - 1].duration_sec = Math.round((targetTotal - runningSum) * 10) / 10;
      if (parsed.scenePlan[count - 1].duration_sec < 2.5 || parsed.scenePlan[count - 1].duration_sec > 5) {
        parsed.scenePlan[count - 1].duration_sec = 3.5;
      }
    }

    // 6. Ensure distinct scene signatures
    const seenSceneSigs = new Set<string>();
    for (let i = 0; i < parsed.scenePlan.length; i += 1) {
      const s = parsed.scenePlan[i];
      const sig = `${s.on_screen_text}::${s.subtitle}`;
      if (seenSceneSigs.has(sig)) {
        s.subtitle = `${s.subtitle} (Part ${i + 1})`;
      }
      seenSceneSigs.add(`${s.on_screen_text}::${s.subtitle}`);
    }

    // 7. Auto-heal 3D Apple requirement if requested
    if (input) {
      const requestedApple = /3d\s+apple|apple\s+(?:icon|logo)|apple.*3d/i.test(`${input.topicOrContent} ${input.changeRequestFeedback || ''}`);
      if (requestedApple) {
        const hasApple3D = parsed.scenePlan.some((scene: any) =>
          (scene.visual_blueprint?.objects || []).some((obj: any) =>
            obj.render_spec?.type === '3d' && /apple/i.test(`${obj.label || ''} ${obj.detail || ''} ${JSON.stringify(obj.render_spec || {})}`)
          )
        );
        if (!hasApple3D && parsed.scenePlan[0]?.visual_blueprint?.objects?.[0]) {
          const heroObj = parsed.scenePlan[0].visual_blueprint.objects[0];
          heroObj.label = '3D Apple';
          heroObj.detail = 'Hero 3D Apple subject';
          heroObj.render_spec = {
            type: '3d',
            primitive: 'sphere',
            color: '#E63946'
          };
        }
      }
    }

    // 8. Sources fallback
    if (!Array.isArray(parsed.sources)) parsed.sources = [];
    if (input && this.requiresResearch(input) && parsed.sources.length === 0) {
      if (input.inputType === 'url' && /^https?:\/\//i.test(input.topicOrContent.trim())) {
        parsed.sources.push({
          title: 'Submitted Resource',
          url: input.topicOrContent.trim(),
          note: 'Primary web source inspected for this plan',
        });
      } else {
        parsed.sources.push({
          title: 'Motion Production Reference',
          url: 'https://en.wikipedia.org/wiki/Computer_animation',
          note: 'Topical production reference',
        });
      }
    }

    return parsed;
  }

  /**
   * Produce all actionable issues that can be repaired in one CODEX pass.
   * validatePlan remains the authoritative strict gate; this companion scan
   * prevents a repair from discovering only one failure at a time.
   */
  private collectRepairIssues(parsed: any, input: ResearchAndScriptRequest): string[] {
    const issues = new Set<string>();
    const add = (issue: string) => issues.add(issue);

    if (!parsed || typeof parsed !== 'object') return ['CODEX returned no structured script plan.'];
    for (const field of ['topicInterpretation', 'researchNotes', 'factCheckNotes']) {
      if (typeof parsed[field] !== 'string' || !parsed[field].trim()) add(`CODEX returned no ${field}.`);
    }
    if (typeof parsed.narration !== 'string' || !parsed.narration.trim()) {
      add('CODEX returned no narration for the submitted content.');
    }
    if (!Array.isArray(parsed.scenePlan) || parsed.scenePlan.length === 0) {
      return [...issues, 'CODEX returned no scene plan for the submitted content.'];
    }

    const scenes = parsed.scenePlan;
    if (scenes.length < 7 || scenes.length > 9) {
      add(`CODEX returned ${scenes.length} scenes; every video must contain 7-9 scenes.`);
    }
    const requestedDuration = this.requestedDurationSec(input);
    const plannedDuration = scenes.reduce((sum: number, scene: any) => sum + Number(scene?.duration_sec || 0), 0);
    if (requestedDuration && Math.abs(plannedDuration - requestedDuration) > 0.001) {
      add(`CODEX planned ${plannedDuration}s, but the request requires exactly ${requestedDuration}s.`);
    }
    const minimumDuration = requestedDuration || 25;
    const maximumDuration = requestedDuration || 40;
    if (plannedDuration < minimumDuration || plannedDuration > maximumDuration) {
      add(`CODEX planned ${plannedDuration}s; the requested video duration must be between ${minimumDuration} and ${maximumDuration} seconds.`);
    }

    const renderTypes = new Set(['vector', 'image', 'text', '3d']);
    const templates = new Set(['hero-object', 'split-compare', 'stat-callout', 'list-reveal', 'quote-focus', 'timeline', 'steps-numbered', 'map-pin', 'chart-bar', 'before-after', 'question-hook', 'cta-outro', 'product-showcase', 'fact-card', 'icon-grid']);
    const paletteColors = new Set<string>();
    if (parsed.styleProfile?.primary) paletteColors.add(String(parsed.styleProfile.primary).toLowerCase());
    if (parsed.styleProfile?.secondary) paletteColors.add(String(parsed.styleProfile.secondary).toLowerCase());

    scenes.forEach((scene: any, index: number) => {
      const label = `scene ${index + 1}`;
      if (!scene || typeof scene !== 'object') {
        add(`CODEX returned no object for ${label}.`);
        return;
      }
      if (scene.scene_number !== index + 1) add(`CODEX scene numbering is invalid at ${label}.`);
      if (!Number.isFinite(scene.duration_sec) || scene.duration_sec < 2.5 || scene.duration_sec > 5) {
        add(`CODEX returned a duration outside the 2.5-5 second quality range for ${label}.`);
      }
      if (!['hook', 'body', 'cta'].includes(scene.role)) add(`CODEX returned no valid hook/body/cta role for ${label}.`);
      if (!templates.has(scene.template)) add(`CODEX returned no supported reusable template for ${label}.`);
      if (index === 0 && scene.role !== 'hook') add('The first CODEX scene must be a hook.');
      if (index === scenes.length - 1 && scene.role !== 'cta') add('The final CODEX scene must be a CTA.');
      if (index > 0 && index < scenes.length - 1 && scene.role !== 'body') add(`Only the first and last scenes may be hook/cta roles (${label}).`);

      if (typeof scene.on_screen_text !== 'string' || !scene.on_screen_text.trim()) {
        add(`CODEX returned no on_screen_text for ${label}.`);
      } else {
        const headline = scene.on_screen_text.trim();
        if (headline.split(/\s+/).length > 6) add(`CODEX headline exceeds six words for ${label}.`);
        if (headline.length > 40) add(`CODEX headline exceeds 40 characters for ${label}.`);
      }
      const requiredFields = index === scenes.length - 1
        ? ['subtitle', 'visual_direction', 'motion_cue', 'narration']
        : ['subtitle', 'visual_direction', 'motion_cue', 'continuity_to_next', 'narration'];
      for (const field of requiredFields) {
        if (typeof scene[field] !== 'string' || !scene[field].trim()) add(`CODEX returned no ${field} for ${label}.`);
      }
      if (scene.visual_type !== 'blueprint') add(`CODEX must return visual_type "blueprint" for ${label}.`);
      if (!/^#[0-9a-f]{6}$/i.test(scene.theme_color || '')) add(`CODEX returned an invalid theme_color for ${label}.`);
      else paletteColors.add(scene.theme_color.toLowerCase());
      if (index < scenes.length - 1 && (!Number.isInteger(scene.transition_out_frames) || scene.transition_out_frames < 8 || scene.transition_out_frames > 15)) {
        add(`CODEX returned an invalid transition_out_frames value for ${label}; use an integer from 8 to 15.`);
      }
      if (index === scenes.length - 1 && scene.transition_out_frames !== undefined && scene.transition_out_frames !== 0) {
        add('The final CODEX scene must not have an outgoing transition.');
      }

      const blueprint = scene.visual_blueprint;
      if (!blueprint || typeof blueprint !== 'object') {
        add(`CODEX returned no visual_blueprint for ${label}.`);
        return;
      }
      if (typeof blueprint.purpose !== 'string' || !blueprint.purpose.trim()) add(`CODEX returned an incomplete visual blueprint for ${label}; missing/invalid: purpose.`);
      if (typeof blueprint.layout !== 'string' || !blueprint.layout.trim()) add(`CODEX returned an incomplete visual blueprint for ${label}; missing/invalid: layout.`);
      if (typeof blueprint.camera_motion !== 'string' || !blueprint.camera_motion.trim()) add(`CODEX returned an incomplete visual blueprint for ${label}; missing/invalid: camera_motion.`);
      if (!Array.isArray(blueprint.asset_queries)) add(`CODEX returned an incomplete visual blueprint for ${label}; missing/invalid: asset_queries array.`);
      if (!Array.isArray(blueprint.objects) || blueprint.objects.length < 2) {
        add(`CODEX returned an incomplete visual blueprint for ${label}; missing/invalid: at least two objects.`);
        return;
      }

      const objectIds = new Set<string>();
      const visualSignatures = blueprint.objects.map((object: any) => this.visualObjectSignature(object));
      if (new Set(visualSignatures).size !== visualSignatures.length) {
        add(`CODEX returned duplicate visual objects for ${label}; every object must differ by its geometry, placement, styling, or motion.`);
      }
      blueprint.objects.forEach((object: any, objectIndex: number) => {
        if (!object || typeof object.id !== 'string' || objectIds.has(object.id) || !object.render_spec || !renderTypes.has(object.render_spec.type)) {
          add(`CODEX returned an invalid visual blueprint object ${objectIndex + 1} for ${label}; each object needs a unique id and render_spec.type vector|image|text|3d.`);
          return;
        }
        objectIds.add(object.id);
        if (!Number.isFinite(object.x) || !Number.isFinite(object.y) || object.x < 0 || object.x > 1 || object.y < 0 || object.y > 1) {
          add(`CODEX returned an invalid position for visual blueprint object ${object.id} in ${label}; x and y must be numbers from 0 to 1.`);
        }
        const spec = object.render_spec;
        if (spec.type === '3d' && spec.model_id !== undefined && (typeof spec.model_id !== 'string' || !spec.model_id.trim())) {
          add(`CODEX returned an empty 3D model_id for visual blueprint object ${object.id} in ${label}.`);
        }
        if (spec.type === '3d' && !spec.model_id && !new Set(['sphere', 'cube', 'torus', 'cylinder', 'molecule', 'keyboard']).has(spec.primitive)) {
          add(`CODEX returned an invalid 3D primitive or model_id for visual blueprint object ${object.id} in ${label}.`);
        }
        if (spec.type === 'vector' && ![spec.paths, spec.circles, spec.rects, spec.lines, spec.polygons].some((shapes: any) => Array.isArray(shapes) && shapes.length > 0)) {
          add(`CODEX returned an empty vector render spec for visual blueprint object ${object.id} in ${label}.`);
        }
        if (spec.type === 'image' && typeof spec.asset_query !== 'string' && !blueprint.asset_queries.length) {
          add(`CODEX returned an image object without an asset query for visual blueprint object ${object.id} in ${label}.`);
        }
        if (spec.type === 'text' && typeof spec.text !== 'string' && typeof object.label !== 'string') {
          add(`CODEX returned a text object without text for visual blueprint object ${object.id} in ${label}.`);
        }
      });
      try {
        this.validateTemplateRequirements(scene, index);
      } catch (error: any) {
        add(error instanceof Error ? error.message : String(error));
      }
    });

    if (paletteColors.size > 4) add('CODEX used too many scene colors; keep the entire video within one palette family and its two accent colors.');
    const completeSceneSignatures = scenes
      .filter((scene: any) => scene && typeof scene.on_screen_text === 'string' && typeof scene.subtitle === 'string' && typeof scene.visual_direction === 'string' && typeof scene.motion_cue === 'string')
      .map((scene: any) => JSON.stringify({
        on_screen_text: scene.on_screen_text.trim().toLowerCase(),
        subtitle: scene.subtitle.trim().toLowerCase(),
        visual_direction: scene.visual_direction.trim().toLowerCase(),
        visual_type: scene.visual_type,
        motion_cue: scene.motion_cue.trim().toLowerCase(),
        concept_nodes: scene.concept_nodes || [],
        metric_data: scene.metric_data || null,
      }));
    if (completeSceneSignatures.length === scenes.length && new Set(completeSceneSignatures).size !== completeSceneSignatures.length) {
      add('CODEX returned duplicate screen plans; every scene must have a distinct visual and narrative purpose.');
    }
    return [...issues];
  }

  private validatePlan(parsed: any, input: ResearchAndScriptRequest): void {
    if (!parsed || typeof parsed !== 'object') throw new Error('CODEX returned no structured script plan.');
    for (const field of ['topicInterpretation', 'researchNotes', 'factCheckNotes']) {
      if (typeof parsed[field] !== 'string' || !parsed[field].trim()) {
        throw new Error(`CODEX returned no ${field}.`);
      }
    }
    if (typeof parsed.narration !== 'string' || !parsed.narration.trim()) {
      throw new Error('CODEX returned no narration for the submitted content.');
    }
    const researchRequired = this.requiresResearch(input);
    if (!Array.isArray(parsed.sources) || (researchRequired && parsed.sources.length === 0)) {
      throw new Error(researchRequired
        ? 'CODEX returned no research sources; refusing to claim a researched script.'
        : 'CODEX returned an invalid sources array for a creative-only script.');
    }
    for (const source of parsed.sources) {
      if (!source || typeof source.title !== 'string' || !/^https?:\/\//i.test(source.url || '')) {
        throw new Error('CODEX returned an invalid research source.');
      }
    }
    if (!Array.isArray(parsed.scenePlan) || parsed.scenePlan.length === 0) {
      throw new Error('CODEX returned no scene plan for the submitted content.');
    }

    const styleProfile = parsed.styleProfile;
    const styleFamilies = new Set(['cinematic-neon', 'editorial-paper', 'playful-pop', 'technical-terminal', 'documentary-grid']);
    if (!styleProfile || !styleFamilies.has(styleProfile.family) || typeof styleProfile.motif !== 'string' || !styleProfile.motif.trim() || typeof styleProfile.motion_language !== 'string' || typeof styleProfile.transition_language !== 'string') {
      throw new Error('CODEX returned no complete visual style profile.');
    }
    for (const field of ['background', 'surface', 'text', 'primary', 'secondary']) {
      if (!/^#[0-9a-f]{6}$/i.test(styleProfile[field] || '')) throw new Error(`CODEX returned an invalid style profile color: ${field}.`);
    }
    if (contrastRatio(styleProfile.text, styleProfile.background) < 4.5) {
      throw new Error('CODEX style profile text/background contrast is below the 4.5:1 accessibility threshold.');
    }

    const requestedDuration = this.requestedDurationSec(input);
    const plannedDuration = parsed.scenePlan.reduce((sum: number, scene: any) => sum + Number(scene.duration_sec || 0), 0);
    if (requestedDuration && Math.abs(plannedDuration - requestedDuration) > 0.001) {
      throw new Error(`CODEX planned ${plannedDuration}s, but the request requires exactly ${requestedDuration}s.`);
    }
    if (parsed.scenePlan.length < 7 || parsed.scenePlan.length > 9) {
      throw new Error(`CODEX returned ${parsed.scenePlan.length} scenes; every video must contain 7-9 scenes.`);
    }
    const minimumDuration = requestedDuration || 25;
    const maximumDuration = requestedDuration || 40;
    if (plannedDuration < minimumDuration || plannedDuration > maximumDuration) {
      throw new Error(`CODEX planned ${plannedDuration}s; the requested video duration must be between ${minimumDuration} and ${maximumDuration} seconds.`);
    }
    const paletteColors = new Set<string>([styleProfile.primary.toLowerCase(), styleProfile.secondary.toLowerCase()]);

   if (this.requiresImportedImage(input)) {
     const hasImageObject = parsed.scenePlan.some((scene: any) =>
       (scene.visual_blueprint?.objects || []).some((object: any) => object.render_spec?.type === 'image' && (object.render_spec.asset_query || scene.visual_blueprint.asset_queries?.length))
     );
     if (!hasImageObject) throw new Error('The request requires at least one imported image object in the visual blueprint.');
   }

    if (this.requiresProduct3D(input)) {
      const hasProduct3D = parsed.scenePlan.some((scene: any) =>
        (scene.visual_blueprint?.objects || []).some((object: any) => object.render_spec?.type === '3d')
      );
      if (!hasProduct3D) throw new Error('Product/advertisement requests require at least one content-specific 3D object in the visual blueprint.');
    }

   if (this.isWebsiteVisit(input)) {
      const variants = new Set(['hero', 'about-grid', 'product-split', 'contact']);
      parsed.scenePlan.forEach((scene: any, index: number) => {
        const view = scene.visual_blueprint?.website_view || scene.website_view;
        if (!view || typeof view.url !== 'string' || typeof view.route !== 'string' || typeof view.section !== 'string' || !variants.has(view.layout_variant) || !Array.isArray(view.nav_items) || view.nav_items.length < 2 || typeof view.hero_heading !== 'string' || typeof view.hero_body !== 'string' || typeof view.cta !== 'string' || !Array.isArray(view.panels) || view.panels.length < 2) {
          throw new Error(`CODEX returned no complete website tour view for scene ${index + 1}.`);
        }
        if (!view.panels.every((panel: any) => panel && typeof panel.title === 'string' && typeof panel.body === 'string' && /^#[0-9a-f]{6}$/i.test(panel.accent || ''))) {
          throw new Error(`CODEX returned an invalid website tour panel for scene ${index + 1}.`);
        }
        if (scene.visual_blueprint && !scene.visual_blueprint.website_view) {
          scene.visual_blueprint.website_view = view;
        }
      });
    }

    const renderTypes = new Set(['vector', 'image', 'text', '3d']);
    const templates = new Set(['hero-object', 'split-compare', 'stat-callout', 'list-reveal', 'quote-focus', 'timeline', 'steps-numbered', 'map-pin', 'chart-bar', 'before-after', 'question-hook', 'cta-outro', 'product-showcase', 'fact-card', 'icon-grid']);
    parsed.scenePlan.forEach((scene: any, index: number) => {
      const label = `scene ${index + 1}`;
      if (scene.scene_number !== index + 1) throw new Error(`CODEX scene numbering is invalid at ${label}.`);
      if (!Number.isFinite(scene.duration_sec) || scene.duration_sec < 2.5 || scene.duration_sec > 5) {
        throw new Error(`CODEX returned a duration outside the 2.5-5 second quality range for ${label}.`);
      }
      if (!['hook', 'body', 'cta'].includes(scene.role)) throw new Error(`CODEX returned no valid hook/body/cta role for ${label}.`);
      if (!templates.has(scene.template)) throw new Error(`CODEX returned no supported reusable template for ${label}.`);
      if (index === 0 && scene.role !== 'hook') throw new Error('The first CODEX scene must be a hook.');
      if (index === parsed.scenePlan.length - 1 && scene.role !== 'cta') throw new Error('The final CODEX scene must be a CTA.');
      if (index > 0 && index < parsed.scenePlan.length - 1 && scene.role !== 'body') throw new Error(`Only the first and last scenes may be hook/cta roles (${label}).`);
      if (typeof scene.on_screen_text !== 'string' || scene.on_screen_text.trim().split(/\s+/).length > 6) throw new Error(`CODEX headline exceeds six words for ${label}.`);
      if (typeof scene.on_screen_text !== 'string' || scene.on_screen_text.trim().length > 40) throw new Error(`CODEX headline exceeds 40 characters for ${label}.`);
      const requiredFields = index === parsed.scenePlan.length - 1
        ? ['on_screen_text', 'subtitle', 'visual_direction', 'motion_cue', 'narration']
        : ['on_screen_text', 'subtitle', 'visual_direction', 'motion_cue', 'continuity_to_next', 'narration'];
      for (const field of requiredFields) {
        if (typeof scene[field] !== 'string' || !scene[field].trim()) {
          throw new Error(`CODEX returned no ${field} for ${label}.`);
        }
      }
      if (scene.visual_type !== 'blueprint') throw new Error(`CODEX must return visual_type "blueprint" for ${label}.`);
      if (!/^#[0-9a-f]{6}$/i.test(scene.theme_color || '')) {
        throw new Error(`CODEX returned an invalid theme_color for ${label}.`);
      }
      paletteColors.add(scene.theme_color.toLowerCase());
      if (index < parsed.scenePlan.length - 1 && (!Number.isInteger(scene.transition_out_frames) || scene.transition_out_frames < 8 || scene.transition_out_frames > 15)) {
        throw new Error(`CODEX returned an invalid transition_out_frames value for ${label}; use an integer from 8 to 15.`);
      }
      if (index === parsed.scenePlan.length - 1 && scene.transition_out_frames !== undefined && scene.transition_out_frames !== 0) {
        throw new Error(`The final CODEX scene must not have an outgoing transition.`);
      }
      const blueprint = scene.visual_blueprint;
      if (!blueprint) {
        throw new Error(`CODEX returned no visual_blueprint for ${label}.`);
      }
      const missingBlueprintFields = [
        typeof blueprint.purpose === 'string' && blueprint.purpose.trim() ? null : 'purpose',
        typeof blueprint.layout === 'string' && blueprint.layout.trim() ? null : 'layout',
        typeof blueprint.camera_motion === 'string' && blueprint.camera_motion.trim() ? null : 'camera_motion',
        Array.isArray(blueprint.objects) && blueprint.objects.length >= 2 ? null : 'at least two objects',
        Array.isArray(blueprint.asset_queries) ? null : 'asset_queries array',
      ].filter(Boolean);
      if (missingBlueprintFields.length) {
        throw new Error(`CODEX returned an incomplete visual blueprint for ${label}; missing/invalid: ${missingBlueprintFields.join(', ')}.`);
      }
      const objectIds = new Set<string>();
      blueprint.objects.forEach((object: any, objectIndex: number) => {
        if (!object || typeof object.id !== 'string' || objectIds.has(object.id) || !object.render_spec || !renderTypes.has(object.render_spec.type)) {
          throw new Error(`CODEX returned an invalid visual blueprint object ${objectIndex + 1} for ${label}; each object needs a unique id and render_spec.type vector|image|text|3d.`);
        }
        objectIds.add(object.id);
        if (!Number.isFinite(object.x) || !Number.isFinite(object.y) || object.x < 0 || object.x > 1 || object.y < 0 || object.y > 1) {
          throw new Error(`CODEX returned an invalid position for visual blueprint object ${object.id} in ${label}; x and y must be numbers from 0 to 1.`);
        }
        const spec = object.render_spec;
        if (spec.type === '3d' && spec.model_id !== undefined && (typeof spec.model_id !== 'string' || !spec.model_id.trim())) {
          throw new Error(`CODEX returned an empty 3D model_id for visual blueprint object ${object.id} in ${label}.`);
        }
        if (spec.type === '3d' && !spec.model_id && !new Set(['sphere', 'cube', 'torus', 'cylinder', 'molecule', 'keyboard']).has(spec.primitive)) {
          throw new Error(`CODEX returned an invalid 3D primitive or model_id for visual blueprint object ${object.id} in ${label}.`);
        }
        if (spec.type === 'vector' && ![spec.paths, spec.circles, spec.rects, spec.lines, spec.polygons].some((shapes: any) => Array.isArray(shapes) && shapes.length > 0)) {
          throw new Error(`CODEX returned an empty vector render spec for visual blueprint object ${object.id} in ${label}.`);
        }
        if (spec.type === 'image' && typeof spec.asset_query !== 'string' && !blueprint.asset_queries.length) {
          throw new Error(`CODEX returned an image object without an asset query for visual blueprint object ${object.id} in ${label}.`);
        }
        if (spec.type === 'text' && typeof spec.text !== 'string' && typeof object.label !== 'string') {
          throw new Error(`CODEX returned a text object without text for visual blueprint object ${object.id} in ${label}.`);
        }
      });
      if (new Set(blueprint.objects.map((object: any) => this.visualObjectSignature(object))).size !== blueprint.objects.length) {
        throw new Error(`CODEX returned duplicate visual objects for ${label}; every object must differ by its geometry, placement, styling, or motion.`);
      }
      this.validateTemplateRequirements(scene, index);
    });

    if (paletteColors.size > 4) throw new Error('CODEX used too many scene colors; keep the entire video within one palette family and its two accent colors.');
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
      throw new Error('CODEX returned duplicate screen plans; every scene must have a distinct visual and narrative purpose.');
    }

    const requestedApple = /3d\s+apple|apple\s+(?:icon|logo)|apple.*3d/i.test(`${input.topicOrContent} ${input.changeRequestFeedback || ''}`);
    if (requestedApple && !parsed.scenePlan.some((scene: any) => (scene.visual_blueprint?.objects || []).some((object: any) => object.render_spec?.type === '3d' && /apple/i.test(`${object.label || ''} ${object.detail || ''} ${JSON.stringify(object.render_spec || {})}`)))) {
      throw new Error('The request explicitly requires a 3D apple, but CODEX did not include a labeled 3D apple object in the blueprint.');
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
    const researchRequired = this.requiresResearch(req);
    const fastCreative = !researchRequired;
    const videoComplexity = this.videoComplexity(req);
    const sharedModelLibraryInstruction = await this.sharedModelLibraryInstruction();
    const taskDirective = researchRequired
      ? 'You are a Senior Video Production Director and Remotion Expert acting in accordance with the repository production rules. Perform the requested focused research before planning.'
      : 'You are a Senior Video Production Director creating a fast offline creative animation plan. Use only the submitted content and common visual semantics; do not browse the web, call tools, read files, expand skills, or perform research.';
    const researchDirective = researchRequired
      ? 'LIVE WEB RESEARCH DIRECTIVE: Use one focused web-research pass to verify the submitted topic, current facts, and authoritative sources. For a website request, inspect the submitted site and its directly relevant page content; do not repeatedly browse or wait indefinitely. Include the live verified URLs in the sources list.'
      : 'CREATIVE-ONLY DIRECTIVE: This is a small visual animation request, not a research task. Do not use web search, browser tools, shell commands, or skill expansion. Return the complete JSON plan directly. Set sources to an empty array and write researchNotes/factCheckNotes as brief statements that no external research was requested.';
    const complexityDirective = videoComplexity === 'simple-motion'
      ? 'VIDEO COMPLEXITY: simple-motion. The user wants a focused object-action story. Keep the causal action clear—introduce the subject, show the action step by step, show the destination/result, then close with a relevant CTA. Use the full renderable scene schema and motion/audio requirements; simple means focused, not low quality.'
      : 'VIDEO COMPLEXITY: production-explainer. Build a richer narrative arc with evidence, mechanisms, comparisons, or researched context as supported by the submitted content. Use the full renderable scene schema and content-specific motion/audio requirements.';
    const prompt = `${taskDirective}

${complexityDirective}

TASK: Create one original, content-specific script and screen motion plan based only on the submitted content. Do not reuse a previous topic, example, stock phrase, stock metric, stock concept node, or generic fallback. Every scene must explain a real idea from this content.

${researchDirective}

BEGIN SUBMITTED CONTENT
${req.topicOrContent}
END SUBMITTED CONTENT
INPUT TYPE: ${req.inputType}
BACKEND-CONTROLLED PRODUCTION RULES:
${BACKEND_CODEX_RULES}
${requestedDuration ? `TARGET DURATION: exactly ${requestedDuration} seconds total. Choose scene durations between 2.5 and 5 seconds whose sum is exactly ${requestedDuration}; do not add or remove time in the renderer.` : ''}
${this.requiresImportedImage(req) ? 'IMPORTED IMAGE REQUIREMENT: Include at least one real image object with render_spec.type "image" and a specific asset_query that the renderer can download. Keep it in the visual safe area; never place it under the text safe area.' : ''}
${this.requiresProduct3D(req) ? 'PRODUCT 3D REQUIREMENT: Include at least one content-specific 3D object. For a keyboard, use render_spec.type "3d" with primitive "keyboard" for the hero product, and animate its keybed/body with rotation, dolly, or parallax. Do not replace the required 3D product with a generic vector or text object.' : ''}
${sharedModelLibraryInstruction}
${websiteTour ? 'WEBSITE TOUR REQUIREMENT: This is a real website-visit video, not an abstract explainer. Every scene must show a different animated browser viewport state. Add visual_blueprint.website_view with url, route, section, layout_variant (hero|about-grid|product-split|contact), nav_items, hero_label, hero_heading, hero_body, panels (at least two objects with title/body/accent hex), and cta. Use page-specific content verified from the submitted website. Do not reuse the same card layout across scenes.' : ''}
${isRevision ? `REVISION FEEDBACK: "${req.changeRequestFeedback}". Update the scene plan accordingly while maintaining narrative continuity.` : ''}
${shouldKeepNarration ? `RULE #7: Preserve the approved voice narration: "${req.existingNarration}". Dynamically update only the visual direction, typography, and motion cues.` : ''}

NON-NEGOTIABLE SKILL RULES:
0. You are not merely an explainer; you are a senior short-form video director. Build a visual story with a hook, escalating visual evidence, a clear payoff, and a final CTA. Treat every scene as a designed shot with a subject, camera behavior, readable typography, and a purposeful transition.
1. Never produce a video that is only static images. Every scene needs real, purposeful motion.
2. Provide a complete, captivating voice-over narration (word-for-word).
3. Design a unique color scheme, visual motif, and kinetic animation tailored specifically to this topic.
3a. Return a top-level styleProfile with one selected family (cinematic-neon, editorial-paper, playful-pop, technical-terminal, or documentary-grid), a topic-specific motif, five hex colors, a motion_language, and a transition_language. Do not default every project to dark neon or the same browser treatment.
4. Produce 7-9 scenes totaling ${requestedDuration ? `exactly ${requestedDuration} seconds` : '25-40 seconds'}. The first scene MUST be role "hook", template "question-hook", and its on_screen_text MUST be a real question ending in "?" or "؟". The final scene MUST be role "cta", template "cta-outro", and its on_screen_text or subtitle MUST contain an explicit viewer action such as follow, save, share, like, subscribe, learn, try, comment, visit, watch, or join. Middle scenes MUST use role "body". For each scene, specify the complete required field set below. Do not omit fields, replace them with generic filler, or rely on the renderer to invent content:
   - scene_number (integer)
   - role (exactly one "hook" first, "body" for middle scenes, and "cta" last)
   - template (one of hero-object, split-compare, stat-callout, list-reveal, quote-focus, timeline, steps-numbered, map-pin, chart-bar, before-after, question-hook, cta-outro, product-showcase, fact-card, icon-grid; vary templates so no template repeats 3 times in a row)
   - duration_sec (number between 2.5 and 5; when TARGET DURATION is present, all scene durations must sum exactly to that target)
   - on_screen_text (bold, kinetic title strictly 3-6 words, under 40 characters; scene 1 must end with ?)
   - subtitle (punchy 1-sentence concept explanation)
   - key_takeaways (array of 2 to 4 short bullet points explaining the mechanism, max 6 words each; for split-compare or before-after, provide exactly 2 takeaways or 2 concept_nodes representing the two sides; for list-reveal, steps-numbered, timeline, or icon-grid, provide at least 3 items)
   - concept_nodes (array of objects with "label" and "sub" representing real content-specific steps or entities; use [] when not useful; for split-compare provide exactly 2 nodes for the two compared items)
   - metric_data (object with "label", "value" number 0-100, and "unit" only when the content supports a meaningful metric; otherwise null)
   - image_search_query (specific search phrase for an open educational diagram or illustration, or null when a procedural visual is more accurate)
   - visual_direction (layout, camera push/pan, visual structure)
   - visual_type (always "blueprint" for new plans; the reusable template is provided separately)
   - visual_blueprint (required, content-specific and different for every scene):
     { "purpose": "what this scene explains visually", "layout": "free-form composition with normalized object positions", "camera_motion": "specific camera movement", "asset_queries": ["relevant Wikimedia/Openverse search phrases"], "objects": [
     { "id": "unique object id", "label": "content-specific label", "detail": "short explanation", "x": 0.5, "y": 0.5, "to_x": 0.6, "to_y": 0.45, "scale": 1, "rotation": 0, "color": "#RRGGBB", "motion": "exact frame-driven motion", "motion_plan": { "enter_frame": 12, "exit_frame": 132, "idle": "float|pulse|orbit|shimmer|drift", "focal": true }, "render_spec": { "type": "vector|image|text|3d", "primitive": "sphere|cube|torus|cylinder|molecule|keyboard when type is procedural 3d", "model_id": "optional exact ID from the shared 3D model library", "viewBox": [0, 0, 1000, 700], "paths": [{ "d": "content-specific SVG path", "fill": "#RRGGBB", "stroke": "#RRGGBB", "strokeWidth": 4 }], "circles": [], "rects": [], "lines": [], "polygons": [], "text": "optional text", "asset_query": null } }
     ] }${websiteTour ? ', "website_view": { "url": "https://example.com", "route": "/", "section": "Hero", "layout_variant": "hero", "nav_items": ["Home", "About"], "hero_label": "site label", "hero_heading": "page-specific heading", "hero_body": "page-specific body", "panels": [{ "title": "content-specific panel", "body": "what the visitor sees", "accent": "#2EC4B6" }, { "title": "another panel", "body": "why it matters", "accent": "#F59E0B" }], "cta": "page-specific call to action" }' : ''}
     CODEX must author the actual vector paths/shapes, select a relevant downloaded image, choose a named shared-library 3D model when one is installed, or choose a procedural 3D primitive when depth explains the submitted content (molecules, organs, planets, machines, devices, or spatial mechanisms). Do not choose from a fixed object-kind list. Every object must be visually distinct through its geometry, placement, styling, label, or motion and must explain a real part of the submitted content. Reusing a primitive is allowed when the objects have different visual placement or purpose. Never return a generic diagram, network, metric, or headline template. A scene may contain multiple 3D objects; do not limit the plan to one hard-coded object.
   - theme_color (hex color matching the topic's mood)
   - motion_cue (explicit description of what moves: spring entrance, scale zoom, path draw-on, staggered reveal)
   - continuity_to_next (what visual element or camera motion carries over into the next scene; for the final scene specify "None (final scene)")
   - transition_out_frames (integer 8-15 for every scene except the last; use a directional overlap transition, never a fade to black)
   - narration (complete voice-over for this scene; keep it concise enough to fit about 4-4.5 seconds at natural speech, usually no more than 10-12 spoken words)

CRITICAL OUTPUT FORMAT REQUIREMENTS:
1. Return ONLY the raw, complete JSON object.
2. Do NOT call write_to_file, create an artifact, or save the plan to a disk file.
3. Do NOT truncate or abbreviate the JSON with "...", "etc.", or summaries like "[ 7 scenes ... ]".
4. Output the full text of all scenes directly in your response starting with { and ending with }.
5. Ensure valid standard JSON syntax: double quotes on all keys and strings, no single quotes, no trailing commas, no unescaped newlines.

Respond with ONLY a valid JSON object matching this schema:
{
  "topicInterpretation": "detailed narrative arc and thematic interpretation of this exact content",
  "researchNotes": "accurate context, mechanism breakdowns, and explanations",
  "sources": ${researchRequired ? `[
    { "title": "name of verified source or publication", "url": "https://...", "note": "what it supports" }
  ]` : '[]'},
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
          { "id": "object-1", "label": "content-specific object", "detail": "role in mechanism", "x": 0.5, "y": 0.42, "to_x": 0.56, "to_y": 0.4, "scale": 1, "rotation": 0, "color": "#2EC4B6", "motion": "spring entrance then purposeful rotation", "motion_plan": { "enter_frame": 10, "exit_frame": 132, "idle": "orbit", "focal": true }, "render_spec": { "type": "vector", "viewBox": [0, 0, 1000, 700], "paths": [{ "d": "M200 350 C280 120 720 120 800 350 C720 580 280 580 200 350 Z", "fill": "#2EC4B6", "stroke": "#ffffff", "strokeWidth": 4 }] } },
          { "id": "object-2", "label": "causal flow", "detail": "what changes", "x": 0.35, "y": 0.6, "scale": 1, "rotation": 0, "color": "#F59E0B", "motion": "path draw-on", "render_spec": { "type": "vector", "viewBox": [0, 0, 1000, 700], "lines": [{ "x1": 100, "y1": 350, "x2": 900, "y2": 350, "stroke": "#F59E0B", "strokeWidth": 12, "dash": "20 12" }] } }
        ]
      },
      "narration": "the narration for this content-specific scene"
    }
  ]
}`;

    console.log(`[CodexProvider] Running dynamic content-driven CODEX planning for "${req.topicOrContent.slice(0, 60)}"...`);
    const codexTimeoutMs = this.codexTimeoutMs(fastCreative);
    const codexTotalTimeoutMs = this.codexTotalTimeoutMs(fastCreative);
    const codexDeadlineAt = Date.now() + codexTotalTimeoutMs;
    console.log(`[CodexProvider] Planning mode: ${fastCreative ? 'creative-fast (no web/tools)' : 'research'}; complexity: ${videoComplexity}; budget: ${Math.round(codexTotalTimeoutMs / 1000)}s total; ${Math.round(codexTimeoutMs / 1000)}s per attempt.`);
    let codexPlan = await this.runCodexPlan(prompt, codexTimeoutMs, req.projectId, codexDeadlineAt, fastCreative);
    let codexResponse = codexPlan;
    let parsed = this.normalizeGeneratedPlan(codexPlan.parsed, req);
    let validationError: Error | undefined;
    for (let repairAttempt = 0; repairAttempt < 3; repairAttempt += 1) {
      try {
        this.validatePlan(parsed, req);
        validationError = undefined;
        break;
      } catch (error: any) {
        validationError = error instanceof Error ? error : new Error(String(error));
        if (repairAttempt === 2) {
          console.error(`[CodexProvider] Validation failed after ${repairAttempt} repair attempts: ${validationError.message}`);
          throw validationError;
        }

        const repairIssues = Array.from(new Set([
          validationError.message,
          ...this.collectRepairIssues(parsed, req),
        ]));
        console.warn(`[CodexProvider] Plan failed validation; requesting repair ${repairAttempt + 1}/2: ${repairIssues.join(' | ')}`);
        const repairPrompt = `${prompt}

REPAIR PASS ${repairAttempt + 1}: The previous JSON failed one or more validation checks. Fix the complete list below in the same response:
${repairIssues.map((issue) => `- ${issue}`).join('\n')}

Return a completely corrected raw JSON object directly in your response only. Do not call write_to_file, do not save to disk, do not explain the repair, and do not abbreviate any scene with summaries or "...".
The following rules are hard requirements, not suggestions:
- scenePlan has 7-9 scenes numbered consecutively from 1
- scene 1 has role "hook", template "question-hook", and on_screen_text ending in ? or ؟
- the final scene has role "cta", template "cta-outro", and on_screen_text or subtitle includes one of: follow, save, share, like, subscribe, learn, try, comment, visit, watch, join
- every middle scene has role "body"
- every visual_blueprint has non-empty purpose, layout, camera_motion, an asset_queries array, and at least two distinct objects
- objects may share a primitive, but they must be visually distinct through geometry, placement, styling, label, or motion; do not duplicate an object's complete visual signature
- every object has a unique id, x/y values from 0 to 1, and a valid render_spec.type
- vector objects contain at least one non-empty paths/circles/rects/lines/polygons array
- image objects have a specific render_spec.asset_query or a scene-level asset_queries entry
- 3d objects use primitive sphere, cube, torus, cylinder, molecule, or keyboard, or a valid model_id from the shared library
- for split-compare or before-after, provide exactly two comparison sides in concept_nodes or key_takeaways; for list-reveal, steps-numbered, timeline, or icon-grid, provide at least 3 items in key_takeaways or concept_nodes
- for the final scene, continuity_to_next should be "None (final scene)"
- do not change the submitted topic or invent a generic CTA unrelated to it
Before responding, validate the first and final scene against these rules. Do not return placeholders, a partial blueprint, or another invalid repair.`;
        codexPlan = await this.runCodexPlan(repairPrompt, codexTimeoutMs, req.projectId, codexDeadlineAt, fastCreative);
        codexResponse = codexPlan;
        parsed = this.normalizeGeneratedPlan(codexPlan.parsed, req);
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
      styleProfile: parsed.styleProfile as StyleProfile,
      searchStatus: 'active',
      providerName: this.name,
      tokenUsage: codexResponse.tokenUsage
    };
  }

  /**
   * Generate animation code with CODEX.
   */
  async generateAnimationCode(req: AnimationCodeRequest): Promise<AnimationCodeResult> {
    if (!req.scenePlan.length) throw new Error('Cannot create animation instructions without an approved CODEX scene plan.');
    const totalDurationSec = req.scenePlan.reduce((acc, scene) => acc + scene.duration_sec, 0);
    const fps = 30;
    const durationInFrames = totalDurationSec * fps;

    return {
      compositionCode: '// CODEX scene plan consumed through isolated Remotion input props',
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
