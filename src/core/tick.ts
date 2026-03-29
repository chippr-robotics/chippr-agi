import type { Engine } from '../ecs/engine.js';
import type { EntityId } from '../ecs/types.js';
import type { TickMetadataComponent, WorldModelComponent } from './components.js';

export type OodaPhase = 'observe' | 'orient' | 'decide' | 'act';

export interface OodaSystemRef {
  observe: (entityId: EntityId) => Promise<void>;
  orient: (entityId: EntityId) => Promise<void>;
  decide: (entityId: EntityId) => Promise<void>;
  act: (entityId: EntityId) => Promise<void>;
}

/**
 * Runs one full OODA tick for a single entity.
 * Phases execute sequentially: Observe → Orient → Decide → Act.
 * Writes TickMetadata.tickNumber before phases so phase systems can read it.
 */
export async function runOodaTick(
  engine: Engine,
  entityId: EntityId,
  systems: OodaSystemRef,
  tickNumber: number,
): Promise<TickMetadataComponent> {
  const startTime = Date.now();
  const durations = { observe: 0, orient: 0, decide: 0, act: 0 };

  // Write tickNumber before phases so ObserveSystem (and others) can read it
  engine.setComponent(entityId, 'TickMetadata', {
    tickNumber,
    startTime,
    phaseDurations: durations,
    worldModelUpdated: false,
  } as unknown as Record<string, unknown>);

  // Capture WorldModel.updateCount before Orient runs
  const wmBefore = engine.getComponent<WorldModelComponent>(entityId, 'WorldModel');
  const updateCountBefore = wmBefore?.updateCount ?? 0;

  const phases: OodaPhase[] = ['observe', 'orient', 'decide', 'act'];
  for (const phase of phases) {
    const phaseStart = performance.now();
    await systems[phase](entityId);
    durations[phase] = Math.round(performance.now() - phaseStart);
  }

  // Determine if Orient actually updated the world model (by updateCount delta)
  const wmAfter = engine.getComponent<WorldModelComponent>(entityId, 'WorldModel');
  const worldModelUpdated = (wmAfter?.updateCount ?? 0) > updateCountBefore;

  const metadata: TickMetadataComponent = {
    tickNumber,
    startTime,
    phaseDurations: durations,
    worldModelUpdated,
  };

  engine.setComponent(entityId, 'TickMetadata', metadata as unknown as Record<string, unknown>);

  engine.emit({
    type: 'ooda:tick-complete',
    entityId,
    data: { tickNumber, durations, worldModelUpdated },
    source: 'OodaTick',
    timestamp: Date.now(),
  });

  return metadata;
}

/**
 * Runs OODA ticks for all entities that have an OodaAgent component.
 */
export async function runOodaTickAll(
  engine: Engine,
  systems: OodaSystemRef,
  tickNumber: number,
): Promise<Map<EntityId, TickMetadataComponent>> {
  const agents = engine.getEntitiesByComponent('OodaAgent');
  const results = new Map<EntityId, TickMetadataComponent>();
  for (const entityId of agents) {
    const meta = await runOodaTick(engine, entityId, systems, tickNumber);
    results.set(entityId, meta);
  }
  return results;
}
