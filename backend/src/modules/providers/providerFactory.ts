import { AIProvider } from './providerAdapter.js';
import { agyProvider } from './agyProvider.js';
import { unifiedCliProvider, UnifiedCliProvider } from './cliProvider.js';

export function getActiveAIProvider(): AIProvider {
  return unifiedCliProvider;
}

export { agyProvider, unifiedCliProvider, UnifiedCliProvider };

