import { ChildProcessWithoutNullStreams, execFile, spawn } from 'child_process';
import { promisify } from 'util';
import { randomUUID } from 'crypto';
import { projectPaths } from '../../config/paths.js';

const execFileAsync = promisify(execFile);
type ConnectionState = 'unknown' | 'starting' | 'awaiting_code' | 'verifying' | 'connected' | 'failed';
type AuthSession = {
  id: string;
  state: ConnectionState;
  message: string;
  authUrl?: string;
  process?: ChildProcessWithoutNullStreams;
  createdAt: number;
};

const publicSession = (session: AuthSession, cliAvailable = true) => ({
  cliAvailable,
  state: session.state,
  sessionId: session.id,
  message: session.message,
  authUrl: session.authUrl,
});

/** Canonical local AGY OAuth/session contract used by every backend route. */
class AgyAuthService {
  private activeSession: AuthSession | null = null;
  private lastState: ConnectionState = 'unknown';
  private lastMessage = 'AGY has not been verified in this backend session.';

  async status() {
    const cliAvailable = await this.isCliAvailable();
    if (!cliAvailable) return { cliAvailable: false, state: 'failed' as const, message: 'AGY CLI is not installed or is unavailable on PATH.' };
    if (this.activeSession) return publicSession(this.activeSession);
    return { cliAvailable: true, state: this.lastState, message: this.lastMessage };
  }

  async start() {
    if (!await this.isCliAvailable()) return { cliAvailable: false, state: 'failed' as const, message: 'AGY CLI is not installed or is unavailable on PATH.' };
    if (this.activeSession && ['starting', 'awaiting_code', 'verifying'].includes(this.activeSession.state)) return publicSession(this.activeSession);
    const session: AuthSession = { id: randomUUID(), state: 'starting', message: 'Checking the local AGY session…', createdAt: Date.now() };
    this.activeSession = session;
    const verificationCommand = "agy --dangerously-skip-permissions --print-timeout 2m --print 'Return exactly this JSON and do not call any tools: {\"agy_connection\":\"ok\"}'";
    const child = spawn('script', ['-q', '-c', verificationCommand, '/dev/null'], { cwd: projectPaths.root, stdio: 'pipe' });
    session.process = child;
    let output = '';
    const receive = (chunk: Buffer) => {
      output += chunk.toString();
      const authUrl = output.match(/https:\/\/accounts\.google\.com\/[^\s]+/)?.[0];
      if (authUrl && session.state === 'starting') {
        session.authUrl = authUrl;
        session.state = 'awaiting_code';
        session.message = 'Sign in in the new tab, then paste the authorization code here.';
      }
    };
    child.stdout.on('data', receive);
    child.stderr.on('data', receive);
    child.on('error', () => this.finish(session, 'failed', 'Unable to start the local AGY CLI.'));
    child.on('close', (code) => {
      if (session.state === 'awaiting_code') this.finish(session, 'failed', 'AGY login timed out before an authorization code was submitted.');
      else if (code === 0) this.finish(session, 'connected', 'AGY is connected on this machine.');
      else this.finish(session, 'failed', 'AGY could not verify the local account. Try Connect AGY again.');
    });
    await new Promise((resolve) => setTimeout(resolve, 800));
    return publicSession(session);
  }

  submitCode(sessionId: string, code: string) {
    const session = this.activeSession;
    if (!session || session.id !== sessionId || session.state !== 'awaiting_code' || !session.process) throw new Error('This AGY login session is no longer active. Start Connect AGY again.');
    if (!code.trim()) throw new Error('Authorization code is required.');
    session.state = 'verifying';
    session.message = 'Verifying the AGY authorization code…';
    session.process.stdin.write(`${code.trim()}\n`);
    return publicSession(session);
  }

  private async isCliAvailable(): Promise<boolean> {
    try {
      await execFileAsync('agy', ['--version'], { timeout: 5_000, cwd: projectPaths.root });
      return true;
    } catch {
      return false;
    }
  }

  private finish(session: AuthSession, state: ConnectionState, message: string) {
    if (this.activeSession?.id !== session.id) return;
    session.state = state;
    session.message = message;
    session.process = undefined;
    this.lastState = state;
    this.lastMessage = message;
    this.activeSession = state === 'connected' ? session : null;
  }
}

export const agyAuthService = new AgyAuthService();
