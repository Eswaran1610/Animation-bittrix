import { execFile } from 'child_process';
import { promisify } from 'util';
import { projectPaths } from '../../config/paths.js';

const execFileAsync = promisify(execFile);
type ConnectionState = 'unknown' | 'connected' | 'failed';

/** Checks the existing local Claude Code CLI login session. */
class ClaudeAuthService {
  private lastState: ConnectionState = 'unknown';
  private lastMessage = 'Claude Code has not been verified in this backend session.';

  async status() {
    const cliAvailable = await this.isCliAvailable();
    if (!cliAvailable) {
      return {
        cliAvailable: false,
        state: 'failed' as const,
        message: 'Claude Code CLI is not installed. Install via: npm install -g @anthropic-ai/claude-code',
      };
    }

    try {
      // claude --version exits 0 when authenticated; --help or version is enough for a quick alive check
      const { stdout } = await execFileAsync('claude', ['--version'], {
        timeout: 5_000,
        cwd: projectPaths.root,
      });
      const version = stdout.trim();
      this.lastState = 'connected';
      this.lastMessage = `Claude Code is connected on this machine (${version}).`;
    } catch {
      this.lastState = 'failed';
      this.lastMessage = 'Claude Code is installed but authentication failed. Run `claude login` in this terminal.';
    }
    return { cliAvailable: true, state: this.lastState, message: this.lastMessage };
  }

  async start() {
    return this.status();
  }

  private async isCliAvailable(): Promise<boolean> {
    try {
      await execFileAsync('claude', ['--version'], { timeout: 5_000, cwd: projectPaths.root });
      return true;
    } catch {
      return false;
    }
  }
}

export const claudeAuthService = new ClaudeAuthService();
