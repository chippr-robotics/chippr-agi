import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Engine } from '../../src/ecs/engine.js';
import { Store } from '../../src/store/db.js';
import type { ModelProvider, ModelResponse } from '../../src/model/types.js';
import type { Logger } from '../../src/util/logger.js';
import { observe } from '../../src/systems/observe.js';
import { orient } from '../../src/systems/orient.js';
import { decide } from '../../src/systems/decide.js';
import { act } from '../../src/systems/act.js';

function mockProvider(response?: string): ModelProvider {
  return {
    async generate(): Promise<ModelResponse> {
      return { content: response ?? '{}' };
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

describe('ObserveSystem', () => {
  let store: Store;
  let engine: Engine;

  beforeEach(() => {
    store = new Store(':memory:');
    engine = new Engine(store, mockProvider(), mockLogger());
  });

  afterEach(() => {
    store.close();
  });

  it('collects observations from action results', async () => {
    const id = engine.createEntity('agent');
    engine.addComponent(id, 'ActionResult', {
      action: 'test-action',
      success: true,
      result: { data: 'hello' },
      tick: 0,
      timestamp: Date.now(),
    });

    await observe(engine, id);

    const obs = engine.getComponent(id, 'Observation') as Record<string, unknown>;
    expect(obs).not.toBeNull();
    const observations = obs.observations as Array<Record<string, unknown>>;
    expect(observations.length).toBeGreaterThan(0);
    expect(observations.some((o) => o.source === 'action_result')).toBe(true);
  });

  it('collects inbox messages as observations', async () => {
    const id = engine.createEntity('agent');
    engine.addComponent(id, 'Inbox', {
      messages: [
        { from: 'other', to: id, content: 'hello', metadata: {}, timestamp: Date.now() },
      ],
    });

    await observe(engine, id);

    const obs = engine.getComponent(id, 'Observation') as Record<string, unknown>;
    const observations = obs.observations as Array<Record<string, unknown>>;
    expect(observations.some((o) => (o.source as string).startsWith('message:'))).toBe(true);

    // Inbox should be cleared
    const inbox = engine.getComponent(id, 'Inbox') as Record<string, unknown>;
    expect((inbox.messages as unknown[]).length).toBe(0);
  });

  it('respects attention filter for sensor types', async () => {
    const id = engine.createEntity('agent');
    engine.addComponent(id, 'AttentionFilter', {
      priorities: [],
      activeSensors: ['tool_output'],
    });
    engine.addComponent(id, 'Sensor', {
      sensorType: 'file_watcher',
      active: true,
      config: { path: '/tmp' },
    });

    await observe(engine, id);

    const obs = engine.getComponent(id, 'Observation') as Record<string, unknown>;
    const observations = obs.observations as Array<Record<string, unknown>>;
    // file_watcher sensor should be filtered out since only tool_output is active
    expect(observations.filter((o) => o.source === 'file_watcher').length).toBe(0);
  });

  it('produces empty observations when nothing available', async () => {
    const id = engine.createEntity('agent');

    await observe(engine, id);

    const obs = engine.getComponent(id, 'Observation') as Record<string, unknown>;
    expect(obs).not.toBeNull();
    expect((obs.observations as unknown[]).length).toBe(0);
  });
});

describe('OrientSystem', () => {
  let store: Store;

  afterEach(() => {
    store.close();
  });

  it('produces orientation with novelty score from model response', async () => {
    const orientResponse = JSON.stringify({
      situationFrame: 'Agent detected new pattern',
      novelty: 0.8,
      beliefUpdates: { pattern: 'detected' },
      attentionShift: ['logs', 'metrics'],
      implicitOptions: [{ action: 'investigate', confidence: 0.9, rationale: 'High novelty' }],
    });

    store = new Store(':memory:');
    const engine = new Engine(store, mockProvider(orientResponse), mockLogger());
    const id = engine.createEntity('agent');
    engine.addComponent(id, 'Observation', {
      observations: [{ source: 'test', data: 'new data', timestamp: Date.now() }],
      tick: 1,
    });
    engine.addComponent(id, 'WorldModel', { beliefs: {}, lastUpdated: 0, updateCount: 0 });

    await orient(engine, id);

    const o = engine.getComponent(id, 'Orientation') as Record<string, unknown>;
    expect(o).not.toBeNull();
    expect(o.novelty).toBe(0.8);
    expect(o.situationFrame).toBe('Agent detected new pattern');
    expect((o.implicitOptions as unknown[]).length).toBe(1);

    // World model should be updated
    const wm = engine.getComponent(id, 'WorldModel') as Record<string, unknown>;
    expect((wm.beliefs as Record<string, unknown>).pattern).toBe('detected');
    expect(wm.updateCount).toBe(1);
  });

  it('produces low novelty with no observations', async () => {
    store = new Store(':memory:');
    const engine = new Engine(store, mockProvider(), mockLogger());
    const id = engine.createEntity('agent');
    engine.addComponent(id, 'Observation', { observations: [], tick: 1 });

    await orient(engine, id);

    const o = engine.getComponent(id, 'Orientation') as Record<string, unknown>;
    expect(o.novelty).toBe(0);
  });

  it('updates attention filter (Boyd feedback loop)', async () => {
    const orientResponse = JSON.stringify({
      situationFrame: 'Shift focus',
      novelty: 0.5,
      attentionShift: ['network', 'cpu'],
      implicitOptions: [],
    });

    store = new Store(':memory:');
    const engine = new Engine(store, mockProvider(orientResponse), mockLogger());
    const id = engine.createEntity('agent');
    engine.addComponent(id, 'Observation', {
      observations: [{ source: 'x', data: {}, timestamp: Date.now() }],
      tick: 1,
    });

    await orient(engine, id);

    const filter = engine.getComponent(id, 'AttentionFilter') as Record<string, unknown>;
    expect(filter).not.toBeNull();
    expect(filter.priorities).toEqual(['network', 'cpu']);
  });
});

describe('DecideSystem', () => {
  let store: Store;

  afterEach(() => {
    store.close();
  });

  it('takes fast path when novelty is low', async () => {
    store = new Store(':memory:');
    const engine = new Engine(store, mockProvider(), mockLogger());
    const id = engine.createEntity('agent');
    engine.addComponent(id, 'Orientation', {
      situationFrame: 'Routine check',
      novelty: 0.1,
      attentionShift: [],
      implicitOptions: [
        { action: 'continue-monitoring', confidence: 0.95, rationale: 'Everything normal' },
        { action: 'alert', confidence: 0.2, rationale: 'Precautionary' },
      ],
      tick: 1,
    });

    await decide(engine, id);

    const d = engine.getComponent(id, 'Decision') as Record<string, unknown>;
    expect(d).not.toBeNull();
    expect(d.selectedAction).toBe('continue-monitoring');
    expect(d.deliberate).toBe(false);
  });

  it('takes deliberate path when novelty is high', async () => {
    const deliberateResponse = JSON.stringify({
      selectedAction: 'escalate-to-operator',
      rationale: 'Unprecedented situation requires human input',
    });

    store = new Store(':memory:');
    const engine = new Engine(store, mockProvider(deliberateResponse), mockLogger());
    const id = engine.createEntity('agent');
    engine.addComponent(id, 'Orientation', {
      situationFrame: 'Unknown anomaly detected',
      novelty: 0.9,
      attentionShift: [],
      implicitOptions: [{ action: 'investigate', confidence: 0.5, rationale: 'Need more info' }],
      tick: 1,
    });

    await decide(engine, id);

    const d = engine.getComponent(id, 'Decision') as Record<string, unknown>;
    expect(d.selectedAction).toBe('escalate-to-operator');
    expect(d.deliberate).toBe(true);
  });
});

describe('ActSystem', () => {
  let store: Store;
  let engine: Engine;

  beforeEach(() => {
    store = new Store(':memory:');
    engine = new Engine(store, mockProvider(), mockLogger());
  });

  afterEach(() => {
    store.close();
  });

  it('executes decided action and writes result', async () => {
    const id = engine.createEntity('agent');
    engine.addComponent(id, 'Decision', {
      selectedAction: 'deploy-update',
      rationale: 'Version is ready',
      deliberate: true,
      tick: 1,
    });

    await act(engine, id);

    const result = engine.getComponent(id, 'ActionResult') as Record<string, unknown>;
    expect(result).not.toBeNull();
    expect(result.action).toBe('deploy-update');
    expect(result.success).toBe(true);
  });

  it('handles no-op action', async () => {
    const id = engine.createEntity('agent');
    engine.addComponent(id, 'Decision', {
      selectedAction: 'no-op',
      rationale: 'Nothing to do',
      deliberate: false,
      tick: 1,
    });

    await act(engine, id);

    const result = engine.getComponent(id, 'ActionResult') as Record<string, unknown>;
    expect(result.action).toBe('no-op');
    expect(result.success).toBe(true);
    expect(result.result).toBeNull();
  });

  it('emits action:execute event', async () => {
    const id = engine.createEntity('agent');
    engine.addComponent(id, 'Decision', {
      selectedAction: 'test-action',
      rationale: 'testing',
      deliberate: false,
      tick: 1,
    });

    const handler = vi.fn();
    engine.on('action:execute', handler);

    await act(engine, id);

    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0].data.action).toBe('test-action');
  });
});
