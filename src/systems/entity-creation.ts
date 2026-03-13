import type { Engine } from '../ecs/engine.js';
import type { System } from '../ecs/types.js';

export default function createEntityCreationSystem(engine: Engine): System {
  return {
    name: 'EntityCreation',
    version: '2.0.0',
    type: 'core',
    description: 'Creates entities and attaches initial components.',

    init() {
      engine.on('entity:create', (event) => this.handleEvent(event));
    },

    async handleEvent(event) {
      const { entityId, data } = event;

      if (!engine.entityExists(entityId)) {
        engine.createEntity(entityId);
      }

      if (data.components && typeof data.components === 'object') {
        for (const [name, componentData] of Object.entries(
          data.components as Record<string, Record<string, unknown>>,
        )) {
          engine.addComponent(entityId, name, componentData);
        }
      }

      engine.emit({
        type: 'entity:created',
        entityId,
        data: {},
        source: 'EntityCreation',
        timestamp: Date.now(),
      });
    },
  };
}
