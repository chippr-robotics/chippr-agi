import { loadConfig } from './util/config.js';
import { createLogger } from './util/logger.js';
import { createProvider } from './model/provider.js';
import { GeminiEmbeddingProvider } from './model/embedding.js';
import { Store } from './store/db.js';
import { Engine } from './ecs/engine.js';
import { loadSystems } from './systems/loader.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const config = loadConfig();
  const logger = createLogger(config);
  const provider = createProvider(config);
  const store = new Store(config.DB_PATH);

  if (config.GEMINI_API_KEY) {
    const embeddingProvider = new GeminiEmbeddingProvider({
      apiKey: config.GEMINI_API_KEY,
      model: config.GEMINI_EMBEDDING_MODEL,
      outputDimensionality: config.GEMINI_EMBEDDING_DIMENSIONS,
    });
    store.setEmbeddingProvider(embeddingProvider);
    logger.info({ model: config.GEMINI_EMBEDDING_MODEL }, 'Gemini embedding provider enabled');
  }

  const engine = new Engine(store, provider, logger);

  logger.info('chippr-agi v2 starting');

  // Load all systems from the systems directory
  await loadSystems(engine, join(__dirname, 'systems'));

  logger.info({ systems: Array.from(engine.getSystems().keys()) }, 'All systems loaded');

  // Listen for all events in debug mode
  engine.on('*', (event) => {
    logger.debug({ event: event.type, entityId: event.entityId, source: event.source }, 'Event');
  });

  // If an objective was provided via CLI args, create an entity for it
  const objective = process.argv[2];
  if (objective) {
    const { uniqueId } = await import('./util/hash.js');
    const entityId = uniqueId();
    engine.createEntity(entityId);
    engine.addComponent(entityId, 'ObjectiveDescription', { objective });
    engine.addComponent(entityId, 'TaskDescription', { task: objective, complete: false });

    engine.emit({
      type: 'entity:needs-routing',
      entityId,
      data: { objective },
      source: 'CLI',
      timestamp: Date.now(),
    });

    logger.info({ entityId, objective }, 'Objective submitted');
  }

  // Graceful shutdown
  const shutdown = () => {
    logger.info('Shutting down');
    store.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Keep process alive
  logger.info('chippr-agi v2 running. Press Ctrl+C to stop.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
