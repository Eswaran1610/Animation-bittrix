import { BasePlanProvider } from './basePlanProvider.js';
import { TokenUsage } from './providerAdapter.js';
import { spawn } from 'child_process';
import { projectPaths } from '../../config/paths.js';
import { realtime } from '../../realtime.js';

export class AgyProvider extends BasePlanProvider {
  name = 'agy';

  providerTimeoutMs(fastCreative = false): number {
    const configured = Number(process.env[fastCreative ? 'AGY_CREATIVE_TIMEOUT_MS' : 'AGY_TIMEOUT_MS'] || 180000);
    return Number.isFinite(configured) ? Math.max(60000, Math.min(360000, configured)) : 180000;
  }

  providerTotalTimeoutMs(fastCreative = false): number {
    const configured = Number(process.env[fastCreative ? 'AGY_CREATIVE_TOTAL_TIMEOUT_MS' : 'AGY_TOTAL_TIMEOUT_MS'] || 360000);
    return Number.isFinite(configured) ? Math.max(120000, Math.min(720000, configured)) : 360000;
  }

  protected async executePlan(
    prompt: string,
    timeoutMs: number,
    projectId: string | undefined,
    deadlineAt: number,
    fastCreative = false
  ): Promise<{ output: string; tokenUsage: TokenUsage; parsed: any }> {
    const remainingMs = Math.max(15000, deadlineAt - Date.now());
    const effectiveTimeoutMs = Math.min(timeoutMs, remainingMs);
    const model = process.env.AGY_MODEL || 'gemini-3.8-flash-medium';

    console.log(`[AgyProvider] Executing agy CLI (model=${model}, timeout=${Math.round(effectiveTimeoutMs / 1000)}s)...`);
    if (projectId) {
      realtime.publish({
        type: 'pipeline_progress',
        projectId,
        stage: 'research',
        progress: 25,
        status: `AGY (${model}) synthesizing animation script...`
      });
    }

    const { stdout, stderr, code } = await this.spawnAgy(prompt, model, effectiveTimeoutMs);
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
      throw new Error(`AGY returned status "${container.status}": ${container.response || stdout}`);
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
      console.warn(`[AgyProvider] AGY output was not immediately parseable (${parseErr?.message}); running recovery pass...`);
      const recoveryPrompt = prompt + '\n\nOUTPUT RECOVERY: Return ONLY one complete valid JSON object matching the required schema, starting with { and ending with }. Do not add markdown commentary outside the JSON.';
      const rec = await this.spawnAgy(recoveryPrompt, model, Math.min(effectiveTimeoutMs, 60000));
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

    return {
      output: responseText,
      tokenUsage,
      parsed,
    };
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

  private async spawnAgy(
    prompt: string,
    model: string,
    timeoutMs: number
  ): Promise<{ stdout: string; stderr: string; code: number | null }> {
    const printTimeoutMin = Math.max(5, Math.ceil(timeoutMs / 60000));
    return new Promise((resolve, reject) => {
      const child = spawn('agy', [
        '-p', prompt,
        '--model', model,
        '--output-format', 'json',
        '--print-timeout', `${printTimeoutMin}m`,
        '--disable-slash-commands',
        '--dangerously-skip-permissions',
      ], {
        cwd: projectPaths.root,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: process.platform !== 'win32',
      });

      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const timer = setTimeout(() => {
        timedOut = true;
        if (child.pid && process.platform !== 'win32') {
          try { process.kill(-child.pid, 'SIGTERM'); } catch {}
        }
        child.kill('SIGTERM');
        setTimeout(() => {
          if (child.pid && process.platform !== 'win32') {
            try { process.kill(-child.pid, 'SIGKILL'); } catch {}
          }
          child.kill('SIGKILL');
        }, 2000);
      }, timeoutMs);

      child.stdout.on('data', (d) => { stdout += d.toString(); });
      child.stderr.on('data', (d) => { stderr += d.toString(); });

      child.on('close', (code) => {
        clearTimeout(timer);
        if (timedOut) {
          reject(new Error(`AGY CLI timed out after ${Math.round(timeoutMs / 1000)} seconds`));
          return;
        }
        resolve({ stdout, stderr, code });
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }
}

export const agyProvider = new AgyProvider();
