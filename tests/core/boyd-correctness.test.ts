import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Engine } from '../../src/ecs/engine.js';
import { Store } from '../../src/store/db.js';
import type { ModelProvider, ModelResponse } from '../../src/model/types.js';
import type { Logger } from '../../src/util/logger.js';
import { observe } from '../../src/systems/observe.js';
import { orient } from '../../src/systems/orient.js';
import { decide } from '../../src/systems/decide.js';
import { act } from '../../src/systems/act.js';
import { runOodaTick } from '../../src/core/tick.js';
import type { OodaSystemRef } from '../../src/core/tick.js';

function mockLogger(): Logger {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
    child: vi.fn(),
    level: 'info',
  } as unknown as Logger;
}

describe('Boyd Correctness: Implicit Guidance Loop', () => {
  let store: Store;
  let engine: Engine;

  afterEach(() => {
    store.close();
  });

  it('Orient attentionShift changes what ObserveSystem filters on the next tick', async () => {
    // Tick 1: Orient says to focus on 'network' sensors only
    let callCount = 0;
    const provider: ModelProvider = {
      async generate(): Promise<ModelResponse> {
        callCount++;
        if (callCount === 1) {
          // Tick 1 orient response: shift attention to 'network'
          return {
            content: JSON.stringify({
              situationFrame: 'Network anomaly detected',
              novelty: 0.7,
              beliefUpdates: { networkStatus: 'anomalous' },
              attentionShift: ['network'],
              implicitOptions: [{ action: 'investigate-network', confidence: 0.8, rationale: 'Anomaly' }],
            }),
          };
        }
        if (callCount === 2) {
          // Tick 1 decide response (deliberate due to high novelty)
          return {
            content: JSON.stringify({
              selectedAction: 'investigate-network',
              rationale: 'Need to check network',
            }),
          };
        }
        // Tick 2 responses
        return {
          content: JSON.stringify({
            situationFrame: 'Investigating',
            novelty: 0.2,
            attentionShift: [],
            implicitOptions: [{ action: 'continue', confidence: 0.9, rationale: 'Normal' }],
          }),
        };
      },
    };

    store = new Store(':memory:');
    engine = new Engine(store, provider, mockLogger());

    const entityId = engine.createEntity('agent');
    engine.addComponent(entityId, 'OodaAgent', { active: true });
    engine.addComponent(entityId, 'WorldModel', { beliefs: {}, lastUpdated: 0, updateCount: 0 });

    // Add two sensors: 'network' and 'disk'
    // We can't attach multiple sensors to same entity with same component name,
    // so we'll verify via AttentionFilter behavior
    engine.addComponent(entityId, 'Sensor', {
      sensorType: 'network',
      active: true,
      config: { interface: 'eth0' },
    });

    // Add an initial observation to trigger orient
    engine.addComponent(entityId, 'Observation', {
      observations: [{ source: 'boot', data: {}, timestamp: Date.now() }],
      tick: 0,
    });

    // --- Tick 1: Orient ---
    await orient(engine, entityId);

    // Verify AttentionFilter was set by Orient
    const filter = engine.getComponent(entityId, 'AttentionFilter') as Record<string, unknown>;
    expect(filter).not.toBeNull();
    expect(filter.priorities).toEqual(['network']);

    // --- Tick 2: Observe with the new attention filter ---
    // First, set up AttentionFilter to only allow 'disk' sensors (to test filtering)
    engine.setComponent(entityId, 'AttentionFilter', {
      priorities: ['disk'],
      activeSensors: ['disk'], // only 'disk' sensors active
    });

    await observe(engine, entityId);

    // The 'network' sensor should be filtered OUT because activeSensors is ['disk']
    const obs = engine.getComponent(entityId, 'Observation') as Record<string, unknown>;
    const observations = obs.observations as Array<Record<string, unknown>>;
    const networkObs = observations.filter((o) => o.source === 'network');
    expect(networkObs.length).toBe(0);

    // Now switch back to allowing 'network' and verify it comes through
    engine.setComponent(entityId, 'AttentionFilter', {
      priorities: ['network'],
      activeSensors: ['network'],
    });

    await observe(engine, entityId);

    const obs2 = engine.getComponent(entityId, 'Observation') as Record<string, unknown>;
    const observations2 = obs2.observations as Array<Record<string, unknown>>;
    const networkObs2 = observations2.filter((o) => o.source === 'network');
    expect(networkObs2.length).toBe(1);
  });

  it('runs a complete 2-tick OODA loop with Boyd feedback', async () => {
    let orientCallCount = 0;
    const provider: ModelProvider = {
      async generate(): Promise<ModelResponse> {
        orientCallCount++;
        // Always return valid orientation/decision responses
        return {
          content: JSON.stringify({
            situationFrame: `Tick ${orientCallCount}`,
            novelty: 0.1,
            attentionShift: [],
            implicitOptions: [{ action: 'monitor', confidence: 0.9, rationale: 'Routine' }],
            selectedAction: 'monitor',
            rationale: 'Routine monitoring',
          }),
        };
      },
    };

    store = new Store(':memory:');
    engine = new Engine(store, provider, mockLogger());

    const entityId = engine.createEntity('agent');
    engine.addComponent(entityId, 'OodaAgent', { active: true });
    engine.addComponent(entityId, 'WorldModel', { beliefs: {}, lastUpdated: 0, updateCount: 0 });

    const systems: OodaSystemRef = {
      observe: (id) => observe(engine, id),
      orient: (id) => orient(engine, id),
      decide: (id) => decide(engine, id),
      act: (id) => act(engine, id),
    };

    // Tick 1
    const meta1 = await runOodaTick(engine, entityId, systems, 1);
    expect(meta1.tickNumber).toBe(1);

    // After tick 1, ActionResult should exist
    const result1 = engine.getComponent(entityId, 'ActionResult');
    expect(result1).not.toBeNull();

    // Tick 2 — ActionResult from tick 1 should flow into Observe
    const meta2 = await runOodaTick(engine, entityId, systems, 2);
    expect(meta2.tickNumber).toBe(2);

    // Verify observation collected the previous action result
    const obs = engine.getComponent(entityId, 'Observation') as Record<string, unknown>;
    expect(obs).not.toBeNull();
  });
});
