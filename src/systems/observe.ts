import type { Engine } from '../ecs/engine.js';
import type { System, EntityId } from '../ecs/types.js';
import type {
  SensorComponent,
  AttentionFilterComponent,
  ActionResultComponent,
  Observation,
  ObservationComponent,
  InboxComponent,
} from '../core/components.js';

/**
 * ObserveSystem: Gathers raw inputs from all active sensor components.
 * What sensors are active is determined by AttentionFilterComponent
 * from the previous Orient phase (Boyd's feedback arrow).
 */
export function createObserveSystem(engine: Engine): System {
  return {
    name: 'ObserveSystem',
    version: '1.0.0',
    type: 'core',
    description: 'Gathers raw observations from active sensors on an entity',

    init() {},

    async handleEvent(event) {
      if (event.type === 'ooda:observe') {
        await observe(engine, event.entityId);
      }
    },
  };
}

export async function observe(engine: Engine, entityId: EntityId): Promise<void> {
  const logger = engine.getLogger();
  const observations: Observation[] = [];
  const now = Date.now();

  // Get attention filter to determine which sensors to read
  const attentionFilter = engine.getComponent<AttentionFilterComponent>(entityId, 'AttentionFilter');
  const activeSensors = attentionFilter?.activeSensors ?? [];

  // Collect from sensor components
  const sensorEntities = engine.getEntitiesByComponent('Sensor');
  for (const sensorEntityId of sensorEntities) {
    // Only read sensors attached to this entity or global sensors
    if (sensorEntityId !== entityId) continue;

    const sensor = engine.getComponent<SensorComponent>(sensorEntityId, 'Sensor');
    if (!sensor || !sensor.active) continue;

    // If attention filter exists, only read prioritized sensor types
    if (activeSensors.length > 0 && !activeSensors.includes(sensor.sensorType)) continue;

    observations.push({
      source: sensor.sensorType,
      data: sensor.config,
      timestamp: now,
    });
  }

  // Collect from previous action results
  const actionResult = engine.getComponent<ActionResultComponent>(entityId, 'ActionResult');
  if (actionResult) {
    observations.push({
      source: 'action_result',
      data: {
        action: actionResult.action,
        success: actionResult.success,
        result: actionResult.result,
        error: actionResult.error,
      },
      timestamp: actionResult.timestamp,
    });
  }

  // Collect from inbox (inter-agent messages)
  const inbox = engine.getComponent<InboxComponent>(entityId, 'Inbox');
  if (inbox && inbox.messages.length > 0) {
    for (const msg of inbox.messages) {
      observations.push({
        source: `message:${msg.from}`,
        data: { content: msg.content, metadata: msg.metadata },
        timestamp: msg.timestamp,
      });
    }
    // Clear inbox after reading
    engine.setComponent(entityId, 'Inbox', { messages: [] } as unknown as Record<string, unknown>);
  }

  // Get tick number from existing metadata
  const tick = engine.getComponent(entityId, 'TickMetadata');
  const tickNumber = tick ? (tick as Record<string, unknown>).tickNumber as number : 0;

  const observation: ObservationComponent = { observations, tick: tickNumber };
  engine.setComponent(entityId, 'Observation', observation as unknown as Record<string, unknown>);

  logger.debug({ entityId, observationCount: observations.length }, 'ObserveSystem: collected observations');
}

export default createObserveSystem;
