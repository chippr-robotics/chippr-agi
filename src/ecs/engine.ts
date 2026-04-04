import { EventBus } from './event-bus.js';
import type { ECSEvent, EntityId, System } from './types.js';
import type { Store } from '../store/db.js';
import type { ModelProvider } from '../model/types.js';
import type { Logger } from '../util/logger.js';
import { uniqueId } from '../util/hash.js';

export class Engine {
  private systems = new Map<string, System>();
  private eventBus = new EventBus();

  constructor(
    private store: Store,
    private provider: ModelProvider,
    private logger: Logger,
  ) {}

  // --- Entity operations (delegate to store) ---

  createEntity(id?: EntityId): EntityId {
    const entityId = id ?? uniqueId();
    this.store.createEntity(entityId);
    return entityId;
  }

  deleteEntity(id: EntityId): void {
    this.store.deleteEntity(id);
  }

  entityExists(id: EntityId): boolean {
    return this.store.entityExists(id);
  }

  // --- Component operations ---

  addComponent(entityId: EntityId, name: string, data: Record<string, unknown>): void {
    this.store.addComponent(entityId, name, data);
  }

  getComponent<T = Record<string, unknown>>(
    entityId: EntityId,
    name: string,
  ): T | null {
    return this.store.getComponent<T>(entityId, name);
  }

  setComponent(entityId: EntityId, name: string, data: Record<string, unknown>): void {
    this.store.setComponent(entityId, name, data);
  }

  removeComponent(entityId: EntityId, name: string): void {
    this.store.removeComponent(entityId, name);
  }

  getEntitiesByComponent(name: string): EntityId[] {
    return this.store.getEntitiesByComponent(name);
  }

  // --- System registration ---

  async registerSystem(system: System): Promise<void> {
    this.systems.set(system.name, system);
    await system.init();
    this.logger.info({ system: system.name, version: system.version }, 'System registered');
  }

  getSystem(name: string): System | undefined {
    return this.systems.get(name);
  }

  getSystems(): Map<string, System> {
    return this.systems;
  }

  // --- Event handling ---

  on(eventType: string, handler: (event: ECSEvent) => void | Promise<void>): void {
    this.eventBus.on(eventType, handler);
  }

  off(eventType: string, handler: (event: ECSEvent) => void | Promise<void>): void {
    this.eventBus.off(eventType, handler);
  }

  emit(event: ECSEvent): void {
    this.store.logEvent(event);
    this.eventBus.emit(event);
  }

  // --- Accessors ---

  getProvider(): ModelProvider {
    return this.provider;
  }

  getLogger(): Logger {
    return this.logger;
  }

  getStore(): Store {
    return this.store;
  }
}
