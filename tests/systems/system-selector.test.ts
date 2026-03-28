import { describe, it, expect, afterEach } from 'vitest';
import { createTestEngine, collectEvents, mockProviderWithTools, mockLogger } from '../helpers.js';
import createSystemSelector from '../../src/systems/system-selector.js';
import type { Engine } from '../../src/ecs/engine.js';
import type { Store } from '../../src/store/db.js';
import type { ModelResponse } from '../../src/model/types.js';

describe('SystemSelector', () => {
  let engine: Engine;
  let store: Store;

  function setup(responses: ModelResponse[]) {
    const result = createTestEngine({
      provider: mockProviderWithTools(responses),
      logger: mockLogger(),
    });
    engine = result.engine;
    store = result.store;
  }

  afterEach(() => {
    store.close();
  });

  it('emits system:selected on tool call response', async () => {
    setup([{
      content: '',
      toolCalls: [{ id: 'c1', name: 'TaskGenerator', input: { entityId: 'e1' } }],
    }]);

    const system = createSystemSelector(engine);
    await engine.registerSystem(system);

    // Register a non-core system so there are tools to select from
    await engine.registerSystem({
      name: 'TaskGenerator',
      version: '1.0.0',
      type: 'system',
      description: 'Generates tasks',
      init() {},
      async handleEvent() {},
    });

    engine.createEntity('e1');
    engine.addComponent('e1', 'TaskDescription', { task: 'Test task', complete: false });

    const events = collectEvents(engine, 'system:selected');

    await system.handleEvent({
      type: 'entity:needs-routing',
      entityId: 'e1',
      data: {},
      source: 'test',
      timestamp: Date.now(),
    });

    expect(events.some((e) => e.type === 'system:selected' && e.data.system === 'TaskGenerator')).toBe(true);
  });

  it('adds SystemSelection component', async () => {
    setup([{
      content: '',
      toolCalls: [{ id: 'c1', name: 'TestSystem', input: { entityId: 'e1' } }],
    }]);

    const system = createSystemSelector(engine);
    await engine.registerSystem(system);

    await engine.registerSystem({
      name: 'TestSystem',
      version: '1.0.0',
      type: 'system',
      description: 'A test system',
      init() {},
      async handleEvent() {},
    });

    engine.createEntity('e1');
    engine.addComponent('e1', 'TaskDescription', { task: 'Test', complete: false });

    await system.handleEvent({
      type: 'entity:needs-routing',
      entityId: 'e1',
      data: {},
      source: 'test',
      timestamp: Date.now(),
    });

    expect(engine.getComponent('e1', 'SystemSelection')).toEqual({ selectedSystem: 'TestSystem' });
  });

  it('returns silently when no non-core systems registered', async () => {
    setup([{ content: '' }]);

    const system = createSystemSelector(engine);
    await engine.registerSystem(system);

    engine.createEntity('e1');
    engine.addComponent('e1', 'TaskDescription', { task: 'Test', complete: false });

    // Should not throw
    await system.handleEvent({
      type: 'entity:needs-routing',
      entityId: 'e1',
      data: {},
      source: 'test',
      timestamp: Date.now(),
    });
  });

  it('emits system:error when no toolCalls returned', async () => {
    setup([{ content: 'I cannot select a system' }]);

    const system = createSystemSelector(engine);
    await engine.registerSystem(system);

    await engine.registerSystem({
      name: 'SomeSystem',
      version: '1.0.0',
      type: 'system',
      description: 'A system',
      init() {},
      async handleEvent() {},
    });

    engine.createEntity('e1');
    engine.addComponent('e1', 'TaskDescription', { task: 'Test', complete: false });

    const events = collectEvents(engine, 'system:error');

    await system.handleEvent({
      type: 'entity:needs-routing',
      entityId: 'e1',
      data: {},
      source: 'test',
      timestamp: Date.now(),
    });

    expect(events.some((e) => e.type === 'system:error' && e.data.system === 'SystemSelector')).toBe(true);
  });

  it('ignores events without TaskDescription', async () => {
    setup([{ content: '' }]);

    const system = createSystemSelector(engine);
    await engine.registerSystem(system);

    engine.createEntity('e1');

    await system.handleEvent({
      type: 'entity:needs-routing',
      entityId: 'e1',
      data: {},
      source: 'test',
      timestamp: Date.now(),
    });

    expect(engine.getComponent('e1', 'SystemSelection')).toBeNull();
  });
});
