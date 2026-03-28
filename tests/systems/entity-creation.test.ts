import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestEngine, collectEvents, makeEvent } from '../helpers.js';
import createEntityCreationSystem from '../../src/systems/entity-creation.js';
import type { Engine } from '../../src/ecs/engine.js';
import type { Store } from '../../src/store/db.js';

describe('EntityCreationSystem', () => {
  let engine: Engine;
  let store: Store;

  beforeEach(async () => {
    ({ engine, store } = createTestEngine());
    const system = createEntityCreationSystem(engine);
    await engine.registerSystem(system);
  });

  afterEach(() => {
    store.close();
  });

  it('creates entity on entity:create event', () => {
    engine.emit(makeEvent({
      type: 'entity:create',
      entityId: 'new-entity',
      data: {},
    }));

    expect(engine.entityExists('new-entity')).toBe(true);
  });

  it('attaches components from event data', () => {
    engine.emit(makeEvent({
      type: 'entity:create',
      entityId: 'with-comps',
      data: {
        components: {
          Health: { value: 100 },
          Name: { name: 'TestEntity' },
        },
      },
    }));

    expect(engine.getComponent('with-comps', 'Health')).toEqual({ value: 100 });
    expect(engine.getComponent('with-comps', 'Name')).toEqual({ name: 'TestEntity' });
  });

  it('skips creation if entity already exists (idempotent)', () => {
    engine.createEntity('existing');
    engine.addComponent('existing', 'Foo', { bar: 1 });

    engine.emit(makeEvent({
      type: 'entity:create',
      entityId: 'existing',
      data: { components: { Baz: { x: 2 } } },
    }));

    // Original component should still be there
    expect(engine.getComponent('existing', 'Foo')).toEqual({ bar: 1 });
    // New component should be added
    expect(engine.getComponent('existing', 'Baz')).toEqual({ x: 2 });
  });

  it('emits entity:created after processing', () => {
    const events = collectEvents(engine, 'entity:created');

    engine.emit(makeEvent({
      type: 'entity:create',
      entityId: 'test-emit',
      data: {},
    }));

    expect(events.some((e) => e.type === 'entity:created' && e.entityId === 'test-emit')).toBe(true);
  });

  it('handles events with no components gracefully', () => {
    engine.emit(makeEvent({
      type: 'entity:create',
      entityId: 'no-comps',
      data: {},
    }));

    expect(engine.entityExists('no-comps')).toBe(true);
  });
});
