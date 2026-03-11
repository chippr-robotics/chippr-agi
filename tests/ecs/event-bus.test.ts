import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../../src/ecs/event-bus.js';
import type { ECSEvent } from '../../src/ecs/types.js';

function makeEvent(overrides: Partial<ECSEvent> = {}): ECSEvent {
  return {
    type: 'test:event',
    entityId: 'e1',
    data: {},
    source: 'test',
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('EventBus', () => {
  it('delivers events to registered handlers', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('test:event', handler);
    const event = makeEvent();
    bus.emit(event);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it('wildcard listener receives all events', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('*', handler);
    bus.emit(makeEvent({ type: 'a' }));
    bus.emit(makeEvent({ type: 'b' }));
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('does not deliver events after off()', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('test:event', handler);
    bus.off('test:event', handler);
    bus.emit(makeEvent());
    expect(handler).not.toHaveBeenCalled();
  });

  it('multiple handlers on the same event type', () => {
    const bus = new EventBus();
    const h1 = vi.fn();
    const h2 = vi.fn();
    bus.on('test:event', h1);
    bus.on('test:event', h2);
    bus.emit(makeEvent());
    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
  });
});
