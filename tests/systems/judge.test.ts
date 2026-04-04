import { describe, it, expect, afterEach } from 'vitest';
import { createTestEngine, collectEvents, mockProvider, mockLogger } from '../helpers.js';
import createJudge from '../../src/systems/judge.js';
import type { Engine } from '../../src/ecs/engine.js';
import type { Store } from '../../src/store/db.js';

describe('TheJudge', () => {
  let engine: Engine;
  let store: Store;

  function setup(llmResponse: string) {
    const result = createTestEngine({
      provider: mockProvider([llmResponse]),
      logger: mockLogger(),
    });
    engine = result.engine;
    store = result.store;
  }

  afterEach(() => {
    store.close();
  });

  it('parses judgement from LLM response and adds component', async () => {
    setup(JSON.stringify({ complete: true, reasoning: 'Task done', score: 0.9 }));

    const system = createJudge(engine);
    await engine.registerSystem(system);

    engine.createEntity('task-1');
    engine.addComponent('task-1', 'TaskDescription', { task: 'Do something', complete: false });

    await system.handleEvent({
      type: 'task:completed',
      entityId: 'task-1',
      data: { result: 'It was done' },
      source: 'test',
      timestamp: Date.now(),
    });

    const judgement = engine.getComponent('task-1', 'Judgement');
    expect(judgement).toEqual({ complete: true, reasoning: 'Task done', score: 0.9 });
  });

  it('sets TaskDescription.complete when judge says complete', async () => {
    setup(JSON.stringify({ complete: true, reasoning: 'Done', score: 1.0 }));

    const system = createJudge(engine);
    await engine.registerSystem(system);

    engine.createEntity('task-2');
    engine.addComponent('task-2', 'TaskDescription', { task: 'Test', complete: false });

    await system.handleEvent({
      type: 'task:completed',
      entityId: 'task-2',
      data: {},
      source: 'test',
      timestamp: Date.now(),
    });

    const desc = engine.getComponent('task-2', 'TaskDescription');
    expect(desc?.complete).toBe(true);
  });

  it('emits task:judged event', async () => {
    setup(JSON.stringify({ complete: false, reasoning: 'Not done', score: 0.3 }));

    const system = createJudge(engine);
    await engine.registerSystem(system);

    engine.createEntity('task-3');
    engine.addComponent('task-3', 'TaskDescription', { task: 'Test', complete: false });

    const events = collectEvents(engine, 'task:judged');

    await system.handleEvent({
      type: 'task:completed',
      entityId: 'task-3',
      data: {},
      source: 'test',
      timestamp: Date.now(),
    });

    expect(events.some((e) => e.type === 'task:judged' && e.entityId === 'task-3')).toBe(true);
  });

  it('emits system:error on parse failure', async () => {
    setup('not json at all');

    const system = createJudge(engine);
    await engine.registerSystem(system);

    engine.createEntity('task-4');
    engine.addComponent('task-4', 'TaskDescription', { task: 'Test', complete: false });

    const events = collectEvents(engine, 'system:error');

    await system.handleEvent({
      type: 'task:completed',
      entityId: 'task-4',
      data: {},
      source: 'test',
      timestamp: Date.now(),
    });

    expect(events.some((e) => e.type === 'system:error' && e.data.system === 'TheJudge')).toBe(true);
  });

  it('ignores events without TaskDescription', async () => {
    setup('{}');

    const system = createJudge(engine);
    await engine.registerSystem(system);

    engine.createEntity('no-desc');

    await system.handleEvent({
      type: 'task:completed',
      entityId: 'no-desc',
      data: {},
      source: 'test',
      timestamp: Date.now(),
    });

    // Should not throw, no judgement added
    expect(engine.getComponent('no-desc', 'Judgement')).toBeNull();
  });

  it('does not set complete when judge says not complete', async () => {
    setup(JSON.stringify({ complete: false, reasoning: 'Needs work', score: 0.2 }));

    const system = createJudge(engine);
    await engine.registerSystem(system);

    engine.createEntity('task-5');
    engine.addComponent('task-5', 'TaskDescription', { task: 'Test', complete: false });

    await system.handleEvent({
      type: 'task:completed',
      entityId: 'task-5',
      data: {},
      source: 'test',
      timestamp: Date.now(),
    });

    const desc = engine.getComponent('task-5', 'TaskDescription');
    expect(desc?.complete).toBe(false);
  });
});
