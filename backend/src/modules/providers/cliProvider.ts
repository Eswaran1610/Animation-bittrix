import { TokenUsage, ResearchAndScriptRequest } from './providerAdapter.js';
import { BasePlanProvider } from './basePlanProvider.js';
import { activeProviderService, ProviderId } from './activeProviderService.js';
import { spawn } from 'child_process';
import { projectPaths } from '../../config/paths.js';
import { realtime } from '../../realtime.js';

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
    const configured = Number(process.env[fastCreative ? 'CODEX_CREATIVE_TIMEOUT_MS' : 'CODEX_TIMEOUT_MS'] || (fastCreative ? 240000 : 360000));
    return Number.isFinite(configured) ? Math.max(60000, Math.min(600000, Math.round(configured))) : 240000;
  }

  providerTotalTimeoutMs(fastCreative = false): number {
    const active = activeProviderService.get();
    if (active === 'agy') {
      const configured = Number(process.env[fastCreative ? 'AGY_CREATIVE_TOTAL_TIMEOUT_MS' : 'AGY_TOTAL_TIMEOUT_MS'] || (fastCreative ? 480000 : 720000));
      return Number.isFinite(configured) ? Math.max(120000, Math.min(900000, Math.round(configured))) : 540000;
    }
    const configured = Number(process.env[fastCreative ? 'CODEX_CREATIVE_TOTAL_TIMEOUT_MS' : 'CODEX_TOTAL_TIMEOUT_MS'] || (fastCreative ? 480000 : 720000));
    return Number.isFinite(configured) ? Math.max(120000, Math.min(900000, Math.round(configured))) : 480000;
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
    const parsed = this.extractJson(stdout);
    return {
      output: stdout,
      tokenUsage: { input_tokens: 0, output_tokens: 0, total_tokens: 0, estimated: true, available: false, source: 'unavailable' },
      parsed
    };
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
