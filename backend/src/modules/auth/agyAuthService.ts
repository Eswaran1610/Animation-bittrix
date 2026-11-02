import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface AgyAuthStatus {
  authenticated: boolean;
  cliInstalled: boolean;
  source: 'local-cli' | null;
  message?: string;
}

const unauthenticatedPattern = /not logged|not authenticated|please sign in|sign in to view|silent auth failed|oauth authentication/i;

async function probeLocalAgy(): Promise<AgyAuthStatus> {
  try {
    // `agy models` checks local credentials without starting a browser OAuth flow.
    // AGY's Go CLI emits this status correctly only when it has a terminal. The
    // `script` wrapper supplies that terminal for the backend worker on Linux
    // and macOS; Windows falls back to the direct command.
    const command = process.platform === 'win32' ? 'agy' : 'script';
    const args = process.platform === 'win32'
      ? ['models']
      : ['-qec', 'agy models', '/dev/null'];
    const { stdout, stderr } = await execFileAsync(command, args, {
      timeout: 20_000,
      maxBuffer: 2 * 1024 * 1024,
    });
    const output = `${stdout}\n${stderr}`;
    if (unauthenticatedPattern.test(output)) {
      return {
        authenticated: false,
        cliInstalled: true,
        source: null,
        message: 'Local AGY is installed but not authenticated. Run `agy` in a terminal on this machine, complete OAuth, then check again.',
      };
    }
    return { authenticated: true, cliInstalled: true, source: 'local-cli' };
  } catch (error: any) {
    const output = `${error?.stdout || ''}\n${error?.stderr || ''}\n${error?.message || ''}`;
    if (unauthenticatedPattern.test(output)) {
      return {
        authenticated: false,
        cliInstalled: true,
        source: null,
        message: 'Local AGY is installed but not authenticated. Run `agy` in a terminal on this machine, complete OAuth, then check again.',
      };
    }
    if (error?.code === 'ENOENT' && process.platform !== 'win32') {
      return {
        authenticated: false,
        cliInstalled: false,
        source: null,
        message: 'The local terminal helper is not available to the backend worker. Install `util-linux`/`script`, then try again.',
      };
    }
    if (error?.code === 'ENOENT') {
      return {
        authenticated: false,
        cliInstalled: false,
        source: null,
        message: 'The `agy` command is not available to the backend worker. Install AGY and make sure it is on PATH.',
      };
    }
    return {
      authenticated: false,
      cliInstalled: true,
      source: null,
      message: 'The local AGY CLI could not be checked. Make sure AGY is installed and try again.',
    };
  }
}

export const agyAuthService = {
  getStatus(): Promise<AgyAuthStatus> {
    return probeLocalAgy();
  },

  connect(): Promise<AgyAuthStatus> {
    return probeLocalAgy();
  },
};
