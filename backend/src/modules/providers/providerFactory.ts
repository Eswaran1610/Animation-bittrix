import { AIProvider } from './providerAdapter.js';
import { CodexProvider } from './codexProvider.js';
import { agyProvider } from './agyProvider.js';
import { unifiedCliProvider, UnifiedCliProvider } from './cliProvider.js';
import { activeProviderService } from './activeProviderService.js';

const codexProviderInstance = new CodexProvider();

/**
 * Returns the currently active AI provider instance.
 * All CLI engines (AGY, Codex, Claude) are orchestrated through the
 * UnifiedCliProvider according to the user's active provider selection.
 */
export function getActiveAIProvider(): AIProvider {
  return unifiedCliProvider;
}

export { codexProviderInstance as codexProvider, agyProvider, unifiedCliProvider, UnifiedCliProvider };

