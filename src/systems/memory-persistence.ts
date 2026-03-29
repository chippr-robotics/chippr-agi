import type { Engine } from '../ecs/engine.js';
import type { System, EntityId } from '../ecs/types.js';
import type {
  OrientationComponent,
  ObservationComponent,
  DecisionComponent,
  ActionResultComponent,
  EpisodicMemoryComponent,
  Episode,
} from '../core/components.js';
import { MemoryStore } from '../store/memory-store.js';
import { uniqueId } from '../util/hash.js';

/**
 * MemoryPersistenceSystem: Runs after ActSystem each tick.
 * Persists high-novelty episodes to episodic memory in SQLite.
 * Manages the episodic ring buffer.
 */
export function createMemoryPersistenceSystem(engine: Engine): System {
  const memoryStore = new MemoryStore(engine.getStore().db);

  return {
    name: 'MemoryPersistenceSystem',
    version: '1.0.0',
    type: 'core',
    description: 'Persists high-novelty episodes to long-term memory after each OODA tick',

    init() {},

    async handleEvent(event) {
      if (event.type === 'ooda:tick-complete') {
        await persistMemory(engine, memoryStore, event.entityId);
      }
    },
  };
}

async function persistMemory(engine: Engine, memoryStore: MemoryStore, entityId: EntityId): Promise<void> {
  const logger = engine.getLogger();

  const orientation = engine.getComponent<OrientationComponent>(entityId, 'Orientation');
  const observation = engine.getComponent<ObservationComponent>(entityId, 'Observation');
  const decision = engine.getComponent<DecisionComponent>(entityId, 'Decision');
  const actionResult = engine.getComponent<ActionResultComponent>(entityId, 'ActionResult');

  if (!orientation || !observation) return;

  // Get or create episodic memory component
  const episodic = engine.getComponent<EpisodicMemoryComponent>(entityId, 'EpisodicMemory') ?? {
    episodes: [],
    persistThreshold: 0.5,
    maxEpisodes: 50,
  };

  // Build episode from current tick
  const episode: Episode = {
    summary: orientation.situationFrame,
    observations: observation.observations,
    decision: decision?.selectedAction ?? 'none',
    result: actionResult?.result ?? null,
    noveltyScore: orientation.novelty,
    tick: orientation.tick,
    timestamp: Date.now(),
  };

  // Add to ring buffer
  episodic.episodes.push(episode);

  // Prune if buffer is full — keep high-novelty episodes while preserving chronological order
  if (episodic.episodes.length > episodic.maxEpisodes) {
    const indexed = episodic.episodes.map((ep, idx) => ({ ep, idx }));
    indexed.sort((a, b) => b.ep.noveltyScore - a.ep.noveltyScore);
    const keepIndices = new Set(indexed.slice(0, episodic.maxEpisodes).map((item) => item.idx));
    episodic.episodes = episodic.episodes.filter((_, idx) => keepIndices.has(idx));
  }

  engine.setComponent(entityId, 'EpisodicMemory', episodic as unknown as Record<string, unknown>);

  // Persist to SQLite if novelty exceeds threshold
  if (orientation.novelty >= episodic.persistThreshold) {
    const provider = engine.getProvider();
    let embedding: number[] | undefined;

    if (provider.embed) {
      try {
        embedding = await provider.embed(episode.summary);
      } catch {
        // embedding is optional
      }
    }

    memoryStore.addEpisodic(
      entityId,
      uniqueId(),
      episode.summary,
      { observations: episode.observations, decision: episode.decision, result: episode.result },
      orientation.novelty,
      orientation.tick,
      embedding,
    );

    logger.debug(
      { entityId, novelty: orientation.novelty, tick: orientation.tick },
      'MemoryPersistence: episode persisted',
    );
  }
}

export default createMemoryPersistenceSystem;
