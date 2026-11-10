/**
 * Active AI Provider Management
 *
 * Ensures strictly ONE CLI is connected / active at any time.
 * Choices: 'codex' | 'agy' | 'claude' | 'none'
 */

export type ProviderId = 'agy' | 'claude' | 'none';

class ActiveProviderService {
  private current: ProviderId;

  constructor() {
    const fromEnv = (process.env.ACTIVE_PROVIDER || '').toLowerCase().trim() as ProviderId;
    this.current = (fromEnv === 'claude' || fromEnv === 'none') ? fromEnv : 'agy';
  }

  get(): ProviderId {
    return this.current;
  }

  set(id: string): { activeProvider: ProviderId; message: string } {
    const next = id.toLowerCase().trim() as ProviderId;
    if (next !== 'agy' && next !== 'claude' && next !== 'none') {
      throw new Error(`Unknown provider "${id}". Valid choices: agy, claude, none.`);
    }
    this.current = next;
    process.env.ACTIVE_PROVIDER = next;
    const labels: Record<ProviderId, string> = { agy: 'AGY', claude: 'Claude Code', none: 'No CLI' };
    const label = next === 'none' ? 'All CLIs disconnected' : `${labels[next]} is now the active CLI`;
    return {
      activeProvider: this.current,
      message: label,
    };
  }

  disconnect(): { activeProvider: ProviderId; message: string } {
    return this.set('none');
  }

  status() {
    return {
      activeProvider: this.current,
      available: ['agy', 'claude', 'none'] as ProviderId[],
    };
  }
}

export const activeProviderService = new ActiveProviderService();
