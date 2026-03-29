import type { Engine } from '../ecs/engine.js';
import type { System, EntityId } from '../ecs/types.js';
import type {
  DecisionComponent,
  ActionResultComponent,
} from '../core/components.js';

/**
 * ActSystem: Executes the decided action using available tool components.
 * Results become input to ObserveSystem on the next tick.
 */
export function createActSystem(engine: Engine): System {
  return {
    name: 'ActSystem',
    version: '1.0.0',
    type: 'core',
    description: 'Executes decided actions and writes results for next observation cycle',

    init() {},

    async handleEvent(event) {
      if (event.type === 'ooda:act') {
        await act(engine, event.entityId);
      }
    },
  };
}

export async function act(engine: Engine, entityId: EntityId): Promise<void> {
  const logger = engine.getLogger();

  const decision = engine.getComponent<DecisionComponent>(entityId, 'Decision');
  if (!decision) {
    logger.warn({ entityId }, 'ActSystem: no decision available');
    return;
  }

  if (decision.selectedAction === 'no-op') {
    engine.setComponent(entityId, 'ActionResult', {
      action: 'no-op',
      success: true,
      result: null,
      tick: decision.tick,
      timestamp: Date.now(),
    } as unknown as Record<string, unknown>);
    return;
  }

  const now = Date.now();

  try {
    // Route the action through the ECS event system
    // Other systems (or tool executors) can listen for action:execute events
    engine.emit({
      type: 'action:execute',
      entityId,
      data: {
        action: decision.selectedAction,
        rationale: decision.rationale,
        deliberate: decision.deliberate,
      },
      source: 'ActSystem',
      timestamp: now,
    });

    const result: ActionResultComponent = {
      action: decision.selectedAction,
      success: true,
      result: { executed: true, action: decision.selectedAction },
      tick: decision.tick,
      timestamp: now,
    };

    engine.setComponent(entityId, 'ActionResult', result as unknown as Record<string, unknown>);

    logger.debug({ entityId, action: decision.selectedAction }, 'ActSystem: action executed');
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    const result: ActionResultComponent = {
      action: decision.selectedAction,
      success: false,
      result: null,
      error,
      tick: decision.tick,
      timestamp: now,
    };

    engine.setComponent(entityId, 'ActionResult', result as unknown as Record<string, unknown>);

    logger.error({ entityId, action: decision.selectedAction, error }, 'ActSystem: action failed');
  }
}

export default createActSystem;
