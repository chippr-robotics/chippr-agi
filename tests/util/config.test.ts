import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadConfig } from '../../src/util/config.js';

describe('loadConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Clear all CHIPPR_ env vars
    vi.stubEnv('CHIPPR_MODEL_PROVIDER', undefined as unknown as string);
    vi.stubEnv('CHIPPR_CLAUDE_MODEL', undefined as unknown as string);
    vi.stubEnv('CHIPPR_LOCAL_URL', undefined as unknown as string);
    vi.stubEnv('CHIPPR_LOCAL_MODEL', undefined as unknown as string);
    vi.stubEnv('CHIPPR_DB_PATH', undefined as unknown as string);
    vi.stubEnv('CHIPPR_CONTAINER_RUNTIME', undefined as unknown as string);
    vi.stubEnv('CHIPPR_CONTAINER_IMAGE', undefined as unknown as string);
    vi.stubEnv('CHIPPR_LOG_LEVEL', undefined as unknown as string);
    vi.stubEnv('GEMINI_API_KEY', undefined as unknown as string);
    vi.stubEnv('CHIPPR_WEB_PORT', undefined as unknown as string);
    vi.stubEnv('CHIPPR_WEB_ENABLED', undefined as unknown as string);
    vi.stubEnv('CHIPPR_UPLOAD_DIR', undefined as unknown as string);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns defaults when no env vars set', () => {
    const config = loadConfig();
    expect(config.MODEL_PROVIDER).toBe('claude');
    expect(config.CLAUDE_MODEL).toBe('sonnet');
    expect(config.LOCAL_URL).toBe('http://localhost:11434/v1');
    expect(config.LOCAL_MODEL).toBe('bitnet-b1.58');
    expect(config.DB_PATH).toBe('./chippr.db');
    expect(config.CONTAINER_RUNTIME).toBe('docker');
    expect(config.LOG_LEVEL).toBe('info');
    expect(config.WEB_PORT).toBe(3000);
    expect(config.WEB_ENABLED).toBe('true');
    expect(config.UPLOAD_DIR).toBe('./uploads');
  });

  it('overrides defaults with env vars', () => {
    vi.stubEnv('CHIPPR_MODEL_PROVIDER', 'local');
    vi.stubEnv('CHIPPR_DB_PATH', '/tmp/test.db');
    vi.stubEnv('CHIPPR_WEB_PORT', '8080');
    const config = loadConfig();
    expect(config.MODEL_PROVIDER).toBe('local');
    expect(config.DB_PATH).toBe('/tmp/test.db');
    expect(config.WEB_PORT).toBe(8080);
  });

  it('rejects invalid MODEL_PROVIDER', () => {
    vi.stubEnv('CHIPPR_MODEL_PROVIDER', 'invalid');
    expect(() => loadConfig()).toThrow();
  });

  it('coerces WEB_PORT to number', () => {
    vi.stubEnv('CHIPPR_WEB_PORT', '9999');
    const config = loadConfig();
    expect(config.WEB_PORT).toBe(9999);
    expect(typeof config.WEB_PORT).toBe('number');
  });

  it('handles optional GEMINI_API_KEY', () => {
    const config = loadConfig();
    expect(config.GEMINI_API_KEY).toBeUndefined();

    vi.stubEnv('GEMINI_API_KEY', 'test-key');
    const config2 = loadConfig();
    expect(config2.GEMINI_API_KEY).toBe('test-key');
  });

  it('rejects invalid LOG_LEVEL', () => {
    vi.stubEnv('CHIPPR_LOG_LEVEL', 'verbose');
    expect(() => loadConfig()).toThrow();
  });
});
