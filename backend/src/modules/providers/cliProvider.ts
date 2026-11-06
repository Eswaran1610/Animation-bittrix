import { TokenUsage, ResearchAndScriptRequest } from './providerAdapter.js';
import { BasePlanProvider } from './basePlanProvider.js';
import { activeProviderService, ProviderId } from './activeProviderService.js';
import { spawn } from 'child_process';
import { projectPaths } from '../../config/paths.js';
import { realtime } from '../../realtime.js';
import { tsxValidator } from '../production/tsxValidator.js';
import { buildAuthoritativeTsx } from '../production/authoritativeTsxBuilder.js';

const activeChildren = new Set<ReturnType<typeof spawn>>();

const signalProcessTree = (child: ReturnType<typeof spawn>, signal: NodeJS.Signals) => {
  if (child.exitCode !== null || child.signalCode !== null) return;
  if (process.platform !== 'win32' && child.pid) {
    try {
      process.kill(-child.pid, signal);
      return;
    } catch {}
  }
  child.kill(signal);
};

export const shutdownAllCliProcesses = () => {
  const children = [...activeChildren];
  for (const child of children) {
    signalProcessTree(child, 'SIGTERM');
  }
  if (children.length > 0) {
    const forceKillTimer = setTimeout(() => {
      for (const child of children) {
        signalProcessTree(child, 'SIGKILL');
      }
    }, 1500);
    forceKillTimer.unref();
  }
};

/**
 * Unified CLI Provider
 *
 * Runs whichever CLI the user selected in the active provider settings:
 * - 'agy' (Google Antigravity CLI)
 * - 'codex' (Codex CLI)
 * - 'claude' (Claude Code CLI)
 *
 * All CLIs execute under the identical high-fidelity video production director
 * and deep research standards, Remotion capability contract, and auto-repair gates.
 */
export class UnifiedCliProvider extends BasePlanProvider {
  get name(): string {
    return activeProviderService.get();
  }

  providerTimeoutMs(fastCreative = false): number {
    const active = activeProviderService.get();
    if (active === 'agy') {
      const configured = Number(process.env[fastCreative ? 'AGY_CREATIVE_TIMEOUT_MS' : 'AGY_TIMEOUT_MS'] || (fastCreative ? 240000 : 360000));
      return Number.isFinite(configured) ? Math.max(60000, Math.min(600000, Math.round(configured))) : 360000;
    }
    const configured = Number(process.env[fastCreative ? 'CODEX_CREATIVE_TIMEOUT_MS' : 'CODEX_TIMEOUT_MS'] || (fastCreative ? 180000 : 240000));
    return Number.isFinite(configured) ? Math.max(60000, Math.min(240000, Math.round(configured))) : 240000;
  }

  providerTotalTimeoutMs(fastCreative = false): number {
    const active = activeProviderService.get();
    if (active === 'agy') {
      const configured = Number(process.env[fastCreative ? 'AGY_CREATIVE_TOTAL_TIMEOUT_MS' : 'AGY_TOTAL_TIMEOUT_MS'] || (fastCreative ? 480000 : 720000));
      return Number.isFinite(configured) ? Math.max(120000, Math.min(900000, Math.round(configured))) : 540000;
    }
    const configured = Number(process.env[fastCreative ? 'CODEX_CREATIVE_TOTAL_TIMEOUT_MS' : 'CODEX_TOTAL_TIMEOUT_MS'] || (fastCreative ? 240000 : 360000));
    return Number.isFinite(configured) ? Math.max(120000, Math.min(360000, Math.round(configured))) : 360000;
  }

  protected async executePlan(
    prompt: string,
    timeoutMs: number,
    projectId: string | undefined,
    deadlineAt: number,
    fastCreative = false
  ): Promise<{ output: string; tokenUsage: TokenUsage; parsed: any }> {
    const active = activeProviderService.get();
    const remainingMs = Math.max(15000, deadlineAt - Date.now());
    const effectiveTimeoutMs = Math.min(timeoutMs, remainingMs);

    if (active === 'agy') {
      return this.runAgyPlan(prompt, effectiveTimeoutMs, projectId);
    } else if (active === 'codex') {
      return this.runCodexPlan(prompt, effectiveTimeoutMs, projectId, deadlineAt, fastCreative);
    } else {
      return this.runGenericCliPlan(active, prompt, effectiveTimeoutMs, projectId);
    }
  }

