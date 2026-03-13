import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Store } from '../../src/store/db.js';

describe('Store', () => {
  let store: Store;

  beforeEach(() => {
    store = new Store(':memory:');
  });

  afterEach(() => {
    store.close();
  });

  describe('entities', () => {
    it('creates and checks entity existence', () => {
      store.createEntity('e1');
      expect(store.entityExists('e1')).toBe(true);
      expect(store.entityExists('e2')).toBe(false);
    });

    it('deletes entities', () => {
      store.createEntity('e1');
      store.deleteEntity('e1');
      expect(store.entityExists('e1')).toBe(false);
    });

    it('handles duplicate creation gracefully', () => {
      store.createEntity('e1');
      store.createEntity('e1'); // should not throw
      expect(store.entityExists('e1')).toBe(true);
    });
  });

  describe('components', () => {
    it('adds and retrieves components', () => {
      store.createEntity('e1');
      store.addComponent('e1', 'Health', { value: 100 });
      expect(store.getComponent('e1', 'Health')).toEqual({ value: 100 });
    });

    it('returns null for missing component', () => {
      store.createEntity('e1');
      expect(store.getComponent('e1', 'Foo')).toBeNull();
    });

    it('replaces existing component', () => {
      store.createEntity('e1');
      store.addComponent('e1', 'Health', { value: 100 });
      store.setComponent('e1', 'Health', { value: 50 });
      expect(store.getComponent('e1', 'Health')).toEqual({ value: 50 });
    });

    it('removes components', () => {
      store.createEntity('e1');
      store.addComponent('e1', 'Tag', { name: 'test' });
      store.removeComponent('e1', 'Tag');
      expect(store.getComponent('e1', 'Tag')).toBeNull();
    });

    it('queries entities by component name', () => {
      store.createEntity('e1');
      store.createEntity('e2');
      store.addComponent('e1', 'Task', { name: 'a' });
      store.addComponent('e2', 'Task', { name: 'b' });
      const ids = store.getEntitiesByComponent('Task');
      expect(ids).toHaveLength(2);
      expect(ids).toContain('e1');
      expect(ids).toContain('e2');
    });

    it('cascades deletes when entity is removed', () => {
      store.createEntity('e1');
      store.addComponent('e1', 'A', { x: 1 });
      store.addComponent('e1', 'B', { y: 2 });
      store.deleteEntity('e1');
      expect(store.getComponent('e1', 'A')).toBeNull();
      expect(store.getComponent('e1', 'B')).toBeNull();
    });
  });

  describe('events', () => {
    it('logs and retrieves events', () => {
      store.logEvent({
        type: 'test:event',
        entityId: 'e1',
        data: { foo: 'bar' },
        source: 'test',
        timestamp: 1000,
      });
      const events = store.getEvents('test:event');
      expect(events).toHaveLength(1);
      expect(events[0].data).toEqual({ foo: 'bar' });
    });

    it('filters events by type', () => {
      store.logEvent({ type: 'a', entityId: 'e1', data: {}, source: 's', timestamp: 1 });
      store.logEvent({ type: 'b', entityId: 'e1', data: {}, source: 's', timestamp: 2 });
      expect(store.getEvents('a')).toHaveLength(1);
      expect(store.getEvents('b')).toHaveLength(1);
    });

    it('returns all events when no type filter', () => {
      store.logEvent({ type: 'a', entityId: 'e1', data: {}, source: 's', timestamp: 1 });
      store.logEvent({ type: 'b', entityId: 'e1', data: {}, source: 's', timestamp: 2 });
      expect(store.getEvents()).toHaveLength(2);
    });
  });

  describe('memory', () => {
    it('adds and retrieves memory', () => {
      store.addMemory('ctx1', 'user', 'Hello');
      store.addMemory('ctx1', 'assistant', 'Hi there');
      const mem = store.getMemory('ctx1');
      expect(mem).toHaveLength(2);
    });

    it('isolates memory by context', () => {
      store.addMemory('ctx1', 'user', 'Hello');
      store.addMemory('ctx2', 'user', 'World');
      expect(store.getMemory('ctx1')).toHaveLength(1);
      expect(store.getMemory('ctx2')).toHaveLength(1);
    });
  });
});
