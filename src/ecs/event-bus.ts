import { EventEmitter } from 'node:events';
import type { ECSEvent } from './types.js';

export class EventBus {
  private emitter = new EventEmitter();

  on(eventType: string, handler: (event: ECSEvent) => void | Promise<void>): void {
    this.emitter.on(eventType, handler);
  }

  off(eventType: string, handler: (event: ECSEvent) => void | Promise<void>): void {
    this.emitter.off(eventType, handler);
  }

  emit(event: ECSEvent): void {
    this.emitter.emit(event.type, event);
    this.emitter.emit('*', event);
  }
}
