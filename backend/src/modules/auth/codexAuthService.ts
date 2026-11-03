import { execFile } from 'child_process';
import { promisify } from 'util';
import { projectPaths } from '../../config/paths.js';
import { activeProviderService } from '../providers/activeProviderService.js';

const execFileAsync = promisify(execFile);
export type ConnectionState = 'unknown' | 'connected' | 'standby' | 'failed';

class CodexAuthService {
  async status() {
    const cliAvailable = await this.isCliAvailable();
    if (!cliAvailable) {
      return {
        cliAvailable: false,
        state: 'failed' as const,
        isActive: false,
        message: 'Codex CLI is not installed or unavailable on PATH.',
      };
    }

    try {
      await execFileAsync('codex', ['login', 'status'], { timeout: 5_000, cwd: projectPaths.root });
      const isActive = activeProviderService.get() === 'codex';
      return {
        cliAvailable: true,
        state: (isActive ? 'connected' : 'standby') as ConnectionState,
        isActive,
        message: isActive
          ? 'Codex is connected as the ACTIVE CLI provider.'
          : 'Codex is verified and ready on this machine (Standby).',
      };
    } catch {
      return {
        cliAvailable: true,
        state: 'failed' as const,
        isActive: false,
        message: 'Codex is installed but not logged in. Run `codex login` in terminal.',
      };
    }
  }

  async connect() {
    const stat = await this.status();
    if (stat.state === 'failed' || !stat.cliAvailable) {
      return stat;
    }
    // Activate Codex as the ONLY connected provider
    activeProviderService.set('codex');
    return this.status();
  }

  async disconnect() {
    if (activeProviderService.get() === 'codex') {
      activeProviderService.disconnect();
    }
    return this.status();
  }

  // Backward compatibility alias for start()
  async start() {
    return this.connect();
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
