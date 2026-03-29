import type { Engine } from '../ecs/engine.js';
import type { System, EntityId } from '../ecs/types.js';
import { MemoryStore } from '../store/memory-store.js';

/**
 * EntitySerializationSystem: Snapshots and restores full entity state.
 * Serializes all components on an entity to SQLite for session continuity.
 */
export function createEntitySerializationSystem(engine: Engine): System {
  const memoryStore = new MemoryStore(engine.getStore().db);

  return {
    name: 'EntitySerializationSystem',
    version: '1.0.0',
    type: 'core',
    description: 'Snapshots entity state for persistence and restores from snapshots on startup',

    init() {},

    async handleEvent(event) {
      if (event.type === 'entity:snapshot') {
        snapshotEntity(engine, memoryStore, event.entityId);
      } else if (event.type === 'entity:snapshot-all') {
        snapshotAll(engine, memoryStore);
      } else if (event.type === 'entity:restore-all') {
        restoreAll(engine, memoryStore);
      }
    },
  };
}

export function snapshotEntity(engine: Engine, memoryStore: MemoryStore, entityId: EntityId): void {
  const logger = engine.getLogger();
  const store = engine.getStore();

  // Get all components for this entity
  const rows = store.db
    .prepare('SELECT name, data FROM components WHERE entity_id = ?')
    .all(entityId) as Array<{ name: string; data: string }>;

  const components: Record<string, unknown> = {};
  for (const row of rows) {
    components[row.name] = JSON.parse(row.data);
  }

  memoryStore.saveSnapshot(entityId, components);
  logger.debug({ entityId, componentCount: rows.length }, 'EntitySerialization: snapshot saved');
}

export function snapshotAll(engine: Engine, memoryStore: MemoryStore): void {
  const logger = engine.getLogger();
  const store = engine.getStore();

  const entities = store.db
    .prepare('SELECT id FROM entities')
    .all() as Array<{ id: string }>;

  for (const { id } of entities) {
    snapshotEntity(engine, memoryStore, id);
  }

  logger.info({ entityCount: entities.length }, 'EntitySerialization: all entities snapshotted');
}

export function restoreAll(engine: Engine, memoryStore: MemoryStore): void {
  const logger = engine.getLogger();

  const snapshots = memoryStore.getAllLatestSnapshots();

  for (const snapshot of snapshots) {
    // Create entity if it doesn't exist
    if (!engine.entityExists(snapshot.entityId)) {
      engine.createEntity(snapshot.entityId);
    }

    // Restore all components
    for (const [name, data] of Object.entries(snapshot.components)) {
      engine.setComponent(snapshot.entityId, name, data as Record<string, unknown>);
    }
  }

  logger.info({ entityCount: snapshots.length }, 'EntitySerialization: entities restored from snapshots');
}

export default createEntitySerializationSystem;
