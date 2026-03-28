import type { Engine } from '../ecs/engine.js';
import type { System } from '../ecs/types.js';

export default function createSystemSelector(engine: Engine): System {
  return {
    name: 'SystemSelector',
    version: '2.0.0',
    type: 'core',
    description: 'Routes tasks to the most appropriate registered system.',

    init() {
      engine.on('entity:needs-routing', (event) => this.handleEvent(event));
    },

    async handleEvent(event) {
      const taskDesc = engine.getComponent(event.entityId, 'TaskDescription');
      if (!taskDesc) return;

      const provider = engine.getProvider();

      const tools = Array.from(engine.getSystems().values())
        .filter((s) => s.type !== 'core')
        .map((s) => ({
          name: s.name,
          description: s.description,
          inputSchema: {
            type: 'object' as const,
            properties: { entityId: { type: 'string' } },
            required: ['entityId'],
          },
        }));

      if (tools.length === 0) return;

      const response = await provider.generate(
        [
          {
            role: 'user',
            content: `Select the best system for this task: "${taskDesc.task}". Available systems: ${JSON.stringify(tools.map((t) => ({ name: t.name, description: t.description })))}`,
          },
        ],
        tools,
      );

      if (response.toolCalls?.length) {
        const selected = response.toolCalls[0];
        engine.addComponent(event.entityId, 'SystemSelection', {
          selectedSystem: selected.name,
        });
        engine.emit({
          type: 'system:selected',
          entityId: event.entityId,
          data: { system: selected.name },
          source: 'SystemSelector',
          timestamp: Date.now(),
        });
      } else {
        engine.getLogger().warn({ entityId: event.entityId }, 'SystemSelector: no system selected by LLM');
        engine.emit({
          type: 'system:error',
          entityId: event.entityId,
          data: { system: 'SystemSelector', error: 'LLM did not select a system' },
          source: 'SystemSelector',
          timestamp: Date.now(),
        });
      }
    },
  };
}
