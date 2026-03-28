import { describe, it, expect } from 'vitest';
import { createLogger } from '../../src/util/logger.js';

describe('createLogger', () => {
  it('creates logger with specified level', () => {
    const logger = createLogger({ LOG_LEVEL: 'warn' });
    expect(logger.level).toBe('warn');
  });

  it('returns pino instance with expected methods', () => {
    const logger = createLogger({ LOG_LEVEL: 'info' });
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('handles all valid log levels', () => {
    for (const level of ['debug', 'info', 'warn', 'error'] as const) {
      const logger = createLogger({ LOG_LEVEL: level });
      expect(logger.level).toBe(level);
    }
  });
});
