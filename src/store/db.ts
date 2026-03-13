import Database from 'better-sqlite3';
import { runMigrations } from './migrations.js';
import type { ECSEvent, EntityId } from '../ecs/types.js';

export class Store {
  readonly db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    runMigrations(this.db);
  }

  // --- Entities ---

  createEntity(id: EntityId): void {
    this.db.prepare('INSERT OR IGNORE INTO entities (id) VALUES (?)').run(id);
  }

  deleteEntity(id: EntityId): void {
    this.db.prepare('DELETE FROM entities WHERE id = ?').run(id);
  }

  entityExists(id: EntityId): boolean {
    const row = this.db.prepare('SELECT 1 FROM entities WHERE id = ?').get(id);
    return row !== undefined;
  }

  // --- Components ---

  addComponent(entityId: EntityId, name: string, data: Record<string, unknown>): void {
    this.db
      .prepare(
        'INSERT OR REPLACE INTO components (entity_id, name, data, updated_at) VALUES (?, ?, ?, unixepoch())',
      )
      .run(entityId, name, JSON.stringify(data));
  }

  getComponent<T extends Record<string, unknown> = Record<string, unknown>>(
    entityId: EntityId,
    name: string,
  ): T | null {
    const row = this.db
      .prepare('SELECT data FROM components WHERE entity_id = ? AND name = ?')
      .get(entityId, name) as { data: string } | undefined;
    return row ? (JSON.parse(row.data) as T) : null;
  }

  setComponent(entityId: EntityId, name: string, data: Record<string, unknown>): void {
    this.addComponent(entityId, name, data);
  }

  removeComponent(entityId: EntityId, name: string): void {
    this.db
      .prepare('DELETE FROM components WHERE entity_id = ? AND name = ?')
      .run(entityId, name);
  }

  getEntitiesByComponent(name: string): EntityId[] {
    const rows = this.db
      .prepare('SELECT entity_id FROM components WHERE name = ?')
      .all(name) as { entity_id: string }[];
    return rows.map((r) => r.entity_id);
  }

  // --- Events ---

  logEvent(event: ECSEvent): void {
    this.db
      .prepare(
        'INSERT INTO events (type, entity_id, component, data, source, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(
        event.type,
        event.entityId,
        event.component ?? null,
        JSON.stringify(event.data),
        event.source,
        event.timestamp,
      );
  }

  getEvents(type?: string, limit = 100): ECSEvent[] {
    const query = type
      ? 'SELECT * FROM events WHERE type = ? ORDER BY id DESC LIMIT ?'
      : 'SELECT * FROM events ORDER BY id DESC LIMIT ?';
    const params = type ? [type, limit] : [limit];
    const rows = this.db.prepare(query).all(...params) as Array<{
      type: string;
      entity_id: string;
      component: string | null;
      data: string;
      source: string;
      timestamp: number;
    }>;
    return rows.map((r) => ({
      type: r.type,
      entityId: r.entity_id,
      component: r.component ?? undefined,
      data: JSON.parse(r.data) as Record<string, unknown>,
      source: r.source,
      timestamp: r.timestamp,
    }));
  }

  // --- Memory ---

  addMemory(contextId: string, role: string, content: string): void {
    this.db
      .prepare('INSERT INTO memory (context_id, role, content) VALUES (?, ?, ?)')
      .run(contextId, role, content);
  }

  getMemory(contextId: string, limit = 50): Array<{ role: string; content: string; created_at: number }> {
    return this.db
      .prepare('SELECT role, content, created_at FROM memory WHERE context_id = ? ORDER BY created_at DESC LIMIT ?')
      .all(contextId, limit) as Array<{ role: string; content: string; created_at: number }>;
  }

  // --- Scheduled Tasks ---

  getScheduledTasks(): Array<{ id: string; cron: string; prompt: string; context_id: string | null; last_run: number | null }> {
    return this.db
      .prepare('SELECT id, cron, prompt, context_id, last_run FROM scheduled_tasks WHERE enabled = 1')
      .all() as Array<{ id: string; cron: string; prompt: string; context_id: string | null; last_run: number | null }>;
  }

  updateTaskLastRun(id: string, timestamp: number): void {
    this.db.prepare('UPDATE scheduled_tasks SET last_run = ? WHERE id = ?').run(timestamp, id);
  }

  close(): void {
    this.db.close();
  }
}
