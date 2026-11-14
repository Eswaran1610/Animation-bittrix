import { execFile } from 'child_process';
import { promisify } from 'util';
import { projectPaths } from '../../config/paths.js';
import { activeProviderService } from '../providers/activeProviderService.js';

const execFileAsync = promisify(execFile);
type ConnectionState = 'unknown' | 'connected' | 'failed';

/** Checks that the local Claude Code CLI is installed and runnable. */
class ClaudeAuthService {
  private lastState: ConnectionState = 'unknown';
  private lastMessage = 'Claude Code has not been verified in this backend session.';

  async status() {
    const cliAvailable = await this.isCliAvailable();
    if (!cliAvailable) {
      return {
        cliAvailable: false,
        state: 'failed' as const,
        isActive: false,
        message: 'Claude Code CLI is not installed. Install via: npm install -g @anthropic-ai/claude-code',
      };
    }

    try {
      const bin = this.getClaudeBin();
      const { stdout } = await execFileAsync(bin, ['--version'], {
        timeout: 5_000,
        cwd: projectPaths.root,
      });
      const version = stdout.trim();
      this.lastState = 'connected';
      this.lastMessage = `Claude Code CLI is available on this machine (${version}).`;
    } catch {
      this.lastState = 'failed';
      this.lastMessage = 'Claude Code CLI could not be verified. Check its installation and run `claude login` if generation reports an authentication error.';
    }
    const isActive = activeProviderService.get() === 'claude';
    return {
      cliAvailable: true,
      state: this.lastState === 'connected' ? (isActive ? 'connected' as const : 'standby' as const) : this.lastState,
      isActive,
      message: isActive ? `Claude Code is selected as the active CLI. ${this.lastMessage}` : this.lastMessage,
    };
  }

  async start() {
    const stat = await this.status();
    if (stat.state === 'failed' || !stat.cliAvailable) return stat;
    activeProviderService.set('claude');
    return this.status();
  }

  async disconnect() {
    if (activeProviderService.get() === 'claude') activeProviderService.disconnect();
    return this.status();
  }

  private getClaudeBin(): string {
    return process.env.CLAUDE_BIN || '/home/inkyank/.local/bin/claude';
  }

  private async isCliAvailable(): Promise<boolean> {
    try {
      const bin = this.getClaudeBin();
      await execFileAsync(bin, ['--version'], { timeout: 5_000, cwd: projectPaths.root });
      return true;
    } catch {
      return false;
    }
  }
}

export const claudeAuthService = new ClaudeAuthService();
