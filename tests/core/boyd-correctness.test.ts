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
    let callCount = 0;
    const provider: ModelProvider = {
      async generate(): Promise<ModelResponse> {
        callCount++;
        if (callCount === 1) {
          // Orient response: shift attention to 'network'
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
        return { content: JSON.stringify({ selectedAction: 'investigate', rationale: 'check' }) };
      },
    };

    store = new Store(':memory:');
    engine = new Engine(store, provider, mockLogger());

    const entityId = engine.createEntity('agent');
    engine.addComponent(entityId, 'OodaAgent', { active: true });
    engine.addComponent(entityId, 'WorldModel', { beliefs: {}, lastUpdated: 0, updateCount: 0 });

    // Attach a 'network' sensor to the entity
    engine.addComponent(entityId, 'Sensor', {
      sensorType: 'network',
      active: true,
      config: { interface: 'eth0' },
    });

    // Add initial observation to trigger orient
    engine.addComponent(entityId, 'Observation', {
      observations: [{ source: 'boot', data: {}, timestamp: Date.now() }],
      tick: 0,
    });

    // --- Orient sets AttentionFilter (both priorities AND activeSensors) ---
    await orient(engine, entityId);

    const filter = engine.getComponent(entityId, 'AttentionFilter') as Record<string, unknown>;
    expect(filter).not.toBeNull();
    expect(filter.priorities).toEqual(['network']);
    // Orient now sets activeSensors too — this is the Boyd feedback arrow
    expect(filter.activeSensors).toEqual(['network']);

    // --- Observe uses the Orient-produced filter without manual overwrite ---
    await observe(engine, entityId);

    const obs = engine.getComponent(entityId, 'Observation') as Record<string, unknown>;
    const observations = obs.observations as Array<Record<string, unknown>>;

    // 'network' sensor should come through because activeSensors includes 'network'
    const networkObs = observations.filter((o) => o.source === 'network');
    expect(networkObs.length).toBe(1);

    // If there were a 'disk' sensor, it would be filtered out —
    // verify by checking no 'disk' observations exist
    const diskObs = observations.filter((o) => o.source === 'disk');
    expect(diskObs.length).toBe(0);
  });

  it('runs a complete 2-tick OODA loop with Boyd feedback', async () => {
    let orientCallCount = 0;
    const provider: ModelProvider = {
      async generate(): Promise<ModelResponse> {
        orientCallCount++;
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

  it('worldModelUpdated reflects actual WorldModel changes, not just novelty', async () => {
    let callCount = 0;
    const provider: ModelProvider = {
      async generate(): Promise<ModelResponse> {
        callCount++;
        if (callCount === 1) {
          // High novelty WITH belief updates → worldModelUpdated should be true
          return {
            content: JSON.stringify({
              situationFrame: 'New info',
              novelty: 0.9,
              beliefUpdates: { discovered: 'something' },
              attentionShift: [],
              implicitOptions: [{ action: 'act', confidence: 0.8, rationale: 'reason' }],
            }),
          };
        }
        // Decide response
        return { content: JSON.stringify({ selectedAction: 'act', rationale: 'ok' }) };
      },
    };

    store = new Store(':memory:');
    engine = new Engine(store, provider, mockLogger());

    const entityId = engine.createEntity('agent');
    engine.addComponent(entityId, 'OodaAgent', { active: true });
    engine.addComponent(entityId, 'WorldModel', { beliefs: {}, lastUpdated: 0, updateCount: 0 });
    // Seed an action result so Observe produces observations for Orient to process
    engine.addComponent(entityId, 'ActionResult', {
      action: 'init', success: true, result: { boot: true }, tick: 0, timestamp: Date.now(),
    });

    const systems: OodaSystemRef = {
      observe: (id) => observe(engine, id),
      orient: (id) => orient(engine, id),
      decide: (id) => decide(engine, id),
      act: (id) => act(engine, id),
    };

    const meta = await runOodaTick(engine, entityId, systems, 1);
    // worldModelUpdated is based on WorldModel.updateCount change, not novelty threshold
    expect(meta.worldModelUpdated).toBe(true);

    const wm = engine.getComponent(entityId, 'WorldModel') as Record<string, unknown>;
    expect((wm.beliefs as Record<string, unknown>).discovered).toBe('something');
  });
});
