import { describe, it, expect } from 'vitest';
import { createProvider } from '../../src/model/provider.js';
import { ClaudeProvider } from '../../src/model/claude.js';
import { LocalProvider } from '../../src/model/local.js';
import type { Config } from '../../src/util/config.js';

function makeConfig(overrides: Partial<Config> = {}): Config {
  return {
    MODEL_PROVIDER: 'claude',
    CLAUDE_MODEL: 'sonnet',
    LOCAL_URL: 'http://localhost:11434/v1',
    LOCAL_MODEL: 'bitnet-b1.58',
    DB_PATH: ':memory:',
    CONTAINER_RUNTIME: 'docker',
    CONTAINER_IMAGE: 'chippr-agent:latest',
    LOG_LEVEL: 'info',
    WEB_PORT: 3000,
    WEB_ENABLED: 'true',
    UPLOAD_DIR: './uploads',
    GEMINI_EMBEDDING_MODEL: 'gemini-embedding-001',
    ...overrides,
  } as Config;
}

describe('createProvider', () => {
  it('returns ClaudeProvider when MODEL_PROVIDER is claude', () => {
    const provider = createProvider(makeConfig({ MODEL_PROVIDER: 'claude' }));
    expect(provider).toBeInstanceOf(ClaudeProvider);
  });

  it('returns LocalProvider when MODEL_PROVIDER is local', () => {
    const provider = createProvider(makeConfig({ MODEL_PROVIDER: 'local' }));
    expect(provider).toBeInstanceOf(LocalProvider);
  });

  it('defaults to ClaudeProvider', () => {
    const provider = createProvider(makeConfig());
    expect(provider).toBeInstanceOf(ClaudeProvider);
  });
});
