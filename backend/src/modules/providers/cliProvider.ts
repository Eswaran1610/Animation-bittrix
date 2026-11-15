import path from 'path';
import { readFile } from 'fs/promises';
import { TokenUsage, ResearchAndScriptRequest } from './providerAdapter.js';
import { BasePlanProvider } from './basePlanProvider.js';
import { activeProviderService, ProviderId } from './activeProviderService.js';
import { spawn } from 'child_process';
import { projectPaths } from '../../config/paths.js';
import { realtime } from '../../realtime.js';
import { tsxValidator } from '../production/tsxValidator.js';
import { getThemeById } from '../themes/themeCatalog.js';
import { resolveCliBinary } from '../auth/cliBinaryResolver.js';

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
      const configured = Number(process.env[fastCreative ? 'AGY_CREATIVE_TIMEOUT_MS' : 'AGY_TIMEOUT_MS'] || (fastCreative ? 300000 : 600000));
      return Number.isFinite(configured) ? Math.max(60000, Math.min(900000, Math.round(configured))) : 600000;
    }
    if (active === 'claude') {
      const configured = Number(process.env[fastCreative ? 'CLAUDE_CREATIVE_TIMEOUT_MS' : 'CLAUDE_TIMEOUT_MS'] || (fastCreative ? 300000 : 900000));
      return Number.isFinite(configured) ? Math.max(60000, Math.min(1800000, Math.round(configured))) : 900000;
    }
    const configured = Number(process.env[fastCreative ? 'CODEX_CREATIVE_TIMEOUT_MS' : 'CODEX_TIMEOUT_MS'] || (fastCreative ? 180000 : 240000));
    return Number.isFinite(configured) ? Math.max(60000, Math.min(240000, Math.round(configured))) : 240000;
  }

  providerTotalTimeoutMs(fastCreative = false): number {
    const active = activeProviderService.get();
    if (active === 'agy') {
      const configured = Number(process.env[fastCreative ? 'AGY_CREATIVE_TOTAL_TIMEOUT_MS' : 'AGY_TOTAL_TIMEOUT_MS'] || (fastCreative ? 600000 : 1200000));
      return Number.isFinite(configured) ? Math.max(120000, Math.min(1800000, Math.round(configured))) : 1200000;
    }
    if (active === 'claude') {
      const configured = Number(process.env[fastCreative ? 'CLAUDE_CREATIVE_TOTAL_TIMEOUT_MS' : 'CLAUDE_TOTAL_TIMEOUT_MS'] || (fastCreative ? 600000 : 1200000));
      return Number.isFinite(configured) ? Math.max(120000, Math.min(1800000, Math.round(configured))) : 1200000;
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
      resolveCliBinary('agy'),
      [
        '-p', prompt,
        '--model', model,
        '--output-format', 'json',
        '--print-timeout', `${printTimeoutMin}m`,
        '--dangerously-skip-permissions'
      ],
      timeoutMs
    );

    if (code !== 0) {
      throw this.extractProcessError('AGY', code, stdout, stderr);
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
        throw this.extractProcessError('AGY (recovery)', rec.code, rec.stdout, rec.stderr);
      }
    }

    return { output: responseText, tokenUsage, parsed };
  }



  private resolveClaudeModel(): string {
    const raw = (process.env.CLAUDE_MODEL || '').trim().toLowerCase();
    // Default and enforce Claude Opus 5.5
    if (!raw || raw === 'sonnet' || raw === 'opus' || raw.includes('5.5') || raw.includes('opus')) {
      return 'claude-opus-5-5';
    }
    return process.env.CLAUDE_MODEL || 'claude-opus-5-5';
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
    const claudeModel = this.resolveClaudeModel();
    const resolvedBin = resolveCliBinary(cliBin);
    const args = ['-p', prompt, '--output-format', 'json', '--dangerously-skip-permissions'];
    if (cliBin === 'claude') {
      args.splice(2, 0, '--model', claudeModel, '--safe-mode');
    }
    console.log(`[UnifiedCliProvider:${cliBin}] Spawning ${resolvedBin} CLI (model=${cliBin === 'claude' ? claudeModel : 'default'}, timeout=${Math.round(timeoutMs / 1000)}s)...`);
    const { stdout, stderr, code } = await this.spawnProcess(
      resolvedBin,
      args,
      timeoutMs
    );
    if (code !== 0) throw this.extractProcessError(cliBin, code, stdout, stderr);
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
    if (active === 'none') throw new Error('No CLI is connected. Connect AGY or Claude in Settings first.');
    const timeoutMs = Math.max(15000, opts.timeoutMs);

    if (active === 'agy') {
      const model = process.env.AGY_MODEL || 'gemini-3.8-flash-medium';
      const printTimeoutMin = Math.max(5, Math.ceil(timeoutMs / 60000));
      const { stdout, stderr, code } = await this.spawnProcess(resolveCliBinary('agy'), [
        '-p', prompt,
        '--model', model,
        '--output-format', 'json',
        '--print-timeout', `${printTimeoutMin}m`,
        '--dangerously-skip-permissions',
      ], timeoutMs + 10000);
      if (code !== 0) throw this.extractProcessError('AGY', code, stdout, stderr);
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

    const resolvedBin = resolveCliBinary(active);
    const claudeModel = this.resolveClaudeModel();
    const args = ['-p', prompt, '--output-format', 'json', '--dangerously-skip-permissions'];
    if (active === 'claude') {
      args.splice(2, 0, '--model', claudeModel, '--safe-mode');
    }

    const { stdout, stderr, code } = await this.spawnProcess(resolvedBin, args, timeoutMs + 10000);
    if (code !== 0) throw this.extractProcessError(active, code, stdout, stderr);
    try {
      const result = JSON.parse(stdout);
      return typeof result?.result === 'string' ? result.result : typeof result?.response === 'string' ? result.response : stdout;
    } catch {
      return stdout;
    }
  }

  private extractProcessError(bin: string, code: number | null, stdout: string, stderr: string): Error {
    let detail = (stderr || '').trim();
    if (!detail && stdout) {
      try {
        const parsed = JSON.parse(stdout);
        detail = parsed.error || parsed.message || (parsed.status && parsed.status !== 'SUCCESS' ? `status: ${parsed.status} ${parsed.response || ''}` : '') || '';
      } catch {
        detail = '';
      }
      if (!detail) {
        detail = stdout.trim().slice(-400);
      }
    }
    return new Error(`${bin} CLI exited with code ${code}${detail ? `: ${detail}` : ''}`);
  }

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

  /**
   * Claude writes the ENTIRE video as one continuous Remotion component in a
   * single pass (like authoring it in claude.ai), with the full script and the
   * voice-locked timeline in view. The backend only mounts it.
   */
  async authorFullVideo(input: {
    projectId: string;
    projectTitle: string;
    fps: number;
    durationInFrames: number;
    outroFrames: number;
    styleBrief?: any;
    scenes: Array<{
      scene_number: number;
      start: number;
      durationInFrames: number;
      narration: string;
      on_screen_text?: string;
      visual_direction?: string;
      motion_cue?: string;
      continuity_to_next?: string;
      words: Array<{ word: string; startFrame: number; endFrame: number }>;
    }>;
    feedback?: string;
    previousSource?: string;
  }): Promise<{ tsxSource: string; soundEvents: Array<{ frame: number; role: string; description: string }> }> {
    const active = activeProviderService.get();
    const { fps, durationInFrames, outroFrames } = input;
    const outroStart = durationInFrames - outroFrames;
    const timeline = input.scenes.map((s) => ({
      scene: s.scene_number,
      startFrame: s.start,
      endFrame: s.start + s.durationInFrames,
      narration: s.narration,
      headline: s.on_screen_text,
      visualIdea: s.visual_direction,
      motionIdea: s.motion_cue,
      handOffToNext: s.continuity_to_next,
      words: s.words.map((w) => ({ word: w.word, startFrame: s.start + w.startFrame, endFrame: s.start + w.endFrame })),
    }));

    const brief = `You are a world-class motion designer and senior Remotion engineer. Create a professional, continuous motion-graphics short video for "${input.projectTitle}" -- the quality of a top-tier explainer reel or Apple/Stripe-style product film. Design it as ONE film, not a set of slides.

THE FILM:
- 1080x1920 vertical (9:16), ${fps}fps, exactly ${durationInFrames} frames (${(durationInFrames / fps).toFixed(2)}s).
- The voiceover is already recorded. This is the locked timeline (all frames are ABSOLUTE video frames). Each scene's visuals must show what its narration is saying while it is said:
${JSON.stringify(timeline, null, 1)}
${input.styleBrief ? `- Style direction from the plan (interpret it, don't treat it as a template): ${JSON.stringify(input.styleBrief)}` : ''}
- Frames ${outroStart}-${durationInFrames - 1} (the last ${(outroFrames / fps).toFixed(1)}s) are covered by a fixed Bittrix Technologies logo animation layered on top of your video. Do NOT draw any logo or brand outro; let your visuals resolve naturally underneath by frame ${outroStart}.

CONTINUOUS, NOT A SLIDESHOW (most important):
- One persistent visual world for the whole film: a shared background/environment and a virtual camera that keeps moving (push-ins, pans, dives) across the scene boundaries.
- Objects carry over and transform into the next idea (morph, zoom through, split, re-arrange) instead of disappearing and being replaced. The scene boundaries above are timing marks, not cuts.
- Never: a static card/title page that appears, holds and gets swapped; fade-to-black; blank frames; repeated identical layouts.
- Motion is continuous for every frame, smooth and eased or spring-driven, with anticipation/overshoot where it helps. No flicker or random jitter.

CONTENT:
- Build the actual things the narration describes (objects, mechanisms, places, data) as rich SVG/CSS/3D illustrations -- not generic orbs, placeholder shapes, code windows or pipeline UI.
- Real typographic hierarchy, a restrained palette you choose for this topic, depth (layers, gradients, shadows, parallax).
- Word-synced captions: show the exact spoken words (no paraphrasing), highlight each word exactly from its startFrame to endFrame with no offset, readable at phone size, inside mobile-safe margins. Read the word timings from props (see contract) so they stay frame-exact.

TECHNICAL CONTRACT:
1. \`export default function Video(props: { fps: number; durationInFrames: number; scenes: Array<{ scene_number: number; start: number; durationInFrames: number; narration: string; words: Array<{ word: string; startFrame: number; endFrame: number }> }> })\`. In props, scene.start is absolute and each word's startFrame/endFrame is RELATIVE to its scene's start. Use useCurrentFrame()/useVideoConfig() freely; you may use <Sequence>, <AbsoluteFill>, interpolate, spring, Easing, etc.
2. Never render <Audio>/<Video>/<OffthreadVideo> -- the audio track is mixed separately.
3. Also \`export const soundEvents = [ ... ]\`: a plain JSON array literal (double-quoted keys/strings) of up to 24 visual hit moments you choreographed across the film, e.g. [{"frame": 42, "role": "click", "description": "key appears"}]. "frame" is an ABSOLUTE integer frame in [0, \${durationInFrames}); role is one of: pop, click, tick, whoosh, slide, riser, impact, sparkle, chime, draw, count, ding. CRITICAL: Do NOT put repetitive generic "whoosh" sounds at scene cuts/transitions. Use object-specific sound roles (pop, click, tick, draw, chime, ding) tied to distinct physical on-screen actions.
4. Imports only from: react, remotion, @remotion/shapes, @remotion/paths, @remotion/transitions, @remotion/three, three, @react-three/fiber. No relative imports, no fetch, no external URLs/assets, no timers. Deterministic: use remotion's random(seed), never Math.random().
5. Single self-contained file.

Return ONLY one \`\`\`tsx code fence. No explanation.`;

    const prompt = input.feedback && input.previousSource
      ? `${brief}\n\nREVISION: Below is your current version of this film. Revise it to address this feedback, keeping everything that already works:\n${input.feedback}\n\nCURRENT VERSION:\n\`\`\`tsx\n${input.previousSource}\n\`\`\``
      : brief;

    const timeoutMs = Math.max(900000, this.providerTimeoutMs(false));
    console.log(`[${active.toUpperCase()}] Authoring full continuous video for "${input.projectTitle}" (${durationInFrames} frames)...`);
    let rawResponse = await this.runText(prompt, { timeoutMs, projectId: input.projectId });
    let parsed = await this.parseFullVideoResponse(rawResponse, durationInFrames);

    const maxAttempts = 2;
    for (let attempt = 1; !parsed.valid && attempt <= maxAttempts; attempt++) {
      console.warn(`[${active.toUpperCase()}] Full video invalid (${parsed.errors.join('; ')}); repair attempt ${attempt}/${maxAttempts}...`);
      const repairPrompt = `${brief}\n\nYour previous version (below) failed validation:\n- ${parsed.errors.join('\n- ')}\n\nFix every issue and return the complete corrected file, keeping the design.\n\nPREVIOUS VERSION:\n\`\`\`tsx\n${parsed.candidate || rawResponse.slice(0, 200000)}\n\`\`\``;
      rawResponse = await this.runText(repairPrompt, { timeoutMs, projectId: input.projectId });
      parsed = await this.parseFullVideoResponse(rawResponse, durationInFrames);
    }

    if (!parsed.valid) {
      throw new Error(`[UnifiedCliProvider] Full video failed validation after ${maxAttempts} repair attempt(s): ${parsed.errors.join('; ')}`);
    }
    console.log(`[${active.toUpperCase()}] Full continuous video authored (${parsed.tsxSource.length} chars, ${parsed.soundEvents.length} sound events).`);
    return { tsxSource: parsed.tsxSource, soundEvents: parsed.soundEvents };
  }

  private async parseFullVideoResponse(rawResponse: string, durationInFrames: number): Promise<
    | { valid: true; tsxSource: string; soundEvents: Array<{ frame: number; role: string; description: string }> }
    | { valid: false; errors: string[]; candidate?: string }
  > {
    const fence = rawResponse.match(/```(?:tsx|typescript|jsx|ts)?\s*([\s\S]*?)```/i);
    const candidate = fence ? fence[1].trim() : (rawResponse.includes('export default') ? rawResponse.trim() : null);
    if (!candidate) return { valid: false, errors: ['No ```tsx code fence returned.'] };

    const errors: string[] = [];
    if (!/export\s+default\s+(?:function\s+\w+|\w+\s*;?)/.test(candidate)) errors.push('Missing a default-exported Video component.');
    if (!/export\s+const\s+soundEvents/.test(candidate)) errors.push('Missing "export const soundEvents = [...]".');
    if (/<(?:Audio|Video|OffthreadVideo)[\s/>]/.test(candidate)) errors.push('Must not render <Audio>/<Video>/<OffthreadVideo>; audio is mixed separately.');
    if (/\bMath\.random\s*\(/.test(candidate)) errors.push('Use remotion random(seed) instead of Math.random() so renders are deterministic.');
    if (/from\s+['"]\.{1,2}\//.test(candidate)) errors.push('Relative imports are not allowed; the file must be self-contained.');
    const compileCheck = await tsxValidator.validate(candidate);
    errors.push(...compileCheck.errors);
    if (errors.length) return { valid: false, errors, candidate };

    let soundEvents: Array<{ frame: number; role: string; description: string }> = [];
    try {
      const arr = candidate.match(/export\s+const\s+soundEvents[^=]*=\s*(\[[\s\S]*?\])\s*(?:as\s+const\s*)?;/);
      if (arr) {
        const list = JSON.parse(arr[1]);
        if (Array.isArray(list)) {
          soundEvents = list
            .filter((e: any) => e && Number.isFinite(Number(e.frame)) && typeof e.role === 'string')
            .map((e: any) => ({ frame: Math.round(Number(e.frame)), role: String(e.role), description: String(e.description || '') }))
            .filter((e) => e.frame >= 0 && e.frame < durationInFrames);
        }
      }
    } catch {
      // Not valid JSON: the film simply gets no SFX cues.
    }
    return { valid: true, tsxSource: candidate, soundEvents };
  }
  // ──────────────────────────────────────────────────
  // Claude agent build (full agent, skills enabled)
  // ──────────────────────────────────────────────────
  /**
   * Runs Claude Code as a FULL AGENT in the repo root (AGENTS.md + .agents/skills are loaded; no --safe-mode),
   * so it can write files, run the claude-drawing skill's Python, render, look at frames and fix its own work.
   * Claude is the only author of the video. The backend only verifies the mp4 it reports with `DONE <path>`.
   */
  async runClaudeAgentBuild(input: {
    projectId: string;
    projectTitle: string;
    fps: number;
    width: number;
    height: number;
    durationInFrames: number;
    outroFrames: number;
    propsPath: string;        // locked Remotion props: scenes, Whisper word timings, captions (absolute)
    audioPath: string;        // final mixed master audio (absolute)
    outputMp4: string;        // where Claude must write the finished video (absolute)
    workDir: string;          // scratch dir Claude may use for scene scripts / frames (absolute)
    drawingStyle: { id: string; label: string; module: string; cls: string; example: string };
    skillDir: string;         // .agents/skills/claude-drawing (absolute)
    feedback?: string;
    onEvent?: (evt: { kind: 'text' | 'tool' | 'result'; text: string }) => void;
  }): Promise<{ outputMp4: string; log: string }> {
    const { fps, width, height, durationInFrames, outroFrames } = input;
    const durationSec = durationInFrames / fps;
    const outroStart = durationInFrames - outroFrames;
    const style = input.drawingStyle;
    const prompt = `Build the final video for project ${input.projectId} ("${input.projectTitle}").
Follow every rule in AGENTS.md in this repo. The user picked a hand-drawn look, so the visuals are painted with the
claude-drawing skill: read ${input.skillDir}/SKILL.md first (its workflow, the API section for the chosen style, its
pitfall list and the "做成动画 / animation" section), then follow it.

CHOSEN DRAWING STYLE: ${style.label}
  - painter: ${input.skillDir}/${style.module} (class ${style.cls})
  - quality reference to copy and adapt: ${input.skillDir}/${style.example}
  Use ONLY this style for every scene. No image model, no stock images: every picture is painted by code with the skill's lib.

INPUTS (locked, do not modify):
  - Props / timeline: ${input.propsPath}
      video.fps, video.durationInFrames, video.captions (absolute word frames), scenes[] with start/startFrame,
      durationInFrames, narration, on_screen_text, visual_direction and per-scene words (frames relative to the scene).
  - Master audio (narration + SFX + bed, already mixed): ${input.audioPath}

OUTPUT: ${width}x${height}, ${fps}fps, exactly ${durationInFrames} frames (${durationSec.toFixed(2)}s), H.264 yuv420p + AAC,
written to ${input.outputMp4}. Scratch files go in ${input.workDir} only. Do not edit backend/, frontend/ or other projects.

DO THIS:
  1. Read the props. Scene timing comes ONLY from the props (scene start + durationInFrames). Caption WORDS are the
     exact script words; caption TIMING is the Whisper word frames.
  2. For each scene write a scene script in ${input.workDir} (copy the reference example, set the canvas to ${width}x${height})
     that paints what that scene's narration says, with stage('...') calls in drawing order. Render it with
     --stages so each scene yields its draw-on stage PNGs + final. Open the PNGs and fix them against the style's
     pitfall list (2-4 rounds, only the most visible problem per round).
  3. Animate: assemble the stage images into frames so each scene is visibly DRAWN ON across its exact frame window
     (stroke/area reveals and dissolves between stages, gentle continuous camera drift, the finished picture held
     briefly before the next scene; carry the paper/background across scene boundaries -- no hard cuts to black).
  4. Burn in word-synced captions inside mobile-safe margins: exact words, each word highlighted from its startFrame
     to endFrame, styled to match the drawing style.
  5. Frames ${outroStart}-${durationInFrames - 1} (last ${(outroFrames / fps).toFixed(1)}s) must be the Bittrix Technologies outro
     (AGENTS.md section 18): render those frames from remotion/src/components/BittrixOutroExact.tsx with Remotion
     (e.g. a small composition under ${input.workDir}, or remotion render of MainComposition --props=${input.propsPath}
     --frames=${outroStart}-${durationInFrames - 1}) and splice them in; let your drawing resolve underneath before frame ${outroStart}.
  6. Encode with ffmpeg, mux ${input.audioPath} as the only audio track, and verify with ffprobe: ${width}x${height},
     ${fps}fps, video duration == audio duration within 1 frame. Extract a few frames and look at them; fix and re-encode if needed
     (max 3 retries).
${input.feedback ? `\nREVISION FEEDBACK FROM THE USER (apply it, keep what already works):\n${input.feedback}\n` : ''}
When finished, print exactly one last line:
DONE ${input.outputMp4}
If you cannot finish, print exactly one last line:
FAILED <short reason>`;

    const timeoutMs = Number(process.env.CLAUDE_AGENT_TIMEOUT_MS || 2700000);
    const args = [
      '-p', prompt,
      '--model', this.resolveClaudeModel(),
      '--dangerously-skip-permissions',
      '--output-format', 'stream-json', '--verbose',
    ];
    const bin = resolveCliBinary('claude');
    console.log(`[UnifiedCliProvider:claude-agent] Building "${input.projectTitle}" in style ${style.id} (timeout ${Math.round(timeoutMs / 1000)}s)...`);

    const finalText = await new Promise<string>((resolve, reject) => {
      const child = spawn(bin, args, {
        cwd: projectPaths.root,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: process.platform !== 'win32',
      });
      activeChildren.add(child);
      let buf = '';
      let stderr = '';
      let result = '';
      let lastAssistant = '';
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        signalProcessTree(child, 'SIGTERM');
        setTimeout(() => signalProcessTree(child, 'SIGKILL'), 2000);
      }, timeoutMs);

      const handleLine = (line: string) => {
        if (!line.trim()) return;
        let evt: any;
        try { evt = JSON.parse(line); } catch { return; }
        if (evt.type === 'assistant' && Array.isArray(evt.message?.content)) {
          for (const part of evt.message.content) {
            if (part?.type === 'text' && part.text) {
              lastAssistant = part.text;
              input.onEvent?.({ kind: 'text', text: String(part.text).slice(0, 300) });
            } else if (part?.type === 'tool_use') {
              const i = part.input || {};
              const what = i.description || i.command || i.file_path || i.pattern || '';
              input.onEvent?.({ kind: 'tool', text: `${part.name}${what ? `: ${String(what).slice(0, 160)}` : ''}` });
            }
          }
        } else if (evt.type === 'result') {
          result = String(evt.result ?? '');
          input.onEvent?.({ kind: 'result', text: result.slice(-300) });
        }
      };

      child.stdout.on('data', (d) => {
        buf += d.toString();
        let nl: number;
        while ((nl = buf.indexOf('\n')) >= 0) {
          handleLine(buf.slice(0, nl));
          buf = buf.slice(nl + 1);
        }
      });
      child.stderr.on('data', (d) => { stderr += d.toString(); if (stderr.length > 20000) stderr = stderr.slice(-20000); });
      child.on('close', (code) => {
        activeChildren.delete(child);
        clearTimeout(timer);
        if (buf) handleLine(buf);
        if (timedOut) return reject(new Error(`Claude agent build timed out after ${Math.round(timeoutMs / 1000)}s`));
        const text = result || lastAssistant;
        if (code !== 0 && !text) return reject(new Error(`claude exited with code ${code}: ${stderr.trim().slice(-400)}`));
        resolve(text);
      });
      child.on('error', (err) => {
        activeChildren.delete(child);
        clearTimeout(timer);
        reject(err);
      });
    });

    const lines = finalText.trim().split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const last = lines[lines.length - 1] || '';
    const failed = lines.find((l) => l.startsWith('FAILED'));
    const done = [...lines].reverse().find((l) => l.startsWith('DONE '));
    if (!done) {
      throw new Error(`Claude agent build did not finish: ${failed || last.slice(0, 300) || 'no DONE line'}`);
    }
    const reported = done.slice(5).trim();
    if (path.resolve(reported) !== path.resolve(input.outputMp4)) {
      throw new Error(`Claude agent reported ${reported}, expected ${input.outputMp4}`);
    }
    return { outputMp4: input.outputMp4, log: finalText };
  }
}

export const unifiedCliProvider = new UnifiedCliProvider();
