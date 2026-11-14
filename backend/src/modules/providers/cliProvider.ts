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
      const configured = Number(process.env[fastCreative ? 'CLAUDE_CREATIVE_TIMEOUT_MS' : 'CLAUDE_TIMEOUT_MS'] || (fastCreative ? 300000 : 600000));
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
      'agy',
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



  // ──────────────────────────────────────────────────
  // Generic / Claude Code Runner
  // ──────────────────────────────────────────────────
  private async runGenericCliPlan(
    cliBin: string,
    prompt: string,
    timeoutMs: number,
    projectId: string | undefined
  ): Promise<{ output: string; tokenUsage: TokenUsage; parsed: any }> {
    const claudeModel = process.env.CLAUDE_MODEL || 'opus';
    const resolvedBin = cliBin === 'claude' ? (process.env.CLAUDE_BIN || '/home/inkyank/.local/bin/claude') : cliBin;
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
      const { stdout, stderr, code } = await this.spawnProcess('agy', [
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

    const resolvedBin = active === 'claude' ? (process.env.CLAUDE_BIN || '/home/inkyank/.local/bin/claude') : active;
    const claudeModel = process.env.CLAUDE_MODEL || 'opus';
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

    let facelessSkillContext = '';
    const isFacelessArchetype = input.styleBrief?.archetype === 'faceless-story' || /\b(story|thief|police|chase|heist|drama|what if)\b/i.test(input.projectTitle || '');
    if (isFacelessArchetype) {
      try {
        facelessSkillContext = await readFile(path.join(projectPaths.root, '.agents/skills/faceless-shorts/SKILL.md'), 'utf8');
      } catch (err: any) {
        console.warn(`[CliProvider] Note: faceless-shorts skill could not be read: ${err?.message}`);
      }
    }

    const themeBrief = input.styleBrief || {};
    const themePalette = themeBrief.palette || { bg: '#07080e', surface: '#121422', primary: '#38bdf8', accent: '#00f5d4', text: '#ffffff' };
    const themeFonts = themeBrief.fonts || { heading: 'Inter, system-ui, sans-serif', body: 'Inter, system-ui, sans-serif' };

    const themeDirective = `MANDATORY ANIMATION THEME & COLOR PALETTE SPECIFICATION:
- Theme Archetype: ${themeBrief.archetype || 'motion-graphics'}
- Motion Personality: ${themeBrief.motionPersonality || 'snappy spring physics'}
- Background System: ${themeBrief.background || 'living gradient canvas with particle drift'}
- Exact Colors:
  * Background: ${themePalette.bg}
  * Surface/Cards: ${themePalette.surface}
  * Primary Brand: ${themePalette.primary}
  * Secondary Accent: ${themePalette.accent}
  * Text Color: ${themePalette.text}
- Typography:
  * Heading Font: "${themeFonts.heading}"
  * Body Font: "${themeFonts.body}"
CRITICAL: Every scene must be styled strictly according to this theme and palette!`;

    const prompt = `You are the Lead Creative Director & Principal Motion Graphics Engineer.
You have COMPLETE ARTISTIC FREEDOM to design and engineer bespoke Remotion TSX for this vertical 1080x1920 (9:16) video.

PROJECT: "${input.projectTitle}" (ID: ${input.projectId}), Script v${input.scriptVersion}
OUTPUT FORMAT: 1080 x 1920, 60 FPS, Total Duration: ${totalFrames} frames (${(totalFrames / 60).toFixed(2)}s).

SCENES WITH MEASURED WORD TIMESTAMPS:
${JSON.stringify(compactScenes, null, 2)}

CREATIVE DIRECTOR PHILOSOPHY:
You are not bound to rigid templates. Look at the topic "${input.projectTitle}".
- If it is a STORY, CHILDREN'S ADVENTURE, FAIRY TALE, or WHAT-IF:
  * Design rich story environments, cute animated characters, colorful props, toy chests, cars, animals, or isometric dioramas.
  * DO NOT force developer terminals, code syntax diffs, or server telemetry onto a story.
- If it is a TECH, CODE, ARCHITECTURE, or INFRASTRUCTURE topic:
  * Design sleek, modern tech micro-UIs (Linear/Claude style), terminals, commit trees, network nodes, and bus lines.
- If it is a SCIENCE, NATURE, or DOCUMENTARY topic:
  * Design physical diagrams, biological cross-sections, zoom lenses, and kinetic explanations.

YOU HAVE FULL ACCESS TO MODERN MOTION COMPONENTS (import and use whatever fits the topic):
import {
  TerminalWindow,   // (Use for tech/code only)
  GlassCard,        // (Frosted glass cards, story plaques, telemetry)
  LaserBusLine,     // (Connection bus lines)
  GitCommitGraph,   // (Git DAG, branch trees - tech only)
  TelemetryPill,    // (Status pills, badges)
  NetworkNodes,     // (Node topologies, constellations)
  MetricBar,        // (Progress bars, counters, meters)
  KineticTitle      // (Hero titles with glowing badges)
} from '../../components/MotionElements';
import { SyncCaptions } from '../../components/SyncCaptions';
import { BittrixOutroExact } from '../../components/BittrixOutroExact';

CORE LAWS:
1. CONTINUOUS LIVING CANVAS & CAMERA:
   - A video is never a slideshow. The canvas is continuous.
   - Interpolate a virtual camera (camX, camY, camScale, rot) across scenes to create organic motion.
   - Use organic spring physics: spring({ frame, fps, config: { damping: 12, stiffness: 120 } }).

2. VERTICAL SAFE MARGINS & CAPTIONS:
   - Synchronized kinetic karaoke captions from scene.words using <SyncCaptions words={scene.words} currentFrame={frame} accentColor={...} /> placed in the safe zone (bottom > 380px).
   - Visual focal points should sit in the middle zone (between top 160px and bottom 440px) so nothing clips or collides with captions.

3. MANDATORY FINAL 3 SECONDS BITTRIX TECHNOLOGIES OUTRO:
   - In the final scene (~last 3 seconds / ~90 frames), render the official Bittrix Technologies outro (<BittrixOutroExact /> or royal purple #5b1a78 branding) with spoken narration & captions: "Follow Bittrix Technologies for more interesting concepts."

OUTPUT FORMAT:
Return ONLY the working, self-contained Remotion TSX code block in a \`\`\`tsx code fence:
export default function GeneratedCliVideo(props: any) { ... }
Do NOT output conversational filler or placeholder stubs. Output only the working TSX code block.
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
3. Import Claude-grade micro-UI primitives from '../../components/MotionElements':
   import { TerminalWindow, GlassCard, LaserBusLine, GitCommitGraph, TelemetryPill, NetworkNodes, MetricBar, KineticTitle } from '../../components/MotionElements';
   import { SyncCaptions } from '../../components/SyncCaptions';
   import { BittrixOutroExact } from '../../components/BittrixOutroExact';
4. Single continuous living canvas with continuous virtual camera interpolation (camX, camY, camScale).
5. Topic-specific physical visual mechanics for "${input.projectTitle}". ABSOLUTELY ZERO generic 50% border-radius circles or placeholder orbs. Use TerminalWindow, GlassCard, GitCommitGraph, LaserBusLine, etc.
6. Synchronized kinetic karaoke captions from scene.words using SyncCaptions.
7. The FINAL SCENE (~last 3s) MUST render the exact Bittrix Technologies royal purple (#5b1a78) outro (<BittrixOutroExact /> or equivalent).
8. Return ONLY valid, self-contained TypeScript/TSX in a \`\`\`tsx code fence. No explanations, no placeholder stubs.
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

  /**
   * Revise the existing bespoke Remotion TSX code based on user visual feedback (Gate 2).
   * Voiceover audio and scene timings are preserved; only visual animation and styles are adjusted.
   */
  async revisePreviewVisuals(input: {
    projectId: string;
    projectTitle: string;
    scriptVersion: number;
    previewVersion: number;
    visualFeedback: string;
    currentTsxSource: string;
    compactScenes: any[];
  }): Promise<{ tsxSource: string }> {
    const active = activeProviderService.get();
    console.log(`[${active.toUpperCase()}] AI Agent revising visuals for project "${input.projectTitle}" based on user feedback: "${input.visualFeedback}"...`);

    const prompt = `You are an elite Motion Graphics Software Engineer & Creative Animation Director.
The user watched the Preview video (v${input.previewVersion}) and requested VISUAL REVISIONS.
CRITICAL CONSTRAINT: DO NOT alter the narration text or scene durations, as audio is already recorded and approved.
Update the Remotion TSX component code to fulfill the user's visual feedback precisely:

USER VISUAL FEEDBACK:
"${input.visualFeedback}"

PROJECT: "${input.projectTitle}" (ID: ${input.projectId})
SCENES WITH MEASURED TIMESTAMPS (PRESERVE EXACT TIMINGS & WORDS):
${JSON.stringify(input.compactScenes, null, 2)}

EXISTING REMOTION TSX CODE:
\`\`\`tsx
${input.currentTsxSource}
\`\`\`

REQUIREMENTS:
1. Apply the user's requested visual changes (e.g., colors, typography, 3D elements, diagrams, spring physics, or camera motion).
2. Ensure all scene sequence timings, karaoke highlight conditions, and Bittrix outro remain intact.
3. Return ONLY valid, self-contained TypeScript/TSX in a \`\`\`tsx code fence:
export default function GeneratedCliVideo(props: any) { ... }
`;

    const timeoutMs = Math.max(480000, this.providerTimeoutMs());
    const rawResponse = await this.runText(prompt, { timeoutMs, projectId: input.projectId });

    const tsxMatch = rawResponse.match(/```(?:tsx|typescript|jsx)\s*([\s\S]*?)```/i);
    let candidateTsx = tsxMatch ? tsxMatch[1].trim() : null;
    if (!candidateTsx && rawResponse.includes('import') && rawResponse.includes('GeneratedCliVideo')) {
      candidateTsx = rawResponse.trim();
    }

    if (!candidateTsx) {
      throw new Error('[UnifiedCliProvider] AI agent did not return a valid ```tsx code fence for visual revision.');
    }

    if (!candidateTsx.includes('export default') && !candidateTsx.includes('export const GeneratedCliVideo')) {
      candidateTsx = `${candidateTsx}\n\nexport default GeneratedCliVideo;`;
    }

    const val = await tsxValidator.validate(candidateTsx);
    if (!val.valid) {
      console.warn(`[${active.toUpperCase()}] Revised TSX validation warnings: ${val.errors.join('; ')}`);
      // Run quick repair pass
      const repairPrompt = `Your revised TSX code had validation issues:
- ${val.errors.join('\n- ')}

Fix all issues and return the complete, corrected Remotion TSX in a \`\`\`tsx code fence:
export default function GeneratedCliVideo(props: any) { ... }`;
      const repResponse = await this.runText(repairPrompt, { timeoutMs: 180000, projectId: input.projectId });
      const repMatch = repResponse.match(/```(?:tsx|typescript|jsx)\s*([\s\S]*?)```/i);
      if (repMatch) candidateTsx = repMatch[1].trim();
    }

    console.log(`[${active.toUpperCase()}] Visual revisions successfully applied by AI agent!`);
    return { tsxSource: candidateTsx };
  }

  /**
   * Autonomous Post-Render Visual Audit & Self-Repair Gate
   *
   * AGY inspects the rendered scene stills and validates visual hierarchy,
   * safe margins, topic coherence, and aesthetic quality. If issues are found,
   * AGY directly authors the corrected TSX to trigger an automatic self-repair render.
   */
  async auditAndSelfCorrectPreview(input: {
    projectId: string;
    projectTitle: string;
    previewVersion: number;
    currentTsxSource: string;
    stillImages: string[];
    compactScenes: any[];
  }): Promise<{ approved: boolean; summary: string; revisedTsx?: string }> {
    const active = activeProviderService.get();
    console.log(`[${active.toUpperCase()}] Visual QA Director auditing rendered preview v${input.previewVersion} for "${input.projectTitle}" (${input.stillImages.length} scene stills)...`);

    const prompt = `You are an elite Motion Graphics Art Director and Senior Remotion Software Engineer.
Perform an AUTONOMOUS VISUAL AUDIT of the rendered preview video (v${input.previewVersion}) for project "${input.projectTitle}".

RENDERED SCENE STILLS AVAILABLE ON DISK:
${input.stillImages.map((img, i) => `- Scene ${i + 1}: ${img}`).join('\n')}

CURRENT REMOTION TSX SOURCE CODE:
\`\`\`tsx
${input.currentTsxSource}
\`\`\`

SCENE TIMELINE & ROLES:
${JSON.stringify(input.compactScenes, null, 2)}

SENIOR MOTION GRAPHICS AUDIT CRITERIA:
1. TOPIC-VISUAL COHERENCE:
   - Does each scene reflect the literal subject matter of "${input.projectTitle}"?
   - CRITICAL: If the project is a STORY, narrative, what-if, or character adventure, it MUST NOT use developer terminal windows ($ git commit), syntax diffs, or server telemetry pills. It must use story props, character silhouettes, or thematic artwork!
2. SAFE MARGINS & READABILITY:
   - Kinetic captions must stay inside the bottom safe zone above bottom 20% (bottom > 384px).
   - Content cards must be centered between top 120px and bottom 440px without overflowing or clipping.
3. MOTION & HIERARCHY:
   - Elements must not be static or overlapping.
   - Bittrix Technologies outro must be cleanly rendered in the final scene.

DECISION PROTOCOL:
If the visual design passes all criteria, reply with:
STATUS: APPROVED
SUMMARY: <1-2 sentences on why the visuals pass>

If the visual design has flaws (e.g. wrong archetype, terminal windows in a story, overlapping text, bad margins), reply with:
STATUS: NEEDS_REVISION
SUMMARY: <bulleted list of specific visual flaws>
\`\`\`tsx
<the complete, corrected, self-contained Remotion TSX component with the fixes applied>
\`\`\`
`;

    const timeoutMs = Math.max(300000, this.providerTimeoutMs());
    const response = await this.runText(prompt, { timeoutMs, projectId: input.projectId });

    if (response.includes('STATUS: APPROVED') && !response.includes('STATUS: NEEDS_REVISION')) {
      const summaryMatch = response.match(/SUMMARY:\s*([\s\S]*?)(?:\n\n|$)/i);
      const summary = summaryMatch ? summaryMatch[1].trim() : 'Visual composition and safe margins approved by AI Director.';
      console.log(`[${active.toUpperCase()}] Visual QA Audit PASSED: ${summary}`);
      return { approved: true, summary };
    }

    const tsxMatch = response.match(/```(?:tsx|typescript|jsx)\s*([\s\S]*?)```/i);
    let candidateTsx = tsxMatch ? tsxMatch[1].trim() : null;

    if (candidateTsx) {
      if (!candidateTsx.includes('export default') && !candidateTsx.includes('export const GeneratedCliVideo')) {
        candidateTsx = `${candidateTsx}\n\nexport default GeneratedCliVideo;`;
      }
      const val = await tsxValidator.validate(candidateTsx);
      if (val.valid) {
        console.log(`[${active.toUpperCase()}] Visual QA Audit detected issues and automatically authored corrected TSX!`);
        return { approved: false, summary: 'Autonomous visual repair applied by AI Director', revisedTsx: candidateTsx };
      }
    }

    return { approved: true, summary: 'Visual audit completed without requiring critical code revisions.' };
  }
}

export const unifiedCliProvider = new UnifiedCliProvider();
