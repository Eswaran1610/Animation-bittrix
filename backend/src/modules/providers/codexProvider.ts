import { TokenUsage } from './providerAdapter.js';
import { BasePlanProvider } from './basePlanProvider.js';
import { spawn } from 'child_process';
import { projectPaths } from '../../config/paths.js';
import { realtime } from '../../realtime.js';

const activeCodexChildren = new Set<ReturnType<typeof spawn>>();

const signalCodexProcessTree = (child: ReturnType<typeof spawn>, signal: NodeJS.Signals) => {
  if (child.exitCode !== null || child.signalCode !== null) return;
  if (process.platform !== 'win32' && child.pid) {
    try {
      process.kill(-child.pid, signal);
      return;
    } catch {
      // The group may already have exited; fall back to the direct child.
    }
  }
  child.kill(signal);
};

export const shutdownCodexProcesses = () => {
  const children = [...activeCodexChildren];
  for (const child of children) {
    signalCodexProcessTree(child, 'SIGTERM');
  }
  if (children.length > 0) {
    const forceKillTimer = setTimeout(() => {
      for (const child of children) {
        signalCodexProcessTree(child, 'SIGKILL');
      }
    }, 1500);
    forceKillTimer.unref();
  }
};

export class CodexProvider extends BasePlanProvider {
  name = 'codex';

  providerTimeoutMs(fastCreative = false): number {
    return this.codexTimeoutMs(fastCreative);
  }

  providerTotalTimeoutMs(fastCreative = false): number {
    return this.codexTotalTimeoutMs(fastCreative);
  }

  protected async executePlan(
    prompt: string,
    timeoutMs: number,
    projectId: string | undefined,
    deadlineAt: number,
    fastCreative = false
  ): Promise<{ output: string; tokenUsage: TokenUsage; parsed: any }> {
    return this.runCodexPlan(prompt, timeoutMs, projectId, deadlineAt, fastCreative);
  }

  private codexTimeoutMs(fastCreative = false): number {
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

  private extractTokenUsage(output: string, prompt: string): TokenUsage {
    void prompt;
    const usage: TokenUsage = {
      input_tokens: 0,
      output_tokens: 0,
      total_tokens: 0,
      estimated: false,
      available: false,
      source: 'unavailable'
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
        usage.input_tokens = Number.isFinite(input) ? input : 0;
        usage.output_tokens = Number.isFinite(outputTokens) ? outputTokens : 0;
        usage.total_tokens = Number.isFinite(total) ? total : usage.input_tokens + usage.output_tokens;
        usage.estimated = false;
        usage.available = true;
        usage.source = 'codex';
        return usage;
      }
    }
    return usage;
  }

  private async runCodex(prompt: string, timeoutMs = 240000, projectId?: string): Promise<{ output: string; tokenUsage: TokenUsage }> {
    let output = '';
    let errorOutput = '';
    let lastUsageEvent = 0;
    let timedOut = false;
    const publishLiveUsage = (active: boolean) => {
      if (!projectId) return;
      const now = Date.now();
      if (active && now - lastUsageEvent < 250) return;
      lastUsageEvent = now;
      realtime.publish({
        type: 'codex_usage_progress',
        projectId,
        available: false,
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
        detached: process.platform !== 'win32',
      });
      activeCodexChildren.add(child);
      let forceKillTimer: NodeJS.Timeout | undefined;
      const timer = setTimeout(() => {
        timedOut = true;
        signalCodexProcessTree(child, 'SIGTERM');
        forceKillTimer = setTimeout(() => {
          signalCodexProcessTree(child, 'SIGKILL');
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
          if (timedOut) {
            reject(new Error(`Codex CLI timed out after ${Math.round(timeoutMs / 1000)} seconds`));
            return;
          }
          if (code !== 0) {
            reject(new Error(`Codex CLI failed with exit code ${code}: ${errorOutput}`));
            return;
          }
          resolve();
        });
      });
    } catch (err: any) {
      console.error('[CodexProvider] Error running codex CLI:', err.message);
      publishLiveUsage(false);
      throw err;
    } finally {
      publishLiveUsage(false);
    }

    const tokenUsage = this.extractTokenUsage(output, prompt);
    return { output, tokenUsage };
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
}
