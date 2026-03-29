import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Engine } from '../../src/ecs/engine.js';
import { Store } from '../../src/store/db.js';
import type { ModelProvider, ModelResponse } from '../../src/model/types.js';
import type { Logger } from '../../src/util/logger.js';
import { runOodaTick, runOodaTickAll } from '../../src/core/tick.js';
import type { OodaSystemRef } from '../../src/core/tick.js';

function mockProvider(): ModelProvider {
  return {
    async generate(): Promise<ModelResponse> {
      return { content: 'mock' };
    },
  };
}

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

describe('OODA Tick Orchestrator', () => {
  let store: Store;
  let engine: Engine;

  beforeEach(() => {
    store = new Store(':memory:');
    engine = new Engine(store, mockProvider(), mockLogger());
  });

  afterEach(() => {
    store.close();
  });

  it('runs all four phases in order', async () => {
    const entityId = engine.createEntity('agent-1');
    engine.addComponent(entityId, 'OodaAgent', { active: true });

    const order: string[] = [];
    const systems: OodaSystemRef = {
      observe: vi.fn(async () => { order.push('observe'); }),
      orient: vi.fn(async () => { order.push('orient'); }),
      decide: vi.fn(async () => { order.push('decide'); }),
      act: vi.fn(async () => { order.push('act'); }),
    };

    const meta = await runOodaTick(engine, entityId, systems, 1);

    expect(order).toEqual(['observe', 'orient', 'decide', 'act']);
    expect(meta.tickNumber).toBe(1);
    expect(meta.phaseDurations.observe).toBeGreaterThanOrEqual(0);
    expect(meta.phaseDurations.orient).toBeGreaterThanOrEqual(0);
    expect(meta.phaseDurations.decide).toBeGreaterThanOrEqual(0);
    expect(meta.phaseDurations.act).toBeGreaterThanOrEqual(0);
  });

  it('stores TickMetadata component on entity', async () => {
    const entityId = engine.createEntity('agent-1');
    const systems: OodaSystemRef = {
      observe: vi.fn(async () => {}),
      orient: vi.fn(async () => {}),
      decide: vi.fn(async () => {}),
      act: vi.fn(async () => {}),
    };

    await runOodaTick(engine, entityId, systems, 5);

    const meta = engine.getComponent(entityId, 'TickMetadata');
    expect(meta).not.toBeNull();
    expect((meta as Record<string, unknown>).tickNumber).toBe(5);
  });

  it('emits ooda:tick-complete event', async () => {
    const entityId = engine.createEntity('agent-1');
    const handler = vi.fn();
    engine.on('ooda:tick-complete', handler);

    const systems: OodaSystemRef = {
      observe: vi.fn(async () => {}),
      orient: vi.fn(async () => {}),
      decide: vi.fn(async () => {}),
      act: vi.fn(async () => {}),
    };

    await runOodaTick(engine, entityId, systems, 1);
    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0].data.tickNumber).toBe(1);
  });

  it('detects worldmodel update from high novelty orientation', async () => {
    const entityId = engine.createEntity('agent-1');

    const systems: OodaSystemRef = {
      observe: vi.fn(async () => {}),
      orient: vi.fn(async () => {
        // Simulate orient setting high novelty
        engine.setComponent(entityId, 'Orientation', {
          situationFrame: 'novel',
          novelty: 0.9,
          attentionShift: [],
          implicitOptions: [],
          tick: 1,
        });
      }),
      decide: vi.fn(async () => {}),
      act: vi.fn(async () => {}),
    };

    const meta = await runOodaTick(engine, entityId, systems, 1);
    expect(meta.worldModelUpdated).toBe(true);
  });

  it('runOodaTickAll processes all OodaAgent entities', async () => {
    engine.createEntity('agent-1');
    engine.addComponent('agent-1', 'OodaAgent', { active: true });
    engine.createEntity('agent-2');
    engine.addComponent('agent-2', 'OodaAgent', { active: true });
    engine.createEntity('non-agent');

    const systems: OodaSystemRef = {
      observe: vi.fn(async () => {}),
      orient: vi.fn(async () => {}),
      decide: vi.fn(async () => {}),
      act: vi.fn(async () => {}),
    };

    const results = await runOodaTickAll(engine, systems, 1);
    expect(results.size).toBe(2);
    expect(results.has('agent-1')).toBe(true);
    expect(results.has('agent-2')).toBe(true);
    expect(systems.observe).toHaveBeenCalledTimes(2);
  });
});
