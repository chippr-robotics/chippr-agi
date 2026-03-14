import { z } from 'zod';

const ConfigSchema = z.object({
  MODEL_PROVIDER: z.enum(['claude', 'local']).default('claude'),
  CLAUDE_MODEL: z.string().default('sonnet'),
  LOCAL_URL: z.string().default('http://localhost:11434/v1'),
  LOCAL_MODEL: z.string().default('bitnet-b1.58'),
  DB_PATH: z.string().default('./chippr.db'),
  CONTAINER_RUNTIME: z.enum(['docker', 'apple-container']).default('docker'),
  CONTAINER_IMAGE: z.string().default('chippr-agent:latest'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_EMBEDDING_MODEL: z.string().default('gemini-embedding-001'),
  GEMINI_EMBEDDING_DIMENSIONS: z.coerce.number().optional(),
  WEB_PORT: z.coerce.number().default(3000),
  WEB_ENABLED: z.enum(['true', 'false']).default('true'),
  UPLOAD_DIR: z.string().default('./uploads'),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(): Config {
  return ConfigSchema.parse({
    MODEL_PROVIDER: process.env.CHIPPR_MODEL_PROVIDER,
    CLAUDE_MODEL: process.env.CHIPPR_CLAUDE_MODEL,
    LOCAL_URL: process.env.CHIPPR_LOCAL_URL,
    LOCAL_MODEL: process.env.CHIPPR_LOCAL_MODEL,
    DB_PATH: process.env.CHIPPR_DB_PATH,
    CONTAINER_RUNTIME: process.env.CHIPPR_CONTAINER_RUNTIME,
    CONTAINER_IMAGE: process.env.CHIPPR_CONTAINER_IMAGE,
    LOG_LEVEL: process.env.CHIPPR_LOG_LEVEL,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_EMBEDDING_MODEL: process.env.CHIPPR_GEMINI_EMBEDDING_MODEL,
    GEMINI_EMBEDDING_DIMENSIONS: process.env.CHIPPR_GEMINI_EMBEDDING_DIMENSIONS,
    WEB_PORT: process.env.CHIPPR_WEB_PORT,
    WEB_ENABLED: process.env.CHIPPR_WEB_ENABLED,
    UPLOAD_DIR: process.env.CHIPPR_UPLOAD_DIR,
  });
}
