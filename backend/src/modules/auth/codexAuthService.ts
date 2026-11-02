import { execFile } from 'child_process';
import { promisify } from 'util';
import { projectPaths } from '../../config/paths.js';

const execFileAsync = promisify(execFile);
type ConnectionState = 'unknown' | 'connected' | 'failed';

/** Checks the existing local Codex CLI login; credentials never cross the API boundary. */
class CodexAuthService {
  private lastState: ConnectionState = 'unknown';
  private lastMessage = 'Codex has not been verified in this backend session.';

  async status() {
    const cliAvailable = await this.isCliAvailable();
    if (!cliAvailable) {
      return { cliAvailable: false, state: 'failed' as const, message: 'Codex CLI is not installed or is unavailable on PATH.' };
    }

    try {
      await execFileAsync('codex', ['login', 'status'], { timeout: 5_000, cwd: projectPaths.root });
      this.lastState = 'connected';
      this.lastMessage = 'Codex is connected on this machine.';
    } catch {
      this.lastState = 'failed';
      this.lastMessage = 'Codex is installed but not logged in. Run `codex login` in this terminal.';
    }
    return { cliAvailable: true, state: this.lastState, message: this.lastMessage };
  }

  async start() {
    return this.status();
  }

  private async isCliAvailable(): Promise<boolean> {
    try {
      await execFileAsync('codex', ['--version'], { timeout: 5_000, cwd: projectPaths.root });
      return true;
    } catch {
      return false;
    }
  }
}

export const codexAuthService = new CodexAuthService();
