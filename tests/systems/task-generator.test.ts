import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestEngine, collectEvents, mockProvider, mockLogger } from '../helpers.js';
import createTaskGenerator from '../../src/systems/task-generator.js';
import type { Engine } from '../../src/ecs/engine.js';
import type { Store } from '../../src/store/db.js';

describe('TaskGenerator', () => {
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

  it('generates subtask entities from LLM response', async () => {
    setup(JSON.stringify([
      { task: 'Subtask A', taskId: 'st-a' },
      { task: 'Subtask B', taskId: 'st-b' },
    ]));

    const system = createTaskGenerator(engine);
    await engine.registerSystem(system);

    engine.createEntity('obj-1');
    engine.addComponent('obj-1', 'TaskDescription', { task: 'Build something', complete: false });

    await system.handleEvent({
      type: 'system:selected',
      entityId: 'obj-1',
      data: { system: 'TaskGenerator' },
      source: 'test',
      timestamp: Date.now(),
    });

    expect(engine.entityExists('st-a')).toBe(true);
    expect(engine.entityExists('st-b')).toBe(true);
  });

  it('adds TaskDescription and TaskParent components', async () => {
    setup(JSON.stringify([{ task: 'Do thing', taskId: 'child-1' }]));

    const system = createTaskGenerator(engine);
    await engine.registerSystem(system);

    engine.createEntity('parent');
    engine.addComponent('parent', 'TaskDescription', { task: 'Parent task', complete: false });

    await system.handleEvent({
      type: 'system:selected',
      entityId: 'parent',
      data: { system: 'TaskGenerator' },
      source: 'test',
      timestamp: Date.now(),
    });

    expect(engine.getComponent('child-1', 'TaskDescription')).toEqual({ task: 'Do thing', complete: false });
    expect(engine.getComponent('child-1', 'TaskParent')).toEqual({ parentId: 'parent' });
  });

  it('emits entity:needs-routing for each subtask', async () => {
    setup(JSON.stringify([
      { task: 'A', taskId: 'a' },
      { task: 'B', taskId: 'b' },
    ]));

    const system = createTaskGenerator(engine);
    await engine.registerSystem(system);

    engine.createEntity('parent');
    engine.addComponent('parent', 'TaskDescription', { task: 'Test', complete: false });

    const events = collectEvents(engine, 'entity:needs-routing');

    await system.handleEvent({
      type: 'system:selected',
      entityId: 'parent',
      data: { system: 'TaskGenerator' },
      source: 'test',
      timestamp: Date.now(),
    });

    const routingEvents = events.filter((e) => e.type === 'entity:needs-routing');
    expect(routingEvents.length).toBe(2);
    expect(routingEvents.map((e) => e.entityId).sort()).toEqual(['a', 'b']);
  });

  it('emits system:error on JSON parse failure', async () => {
    setup('not valid json');

    const system = createTaskGenerator(engine);
    await engine.registerSystem(system);

    engine.createEntity('e1');
    engine.addComponent('e1', 'TaskDescription', { task: 'test', complete: false });

    const events = collectEvents(engine, 'system:error');

    await system.handleEvent({
      type: 'system:selected',
      entityId: 'e1',
      data: { system: 'TaskGenerator' },
      source: 'test',
      timestamp: Date.now(),
    });

    expect(events.some((e) => e.type === 'system:error' && e.data.system === 'TaskGenerator')).toBe(true);
  });

  it('ignores events without TaskDescription', async () => {
    setup('[]');

    const system = createTaskGenerator(engine);
    await engine.registerSystem(system);

    engine.createEntity('empty');

    // Should not throw
    await system.handleEvent({
      type: 'system:selected',
      entityId: 'empty',
      data: { system: 'TaskGenerator' },
      source: 'test',
      timestamp: Date.now(),
    });
  });

  it('handles schema validation failures', async () => {
    setup(JSON.stringify([{ invalid: 'schema' }]));

    const system = createTaskGenerator(engine);
    await engine.registerSystem(system);

    engine.createEntity('e1');
    engine.addComponent('e1', 'TaskDescription', { task: 'test', complete: false });

    // Should not throw, just log warning
    await system.handleEvent({
      type: 'system:selected',
      entityId: 'e1',
      data: { system: 'TaskGenerator' },
      source: 'test',
      timestamp: Date.now(),
    });
  });
});