  // ──────────────────────────────────────────────────
  // AGY Runner (Antigravity CLI)
  // ──────────────────────────────────────────────────
  private async runAgyPlan(
    prompt: string,
    timeoutMs: number,
    projectId: string | undefined
  ): Promise<{ output: string; tokenUsage: TokenUsage; parsed: any }> {
    const model = process.env.AGY_MODEL || 'gemini-3.8-flash-medium';
    console.log(`[UnifiedCliProvider:agy] Spawning agy CLI (model=${model}, timeout=${Math.round(timeoutMs / 1000)}s)...`);

    if (projectId) {
      realtime.publish({
        type: 'pipeline_progress',
        projectId,
        stage: 'research',
        progress: 20,
        status: `AGY (${model}) researching & synthesizing video plan...`
      });
    }

    const printTimeoutMin = Math.max(5, Math.ceil(timeoutMs / 60000));
    const { stdout, stderr, code } = await this.spawnProcess(
      'agy',
      [
        '-p', prompt,
        '--model', model,
        '--output-format', 'json',
        '--print-timeout', `${printTimeoutMin}m`,
        '--disable-slash-commands',
        '--dangerously-skip-permissions'
      ],
      timeoutMs
    );

    if (code !== 0) {
      throw new Error(`AGY CLI exited with code ${code}: ${stderr.slice(-300)}`);
    }

    let container: any;
    try {
      container = JSON.parse(stdout);
    } catch {
      container = this.extractJson(stdout);
    }

    if (container?.status && container.status !== 'SUCCESS') {
      throw new Error(`AGY CLI returned status "${container.status}": ${container.response || stdout}`);
    }

    if (projectId) {
      realtime.publish({
        type: 'pipeline_progress',
        projectId,
        stage: 'script_plan',
        progress: 80,
        status: `AGY (${model}) plan ready: scene blueprints & narration generated`
      });
    }

    const responseText = typeof container?.response === 'string' ? container.response : stdout;
    const usage = container?.usage || {};
    const tokenUsage: TokenUsage = {
      input_tokens: Number(usage.input_tokens || 0),
      output_tokens: Number(usage.output_tokens || 0),
      total_tokens: Number(usage.total_tokens || 0),
      estimated: false,
      available: true,
      source: 'agy',
    };

    let parsed: any;
    try {
      parsed = this.extractJson(responseText);
    } catch (parseErr: any) {
      console.warn(`[UnifiedCliProvider:agy] AGY output was not immediately parseable (${parseErr?.message}); running recovery pass...`);
      const recoveryPrompt = prompt + '\n\nOUTPUT RECOVERY: Return ONLY one complete valid JSON object matching the required schema, starting with { and ending with }. Do not add markdown commentary outside the JSON.';
      const rec = await this.spawnProcess(
        'agy',
        [
          '-p', recoveryPrompt,
          '--model', model,
          '--output-format', 'json',
          '--print-timeout', '3m',
          '--disable-slash-commands',
          '--dangerously-skip-permissions'
        ],
        Math.min(timeoutMs, 120000)
      );
      if (rec.code === 0) {
        try {
          const recContainer = JSON.parse(rec.stdout);
          parsed = this.extractJson(recContainer.response || rec.stdout);
        } catch {
          parsed = this.extractJson(rec.stdout);
        }
      } else {
        throw new Error(`Failed to extract valid JSON plan from AGY response: ${parseErr?.message}`);
      }
    }

    return { output: responseText, tokenUsage, parsed };
  }

