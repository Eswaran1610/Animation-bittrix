import { execFile } from 'child_process';
import { promisify } from 'util';
import { projectPaths } from '../../config/paths.js';
import { activeProviderService } from '../providers/activeProviderService.js';
import { ConnectionState } from './codexAuthService.js';

const execFileAsync = promisify(execFile);

class AgyAuthService {
  async status() {
    let version = '';
    try {
      const { stdout } = await execFileAsync('agy', ['--version'], {
        timeout: 5_000,
        cwd: projectPaths.root,
      });
      version = stdout.trim() || '1.1.22';
    } catch {
      return {
        cliAvailable: false,
        state: 'failed' as const,
        isActive: false,
        message: 'AGY CLI is not installed or unavailable on PATH.',
        version: '',
      };
    }

    const isActive = activeProviderService.get() === 'agy';
    return {
      cliAvailable: true,
      state: (isActive ? 'connected' : 'standby') as ConnectionState,
      isActive,
      message: isActive
        ? `AGY CLI v${version} is connected as the ACTIVE CLI provider.`
        : `AGY CLI v${version} is ready on this machine (Standby).`,
      version,
    };
  }

  async connect() {
    const stat = await this.status();
    if (stat.state === 'failed' || !stat.cliAvailable) {
      return stat;
    }
    // Activate AGY as the ONLY connected provider
    activeProviderService.set('agy');
    return this.status();
  }

  async disconnect() {
    if (activeProviderService.get() === 'agy') {
      activeProviderService.disconnect();
    }
    return this.status();
  }

  async start() {
    return this.connect();
  }
}

export const agyAuthService = new AgyAuthService();
