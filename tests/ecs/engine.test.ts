import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Engine } from '../../src/ecs/engine.js';
import { Store } from '../../src/store/db.js';
import type { ModelProvider, ModelResponse } from '../../src/model/types.js';
import type { Logger } from '../../src/util/logger.js';
import type { System, ECSEvent } from '../../src/ecs/types.js';

function mockProvider(): ModelProvider {
  return {
    async generate(): Promise<ModelResponse> {
      return { content: 'mock response' };
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

describe('Engine', () => {
  let store: Store;
  let engine: Engine;

  beforeEach(() => {
    store = new Store(':memory:');
    engine = new Engine(store, mockProvider(), mockLogger());
  });

  afterEach(() => {
    store.close();
  });

  it('creates and retrieves entities', () => {
    const id = engine.createEntity('test-entity');
    expect(id).toBe('test-entity');
    expect(engine.entityExists('test-entity')).toBe(true);
    expect(engine.entityExists('nonexistent')).toBe(false);
  });

  it('auto-generates entity IDs', () => {
    const id = engine.createEntity();
    expect(id).toBeTruthy();
    expect(engine.entityExists(id)).toBe(true);
  });

  it('adds and retrieves components', () => {
    engine.createEntity('e1');
    engine.addComponent('e1', 'Position', { x: 10, y: 20 });
    const pos = engine.getComponent('e1', 'Position');
    expect(pos).toEqual({ x: 10, y: 20 });
  });

  it('returns null for missing components', () => {
    engine.createEntity('e1');
    expect(engine.getComponent('e1', 'Missing')).toBeNull();
  });

  it('updates components via setComponent', () => {
    engine.createEntity('e1');
    engine.addComponent('e1', 'Health', { value: 100 });
    engine.setComponent('e1', 'Health', { value: 50 });
    expect(engine.getComponent('e1', 'Health')).toEqual({ value: 50 });
  });

  it('removes components', () => {
    engine.createEntity('e1');
    engine.addComponent('e1', 'Tag', { name: 'test' });
    engine.removeComponent('e1', 'Tag');
    expect(engine.getComponent('e1', 'Tag')).toBeNull();
  });

  it('queries entities by component', () => {
    engine.createEntity('e1');
    engine.createEntity('e2');
    engine.createEntity('e3');
    engine.addComponent('e1', 'TaskDescription', { task: 'a' });
    engine.addComponent('e3', 'TaskDescription', { task: 'b' });
    const entities = engine.getEntitiesByComponent('TaskDescription');
    expect(entities).toHaveLength(2);
    expect(entities).toContain('e1');
    expect(entities).toContain('e3');
  });

  it('deletes entities and cascades components', () => {
    engine.createEntity('e1');
    engine.addComponent('e1', 'Foo', { bar: 1 });
    engine.deleteEntity('e1');
    expect(engine.entityExists('e1')).toBe(false);
    expect(engine.getComponent('e1', 'Foo')).toBeNull();
  });

  it('registers systems', async () => {
    const system: System = {
      name: 'TestSystem',
      version: '1.0.0',
      type: 'system',
      description: 'A test system',
      init: vi.fn(),
      handleEvent: vi.fn(),
    };
    await engine.registerSystem(system);
    expect(engine.getSystem('TestSystem')).toBe(system);
    expect(system.init).toHaveBeenCalled();
  });

  it('emits events and logs them to store', () => {
    const handler = vi.fn();
    engine.on('test:event', handler);
    const event: ECSEvent = {
      type: 'test:event',
      entityId: 'e1',
      data: { foo: 'bar' },
      source: 'test',
      timestamp: Date.now(),
    };
    engine.emit(event);
    expect(handler).toHaveBeenCalledWith(event);

    const logged = store.getEvents('test:event', 1);
    expect(logged).toHaveLength(1);
    expect(logged[0].data).toEqual({ foo: 'bar' });
  });
});
