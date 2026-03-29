import type { Engine } from '../ecs/engine.js';
import type { System } from '../ecs/types.js';
import type { ChildAgentsComponent, ParentAgentComponent } from '../core/components.js';
import { uniqueId } from '../util/hash.js';

/**
 * AgentSpawnSystem: Creates sub-agent entities when a decision is to delegate.
 * Parent passes filtered components to the child. Child runs its own OODA loop.
 */
export function createAgentSpawnSystem(engine: Engine): System {
  return {
    name: 'AgentSpawnSystem',
    version: '1.0.0',
    type: 'core',
    description: 'Spawns sub-agent entities with inherited components for task delegation',

    init() {},

    async handleEvent(event) {
      if (event.type !== 'agent:spawn') return;

      const logger = engine.getLogger();
      const parentId = event.entityId;
      const data = event.data as {
        role?: string;
        systemPrompt?: string;
        goals?: string[];
        components?: Record<string, Record<string, unknown>>;
      };

      const childId = uniqueId();
      engine.createEntity(childId);

      // Mark as OODA agent
      engine.addComponent(childId, 'OodaAgent', { active: true });

      // Set identity
      engine.addComponent(childId, 'Identity', {
        role: data.role ?? 'sub-agent',
        systemPrompt: data.systemPrompt ?? '',
        coreGoals: data.goals ?? [],
        learnedPreferences: {},
      });

      // Initialize empty OODA components
      engine.addComponent(childId, 'WorldModel', { beliefs: {}, lastUpdated: 0, updateCount: 0 });
      engine.addComponent(childId, 'Inbox', { messages: [] });
      engine.addComponent(childId, 'Outbox', { messages: [] });

      // Copy any additional components from parent
      if (data.components) {
        for (const [name, componentData] of Object.entries(data.components)) {
          engine.addComponent(childId, name, componentData);
        }
      }

      // Set parent reference on child
      engine.addComponent(childId, 'ParentAgent', {
        parentEntityId: parentId,
      } as unknown as Record<string, unknown>);

      // Track child on parent
      const children = engine.getComponent<ChildAgentsComponent>(parentId, 'ChildAgents') ?? { childEntityIds: [] };
      children.childEntityIds.push(childId);
      engine.setComponent(parentId, 'ChildAgents', children as unknown as Record<string, unknown>);

      engine.emit({
        type: 'agent:spawned',
        entityId: childId,
        data: { parentId, role: data.role },
        source: 'AgentSpawnSystem',
        timestamp: Date.now(),
      });

      logger.info({ parentId, childId, role: data.role }, 'AgentSpawn: sub-agent created');
    },
  };
}

export default createAgentSpawnSystem;
