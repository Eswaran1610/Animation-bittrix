/**
 * Active AI Provider Management
 *
 * Ensures strictly ONE CLI is connected / active at any time.
 * Choices: 'codex' | 'agy' | 'none'
 */

export type ProviderId = 'codex' | 'agy' | 'none';

class ActiveProviderService {
  private current: ProviderId;

  constructor() {
    const fromEnv = (process.env.ACTIVE_PROVIDER || '').toLowerCase().trim() as ProviderId;
    this.current = (fromEnv === 'agy' || fromEnv === 'none') ? fromEnv : 'codex';
  }

  get(): ProviderId {
    return this.current;
  }

  set(id: string): { activeProvider: ProviderId; message: string } {
    const next = id.toLowerCase().trim() as ProviderId;
    if (next !== 'codex' && next !== 'agy' && next !== 'none') {
      throw new Error(`Unknown provider "${id}". Valid choices: codex, agy, none.`);
    }
    this.current = next;
    process.env.ACTIVE_PROVIDER = next;
    const label = next === 'none' ? 'All CLIs disconnected' : `${next.toUpperCase()} is now the active connected CLI`;
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
      available: ['codex', 'agy', 'none'] as ProviderId[],
    };
  }
}

export const activeProviderService = new ActiveProviderService();
