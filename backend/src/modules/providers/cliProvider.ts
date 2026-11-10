import { TokenUsage, ResearchAndScriptRequest } from './providerAdapter.js';
import { BasePlanProvider } from './basePlanProvider.js';
import { activeProviderService, ProviderId } from './activeProviderService.js';
import { spawn } from 'child_process';
import { projectPaths } from '../../config/paths.js';
import { realtime } from '../../realtime.js';
import { tsxValidator } from '../production/tsxValidator.js';

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
    const configured = Number(process.env[fastCreative ? 'CODEX_CREATIVE_TIMEOUT_MS' : 'CODEX_TIMEOUT_MS'] || (fastCreative ? 180000 : 240000));
    return Number.isFinite(configured) ? Math.max(60000, Math.min(240000, Math.round(configured))) : 240000;
  }

  providerTotalTimeoutMs(fastCreative = false): number {
    const active = activeProviderService.get();
    if (active === 'agy') {
      const configured = Number(process.env[fastCreative ? 'AGY_CREATIVE_TOTAL_TIMEOUT_MS' : 'AGY_TOTAL_TIMEOUT_MS'] || (fastCreative ? 600000 : 1200000));
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
        throw this.extractProcessError('AGY (recovery)', rec.code, rec.stdout, rec.stderr);
      }
    }

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
      const { stdout, stderr, code } = await this.spawnProcess('agy', [
        '-p', prompt,
        '--model', model,
        '--output-format', 'json',
        '--print-timeout', `${printTimeoutMin}m`,
        '--disable-slash-commands',
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

    const { stdout, stderr, code } = await this.spawnProcess(active, [
      '-p', prompt, '--output-format', 'json', '--dangerously-skip-permissions',
    ], timeoutMs + 10000);
    if (code !== 0) throw this.extractProcessError(active, code, stdout, stderr);
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

    const prompt = `You are an elite Motion Graphics Software Engineer & Creative Animation Director.
Your task is to author 100% CUSTOM, TOPIC-SPECIFIC Remotion TSX code for this vertical 1080x1920 (9:16) video.

PROJECT: "${input.projectTitle}" (ID: ${input.projectId}), Script v${input.scriptVersion}
OUTPUT FORMAT: 1080 x 1920, 60 FPS, Total Duration: ${totalFrames} frames (${(totalFrames / 60).toFixed(2)}s).

SCENES WITH MEASURED WORD TIMESTAMPS:
${JSON.stringify(compactScenes, null, 2)}

CRITICAL CREATIVE DIRECTIVE — LIVING CONTINUOUS CINEMA (NO SLIDE SHOWS, NO REPETITIVE CIRCLES):
1. THE SINGLE-CANVAS / CONTINUOUS CAMERA LAW:
   - A video is NOT a slide show. NEVER clear the screen to black or white between scenes.
   - Maintain a unified living canvas (ambient gradient depth, moving grid mesh, atmospheric particles).
   - The virtual camera moves continuously across space: interpolate camX, camY, and camScale smoothly across scenes.
   - Elements persist, evolve, or morph: objects introduced in one beat don't vanish abruptly; they anchor to the side, spawn connections, or transform.
2. BAN REPETITIVE CIRCLES & PLACEHOLDER ORBS:
   - NEVER draw generic circular badges for everything (no 50% border radius balls).
   - Every visual must represent literal topic mechanics:
     * Code/Tech: Dark terminal windows ($ git commit), branching commit graphs (DAGs), syntax diff cards with green + and red - lines, bytecode registers.
     * Tools/Software: Real UI artboards, snapping alignment guides, precision Bezier pen tools with tangent handles, multi-layer stacks.
     * Systems/Cloud: Server racks, dynamic laser bus lines, packet queues, telemetry meters.
     * Comparisons: Dual comparative performance meters (turnaround speed vs creative ceiling), balance scales.
3. PROGRESSIVE DISCLOSURE & SPRING PHYSICS:
   - Never drop a finished diagram onto the screen all at once; let lines draw (strokeDashoffset) and nodes bloom in sync with the narration.
   - Use spring physics: spring({ frame: Math.max(0, sceneFrame - delay), fps, config: { damping: 14, stiffness: 120 } }).
   - Continuous subtle idle drift (sin/cos rotation, floating particles, ambient glow).
4. SYNCHRONIZED KINETIC KARAOKE CAPTIONS:
   - For each scene, render the spoken words from scene.words with dynamic active-word scaling and accent glow at startFrame/endFrame.
5. BITTRIX TECHNOLOGIES OUTRO (EXACT ROYAL PURPLE UI & SPOKEN VOICE):
   - The final scene (last ~3s) MUST render the Bittrix Technologies outro grounded in the exact UI (/home/eswaran/Downloads/bittrix-reel(1).html):
     * Theme color: royal purple #5b1a78 with warm cream #fdf3d0.
     * Animated 6-point radial gradient hexagon with spoke circles.
     * Rolling chain link track and rotating 12-tooth gear with serif 'B'.
     * Staggered letter elastic italic bold "BITTRIX" wordmark and tracking "TECHNOLOGIES" subtitle.
     * Expanding purple underline bar and diagonal light sweep.
     * The spoken voiceover must say aloud: "Follow Bittrix Technologies for more interesting concepts." (with matching kinetic karaoke captions).

OUTPUT FORMAT:
Return TWO blocks:
1. A \`\`\`json block with audioDesign and optional scenePlan metadata.
2. A \`\`\`tsx block with the complete, self-contained Remotion component:
import React, { useMemo } from 'react';
import { AbsoluteFill, Sequence, spring, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export default function GeneratedCliVideo(props: any) {
  // Bespoke continuous camera & scene animation logic
}
`;

    let parsed: any = null;
    let rawResponse = '';
    const initialTimeoutMs = Math.max(480000, this.providerTimeoutMs());
    try {
      rawResponse = await this.runText(prompt, { timeoutMs: initialTimeoutMs, projectId: input.projectId });
      const jsonMatch = rawResponse.match(/```(?:json)\s*(\{[\s\S]*?\})\s*```/i);
      if (jsonMatch) {
        try { parsed = JSON.parse(jsonMatch[1].trim()); } catch {}
      }
      if (!parsed) {
        try { parsed = this.extractJson(rawResponse); } catch {}
      }
    } catch (cliErr: any) {
      console.warn(`[${active.toUpperCase()}] CLI initial generation call failed: ${cliErr.message}. Proceeding to agent repair pass.`);
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
    let lastErrors: string[] = [];

    // 1. Extract from ```tsx or ```typescript or ```jsx code fence
    const tsxMatch = rawResponse.match(/```(?:tsx|typescript|jsx)\s*([\s\S]*?)```/i);
    let candidateTsx = tsxMatch ? tsxMatch[1].trim() : null;

    // 2. Also check if JSON had tsxSource
    if (!candidateTsx && parsed && typeof parsed.tsxSource === 'string' && parsed.tsxSource.trim().length > 0) {
      candidateTsx = parsed.tsxSource.trim();
    }

    if (candidateTsx) {
      if (!candidateTsx.includes('export default') && !candidateTsx.includes('export const GeneratedCliVideo')) {
        candidateTsx = `${candidateTsx}\n\nexport default GeneratedCliVideo;`;
      }
      const val = await tsxValidator.validate(candidateTsx);
      if (val.valid) {
        validTsxSource = candidateTsx;
        console.log(`[${active.toUpperCase()}] Custom AI-generated Remotion TSX code passed validation! Using bespoke code.`);
      } else {
        lastErrors = val.errors;
        console.warn(`[${active.toUpperCase()}] Custom TSX initial validation warnings: ${val.errors.join('; ')}`);
      }
    } else {
      lastErrors = ['Agent did not return a ```tsx code fence in initial response'];
    }

    // Agent Self-Repair Loop: Per user rule, ZERO template fallbacks. The agent MUST author the code.
    let repairAttempts = 0;
    const maxRepairAttempts = 2;

    while (!validTsxSource && repairAttempts < maxRepairAttempts) {
      repairAttempts++;
      console.log(`[${active.toUpperCase()}] Requesting agent TSX authoring/repair pass (Attempt ${repairAttempts}/${maxRepairAttempts})...`);

      const repairPrompt = `You are an elite Motion Graphics Software Engineer authoring bespoke Remotion TSX code.
CRITICAL CONSTRAINT: TEMPLATE FALLBACKS HAVE BEEN PERMANENTLY REMOVED. You as the AI agent MUST author 100% of the Remotion TSX component code yourself.

${candidateTsx ? `Your previous TSX code failed validation with the following errors:\n- ${lastErrors.join('\n- ')}\n\nFix every issue and output the complete, corrected code.` : 'You did not output the required Remotion TSX component in a ```tsx code fence. You must generate the complete component now.'}

PROJECT: "${input.projectTitle}" (ID: ${input.projectId})
TOTAL DURATION: ${totalFrames} frames @ 60fps (${(totalFrames / 60).toFixed(2)}s)

SCENES WITH MEASURED TIMESTAMPS:
${JSON.stringify(compactScenes, null, 2)}

STRICT RULES:
1. Export default component: export default function GeneratedCliVideo(props: any) { ... }
2. Import from 'remotion': AbsoluteFill, Sequence, spring, interpolate, useCurrentFrame, useVideoConfig
3. Single continuous living canvas with continuous virtual camera interpolation (camX, camY, camScale).
4. Topic-specific physical visual mechanics for "${input.projectTitle}". ABSOLUTELY ZERO generic 50% border-radius circles or placeholder orbs.
5. Synchronized kinetic karaoke captions from scene.words.
6. The FINAL SCENE (~last 3s) MUST render the exact Bittrix Technologies royal purple (#5b1a78) outro:
   - 6-point radial gradient hexagon with spoke circles
   - Rolling chain link track and rotating 12-tooth gear with serif 'B'
   - Staggered letter italic bold "BITTRIX" and tracking "TECHNOLOGIES"
   - Expanding purple underline and light shine sweep
   - Spoken narration aloud: "Follow Bittrix Technologies for more interesting concepts."
7. Return ONLY valid, self-contained TypeScript/TSX in a \`\`\`tsx code fence. No explanations, no placeholder stubs.
`;

      const repairTimeoutMs = Math.max(420000, this.providerTimeoutMs());
      try {
        const repairResponse = await this.runText(repairPrompt, { timeoutMs: repairTimeoutMs, projectId: input.projectId });
        const repMatch = repairResponse.match(/```(?:tsx|typescript|jsx)\s*([\s\S]*?)```/i);
        candidateTsx = repMatch ? repMatch[1].trim() : null;
        if (!candidateTsx && repairResponse.includes('import') && repairResponse.includes('GeneratedCliVideo')) {
          candidateTsx = repairResponse.trim();
        }
        if (candidateTsx) {
          if (!candidateTsx.includes('export default') && !candidateTsx.includes('export const GeneratedCliVideo')) {
            candidateTsx = `${candidateTsx}\n\nexport default GeneratedCliVideo;`;
          }
          const val = await tsxValidator.validate(candidateTsx);
          if (val.valid) {
            validTsxSource = candidateTsx;
            console.log(`[${active.toUpperCase()}] Agent bespoke Remotion TSX code passed validation on attempt ${repairAttempts}!`);
            break;
          } else {
            lastErrors = val.errors;
            console.warn(`[${active.toUpperCase()}] Agent TSX validation failed on attempt ${repairAttempts}: ${val.errors.join('; ')}`);
          }
        } else {
          lastErrors = ['Agent did not return a ```tsx code fence'];
        }
      } catch (err: any) {
        console.error(`[${active.toUpperCase()}] Agent repair pass failed with error:`, err.message);
        lastErrors = [err.message];
      }
    }

    if (!validTsxSource) {
      throw new Error(`[UnifiedCliProvider] The AI agent failed to author valid Remotion TSX after ${repairAttempts} attempts (${lastErrors.join('; ')}). Per user rule, template fallbacks are strictly disabled.`);
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
  // Process Spawner & Error Extraction Helper
  // ──────────────────────────────────────────────────
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

}

export const unifiedCliProvider = new UnifiedCliProvider();