  // ──────────────────────────────────────────────────
  // Codex Runner (Codex CLI)
  // ──────────────────────────────────────────────────
  private async runCodexPlan(
    prompt: string,
    timeoutMs: number,
    projectId: string | undefined,
    deadlineAt: number,
    fastCreative = false
  ): Promise<{ output: string; tokenUsage: TokenUsage; parsed: any }> {
    console.log(`[UnifiedCliProvider:codex] Running dynamic content-driven CODEX planning (timeout=${Math.round(timeoutMs / 1000)}s)...`);
    
    let output = '';
    let errorOutput = '';
    let timedOut = false;

    if (projectId) {
      realtime.publish({
        type: 'pipeline_progress',
        projectId,
        stage: 'research',
        progress: 30,
        status: 'Codex executing multi-website deep research...'
      });
    }

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
        detached: process.platform !== 'win32',
      });

      activeChildren.add(child);
      let forceKillTimer: NodeJS.Timeout | undefined;
      const timer = setTimeout(() => {
        timedOut = true;
        signalProcessTree(child, 'SIGTERM');
        forceKillTimer = setTimeout(() => signalProcessTree(child, 'SIGKILL'), 2000);
      }, timeoutMs);

      await new Promise<void>((resolve, reject) => {
        child.stdout.on('data', (d) => { output += d.toString(); });
        child.stderr.on('data', (d) => { errorOutput += d.toString(); });
        child.once('error', reject);
        child.once('close', (code) => {
          activeChildren.delete(child);
          clearTimeout(timer);
          if (forceKillTimer) clearTimeout(forceKillTimer);
          if (timedOut) {
            reject(new Error(`Codex CLI timed out after ${Math.round(timeoutMs / 1000)} seconds`));
            return;
          }
          if (code !== 0) {
            reject(new Error(`Codex CLI failed with exit code ${code}: ${errorOutput}`));
            return;
          }
          if (projectId) {
            realtime.publish({
              type: 'pipeline_progress',
              projectId,
              stage: 'script_plan',
              progress: 80,
              status: 'Codex plan ready: scene blueprints & narration generated'
            });
          }
          resolve();
        });
      });
    } catch (err: any) {
      console.error('[UnifiedCliProvider:codex] Error running codex CLI:', err.message);
      throw err;
    }

    // Extract the final message text from Codex NDJSON events if present
    let responseText = output;
    const lines = output.split(/\r?\n/).filter(Boolean);
    for (const line of lines) {
      try {
        const evt = JSON.parse(line);
        if (evt.type === 'item.completed' && evt.item?.type === 'agent_message' && typeof evt.item?.text === 'string') {
          responseText = evt.item.text;
        }
      } catch {}
    }

    const tokenUsage = this.extractCodexTokenUsage(output);
    const parsed = this.extractJson(responseText);
    return { output: responseText, tokenUsage, parsed };
  }

  // ──────────────────────────────────────────────────
  // Generic / Claude Code Runner
  // ──────────────────────────────────────────────────
  private async runGenericCliPlan(
    cliBin: string,
    prompt: string,
    timeoutMs: number,
    projectId: string | undefined
  ): Promise<{ output: string; tokenUsage: TokenUsage; parsed: any }> {
    console.log(`[UnifiedCliProvider:${cliBin}] Spawning ${cliBin} CLI (timeout=${Math.round(timeoutMs / 1000)}s)...`);
    const { stdout, stderr, code } = await this.spawnProcess(
      cliBin,
      ['-p', prompt, '--output-format', 'json', '--dangerously-skip-permissions'],
      timeoutMs
    );
    if (code !== 0) throw new Error(`${cliBin} CLI exited with code ${code}: ${stderr.slice(-300)}`);
    let output = stdout;
    let tokenUsage: TokenUsage = { input_tokens: 0, output_tokens: 0, total_tokens: 0, estimated: false, available: false, source: 'unavailable' };
    if (cliBin === 'claude') {
      try {
        const container = JSON.parse(stdout);
        output = typeof container?.result === 'string' ? container.result : stdout;
        const usage = container?.usage || {};
        const inputTokens = Number(usage.input_tokens ?? usage.inputTokens ?? 0);
        const outputTokens = Number(usage.output_tokens ?? usage.outputTokens ?? 0);
        const hasUsage = Number.isFinite(inputTokens + outputTokens) && (inputTokens > 0 || outputTokens > 0);
        tokenUsage = {
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          total_tokens: Number(usage.total_tokens ?? usage.totalTokens ?? inputTokens + outputTokens),
          estimated: false,
          available: hasUsage,
          source: hasUsage ? 'claude' : 'unavailable',
        };
      } catch { /* Claude may emit plain text depending on CLI version. */ }
    }
    const parsed = this.extractJson(output);
    return {
      output,
      tokenUsage,
      parsed
    };
  }

  /** Plain-text CLI pass used by the dynamic topic + motion trend researcher. */
  async runText(prompt: string, opts: { timeoutMs: number; projectId?: string }): Promise<string> {
    const active = activeProviderService.get();
    if (active === 'none') throw new Error('No CLI is connected. Connect AGY or Codex in Settings first.');
    const timeoutMs = Math.max(15000, opts.timeoutMs);

    if (active === 'agy') {
      const model = process.env.AGY_MODEL || 'gemini-3.8-flash-medium';
      const printTimeoutMin = Math.max(1, Math.ceil(timeoutMs / 60000));
      const { stdout, stderr, code } = await this.spawnProcess('agy', [
        '-p', prompt,
        '--model', model,
        '--output-format', 'json',
        '--print-timeout', `${printTimeoutMin}m`,
        '--disable-slash-commands',
        '--dangerously-skip-permissions',
      ], timeoutMs);
      if (code !== 0) throw new Error(`AGY CLI exited with code ${code}: ${stderr.slice(-300)}`);
      try {
        const container = JSON.parse(stdout);
        if (container?.status && container.status !== 'SUCCESS') {
          throw new Error(`AGY returned status "${container.status}": ${container.response || ''}`);
        }
        return typeof container?.response === 'string' ? container.response : stdout;
      } catch (err: any) {
        if (String(err?.message).startsWith('AGY returned')) throw err;
        return stdout;
      }
    }

    if (active === 'codex') {
      const { stdout, stderr, code } = await this.spawnProcess('codex', [
        'exec', '--ephemeral', '--skip-git-repo-check', '--sandbox', 'read-only', '--json', '--color', 'never', prompt,
      ], timeoutMs);
      if (code !== 0) throw new Error(`Codex CLI failed with exit code ${code}: ${stderr.slice(-300)}`);
      let response = stdout;
      for (const line of stdout.split(/\r?\n/).filter(Boolean)) {
        try {
          const event = JSON.parse(line);
          if (event.type === 'item.completed' && event.item?.type === 'agent_message' && typeof event.item.text === 'string') {
            response = event.item.text;
          }
        } catch {}
      }
      return response;
    }

    const { stdout, stderr, code } = await this.spawnProcess(active, [
      '-p', prompt, '--output-format', 'json', '--dangerously-skip-permissions',
    ], timeoutMs);
    if (code !== 0) throw new Error(`${active} CLI exited with code ${code}: ${stderr.slice(-300)}`);
    try {
      const result = JSON.parse(stdout);
      return typeof result?.result === 'string' ? result.result : typeof result?.response === 'string' ? result.response : stdout;
    } catch {
      return stdout;
    }
  }

  async generateApprovedProductionPackage(input: {
    projectId: string;
    projectTitle: string;
    scriptVersion: number;
    scenePlan: any[];
    measuredScenes?: any[];
    styleBrief?: any;
  }): Promise<{ tsxSource: string; audioDesign: { bedMood: string; voiceDirection: string; scenes: Array<{ scene_number: number; cues: Array<{ hitFrame: number; role: string; object_id?: string; reason: string }> }> }; scenes?: any[] }> {
    const active = activeProviderService.get();
    const sourceScenes = (input.measuredScenes && input.measuredScenes.length > 0)
      ? input.measuredScenes
      : input.scenePlan;

    const compactScenes = sourceScenes.map((scene: any, idx: number) => {
      const orig = input.scenePlan[idx] || {};
      const fps = Number(scene.fps || orig.fps || 60);
      const durationInFrames = Number(scene.durationInFrames || Math.round(Number(orig.duration_sec || 3.5) * fps));
      return {
        scene_number: Number(scene.scene_number || idx + 1),
        role: scene.role || orig.role || (idx === 0 ? 'hook' : idx === sourceScenes.length - 1 ? 'cta' : 'body'),
        durationInFrames,
        duration_sec: Number((scene.duration_sec || (durationInFrames / fps)).toFixed(2)),
        narration: scene.narration || orig.narration || '',
        on_screen_text: scene.on_screen_text || orig.on_screen_text || orig.title || '',
        visual_direction: scene.visual_direction || orig.visual_direction || '',
        template: scene.template || orig.template || 'hero-center',
        themeColor: scene.themeColor || orig.theme_color || '#22d3ee',
        words: Array.isArray(scene.words)
          ? scene.words.map((w: any) => ({
              word: String(w.word || ''),
              startFrame: Math.round(Number(w.startFrame || 0)),
              endFrame: Math.max(Math.round(Number(w.startFrame || 0)) + 1, Math.round(Number(w.endFrame || 0))),
            }))
          : [],
      };
    });

    const totalFrames = compactScenes.reduce((sum, s) => sum + s.durationInFrames, 0);

    const prompt = `You are the Lead Creative Director & Motion Animation Designer for this video.
Return ONLY ONE valid JSON object with exactly two keys: "scenePlan" and "audioDesign".

PROJECT: "${input.projectTitle}" (ID: ${input.projectId}), Script v${input.scriptVersion}
OUTPUT FORMAT: 1080 x 1920 (9:16 vertical), 60 FPS Professional Motion Graphics, Total Duration: ${totalFrames} frames (${(totalFrames / 60).toFixed(2)}s).

AUTHORITATIVE SCENES & MEASURED AUDIO WORD TIMESTAMPS:
${JSON.stringify(compactScenes, null, 2)}

MANDATORY MOTION DESIGN REQUIREMENTS FOR scenePlan:
Return an array of ${compactScenes.length} scene objects matching the input scenes. Each scene object MUST contain:
1. "scene_number": integer (1 to ${compactScenes.length})
2. "visual_type": Choose one of: "3d-showcase" | "image-hero" | "concept-diagram" | "process-flow" | "split-compare" | "timeline" | "callout" | "stat-counter" | "outro".
   - RULE: Use "3d-showcase" for core technology, mechanisms, or spatial architecture to render an isometric 3D floating stage.
   - RULE: Use "image-hero" with "image_url" when a photographic or illustration asset explains the concept.
   - RULE: NEVER use the same visual_type in 3 consecutive scenes.
   - RULE: Use "stat-counter" ONLY if the narration contains a specific quantitative number and provide "source_url".
   - RULE: Last scene (final ~3s) MUST be "outro" (which loads the mandatory 3-second Bittrix Technologies logo video piece).
3. "icon": Relevant 3D glyph/emoji for 3D showcase scenes (e.g. 🌐, ⚡, 🔐, 🧠, 💻, 🚀).
4. "image_url": (Optional) Direct open-license HTTPS image URL or static asset path.
5. "emphasis_word": The key spoken word from this scene's narration that triggers the primary motion hit.
6. "nodes": Array of 1-3 visual nodes/concepts directly mentioned in the narration: [{ "label": "Short Spoken Concept", "sub": "Detail from narration" }]
7. "edges": Array of connections between nodes: [{ "from": 0, "to": 1, "label": "action/relation", "dashed": false }]
8. "labels": Array of 2-4 keywords or step titles directly from this scene's sentence.
9. "stat_value": (Optional) If visual_type is stat-counter, the exact number.
10. "source_url": (Optional) Source URL verifying the number.

NO META-CLUTTER OR PLACEHOLDERS:
- FORBIDDEN: "Ready to render", "placeholder", "lorem", "HOOK", "BODY", "SUBSCRIBE", "CORE ARCHITECTURE", tool names, Remotion APIs.
- Every node and label word MUST come from the narration.

REQUIREMENTS FOR audioDesign:
{"bedMood":"content-specific ambient bed description","voiceDirection":"keep natural 1.00x delivery","scenes":[{"scene_number":1,"cues":[{"hitFrame":15,"role":"whoosh","reason":"visual entrance"}]}]}
Allowed cue roles: pop, click, tick, whoosh, slide, riser, impact, sparkle, chime, draw, count, ding. Max 5 cues per scene.
`;

    let parsed: any = null;
    try {
      const response = await this.runText(prompt, { timeoutMs: 120000, projectId: input.projectId });
      const first = response.indexOf('{');
      const last = response.lastIndexOf('}');
      if (first >= 0 && last > first) {
        parsed = JSON.parse(response.slice(first, last + 1));
      } else {
        const cleaned = response
          .replace(/```(?:json)?/gi, '')
          .replace(/```/g, '')
          .replace(/,\s*([}\]])/g, '$1')
          .trim();
        const cFirst = cleaned.indexOf('{');
        const cLast = cleaned.lastIndexOf('}');
        if (cFirst >= 0 && cLast > cFirst) {
          parsed = JSON.parse(cleaned.slice(cFirst, cLast + 1));
        }
      }
    } catch (cliErr: any) {
      console.warn(`[${active.toUpperCase()}] CLI generation call failed: ${cliErr.message}. Falling back to authoritative plan generator.`);
    }

    let finalScenes = compactScenes;
    if (parsed && Array.isArray(parsed.scenePlan) && parsed.scenePlan.length === compactScenes.length) {
      const planValidation = tsxValidator.validateScenePlan(parsed.scenePlan);
      if (planValidation.valid) {
        console.log(`[${active.toUpperCase()}] CLI-generated scene plan passed validation!`);
        finalScenes = compactScenes.map((s, idx) => ({
          ...s,
          ...parsed.scenePlan[idx],
          durationInFrames: s.durationInFrames,
          words: s.words,
        }));
      } else {
        console.warn(`[${active.toUpperCase()}] CLI scene plan validation warnings: ${planValidation.errors.join('; ')}`);
      }
    }

    let validTsxSource: string | null = null;
    if (parsed && typeof parsed.tsxSource === 'string' && parsed.tsxSource.trim().length > 0) {
      const val = await tsxValidator.validate(parsed.tsxSource);
      if (val.valid) {
        validTsxSource = parsed.tsxSource;
        console.log(`[${active.toUpperCase()}] Direct TSX passed validation.`);
      }
    }

    if (!validTsxSource) {
      console.log(`[UnifiedCliProvider] Building authoritative data-driven Remotion TSX for "${input.projectTitle}"...`);
      validTsxSource = buildAuthoritativeTsx(input.projectTitle, finalScenes, input.styleBrief);
    }

    const roles = new Set(['pop', 'click', 'tick', 'whoosh', 'slide', 'riser', 'impact', 'sparkle', 'chime', 'draw', 'count', 'ding']);

    const defaultAudioScenes = compactScenes.map((scene: any, index: number) => {
      const maxFrame = Math.max(1, scene.durationInFrames - 8);
      const cues: Array<{ hitFrame: number; role: string; object_id?: string; reason: string }> = [];
      let lastFrame = -8;
      const cueHit = Math.min(12, maxFrame);
      cues.push({ hitFrame: cueHit, role: 'whoosh', reason: 'Scene visual entrance' });
      if (scene.words && scene.words.length > 2) {
        const midWord = scene.words[Math.floor(scene.words.length / 2)];
        if (midWord && midWord.startFrame > cueHit + 10 && midWord.startFrame < maxFrame) {
          cues.push({ hitFrame: midWord.startFrame, role: 'pop', reason: 'Key emphasis word' });
        }
      }
      return {
        scene_number: index + 1,
        cues,
      };
    });

    let audioDesign = parsed?.audioDesign;
    if (!audioDesign || typeof audioDesign.bedMood !== 'string' || typeof audioDesign.voiceDirection !== 'string' || !Array.isArray(audioDesign.scenes) || audioDesign.scenes.length !== compactScenes.length) {
      audioDesign = {
        bedMood: 'focused electronic pulse',
        voiceDirection: 'delivery guidance for the already-approved words; keep natural 1.00x',
        scenes: defaultAudioScenes,
      };
    }

    audioDesign.scenes.forEach((scene: any, index: number) => {
      const source = compactScenes[index];
      scene.scene_number = index + 1;
      if (!Array.isArray(scene.cues)) {
        scene.cues = [];
      }
      const maxFrame = Math.max(1, source.durationInFrames - 8);
      const rawCues = [...scene.cues]
        .filter((c: any) => c && typeof c === 'object')
        .sort((a: any, b: any) => Number(a.hitFrame || 0) - Number(b.hitFrame || 0));

      const sanitizedCues: Array<{ hitFrame: number; role: string; object_id?: string; reason: string }> = [];
      let previousFrame = -8;
      for (const cue of rawCues) {
        let frame = Math.round(Number(cue.hitFrame ?? 0));
        if (!Number.isFinite(frame)) continue;
        frame = Math.max(0, Math.min(maxFrame, frame));
        if (frame - previousFrame < 8) {
          frame = previousFrame + 8;
        }
        if (frame > maxFrame) break;
        const role = roles.has(cue.role) ? cue.role : 'click';
        const reason = (typeof cue.reason === 'string' && cue.reason.trim()) ? cue.reason.trim() : 'Scene event cue';
        sanitizedCues.push({
          hitFrame: frame,
          role,
          object_id: typeof cue.object_id === 'string' ? cue.object_id : '',
          reason,
        });
        previousFrame = frame;
        if (sanitizedCues.length >= 5) break;
      }
      if (sanitizedCues.length === 0) {
        sanitizedCues.push({ hitFrame: Math.min(10, maxFrame), role: 'whoosh', reason: 'Scene visual entrance' });
      }
      scene.cues = sanitizedCues;
    });

    return { tsxSource: validTsxSource, audioDesign, scenes: finalScenes };
  }

  // ──────────────────────────────────────────────────
  // Process Spawner Helper
  // ──────────────────────────────────────────────────
  private async spawnProcess(
    bin: string,
    args: string[],
    timeoutMs: number
  ): Promise<{ stdout: string; stderr: string; code: number | null }> {
    return new Promise((resolve, reject) => {
      const child = spawn(bin, args, {
        cwd: projectPaths.root,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: process.platform !== 'win32',
      });

      activeChildren.add(child);
      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const timer = setTimeout(() => {
        timedOut = true;
        signalProcessTree(child, 'SIGTERM');
        setTimeout(() => signalProcessTree(child, 'SIGKILL'), 2000);
      }, timeoutMs);

      child.stdout.on('data', (d) => { stdout += d.toString(); });
      child.stderr.on('data', (d) => { stderr += d.toString(); });

      child.on('close', (code) => {
        activeChildren.delete(child);
        clearTimeout(timer);
        if (timedOut) {
          reject(new Error(`${bin} CLI timed out after ${Math.round(timeoutMs / 1000)} seconds`));
          return;
        }
        resolve({ stdout, stderr, code });
      });

      child.on('error', (err) => {
        activeChildren.delete(child);
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  private extractCodexTokenUsage(output: string): TokenUsage {
    const usage: TokenUsage = {
      input_tokens: 0,
      output_tokens: 0,
      total_tokens: 0,
      estimated: false,
      available: false,
      source: 'codex'
    };
    const candidates: any[] = [];
    for (const line of output.split(/\r?\n/)) {
      try { candidates.push(JSON.parse(line)); } catch {}
    }
    for (const candidate of candidates) {
      if (!candidate || typeof candidate !== 'object') continue;
      const input = Number(candidate.input_tokens ?? candidate.prompt_tokens);
      const outputTokens = Number(candidate.output_tokens ?? candidate.completion_tokens);
      const total = Number(candidate.total_tokens);
      if (Number.isFinite(input) || Number.isFinite(outputTokens) || Number.isFinite(total)) {
        usage.input_tokens = Number.isFinite(input) ? input : 0;
        usage.output_tokens = Number.isFinite(outputTokens) ? outputTokens : 0;
        usage.total_tokens = Number.isFinite(total) ? total : usage.input_tokens + usage.output_tokens;
        usage.available = true;
        return usage;
      }
    }
    return usage;
  }
}

export const unifiedCliProvider = new UnifiedCliProvider();
