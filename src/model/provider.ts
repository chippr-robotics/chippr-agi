import type { ModelProvider } from './types.js';
import { ClaudeProvider } from './claude.js';
import { LocalProvider } from './local.js';
import type { Config } from '../util/config.js';

export function createProvider(config: Config): ModelProvider {
  if (config.MODEL_PROVIDER === 'local') {
    return new LocalProvider(config.LOCAL_URL, config.LOCAL_MODEL);
  }
  return new ClaudeProvider(config.CLAUDE_MODEL);
}
