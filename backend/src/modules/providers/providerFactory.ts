import { AIProvider } from './providerAdapter.js';
import { CodexProvider } from './codexProvider.js';
import { agyProvider } from './agyProvider.js';
import { activeProviderService } from './activeProviderService.js';

const codexProviderInstance = new CodexProvider();

/**
 * Returns the currently active AI provider instance (Codex or AGY).
 * When Codex is active -> CodexProvider is returned.
 * When AGY is active -> AgyProvider (Claude Sonnet) is returned.
 */
export function getActiveAIProvider(): AIProvider {
  const current = activeProviderService.get();
  if (current === 'agy') {
    return agyProvider;
  }
  // Default to Codex
  return codexProviderInstance;
}

export { codexProviderInstance as codexProvider, agyProvider };
