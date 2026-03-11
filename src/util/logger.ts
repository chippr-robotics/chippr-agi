import pino from 'pino';
import type { Config } from './config.js';

export function createLogger(config: Pick<Config, 'LOG_LEVEL'>) {
  return pino({
    level: config.LOG_LEVEL,
    transport:
      process.env.NODE_ENV !== 'production'
        ? { target: 'pino/file', options: { destination: 1 } }
        : undefined,
  });
}

export type Logger = ReturnType<typeof createLogger>;
