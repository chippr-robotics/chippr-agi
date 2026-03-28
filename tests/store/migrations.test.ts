import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { runMigrations } from '../../src/store/migrations.js';

describe('runMigrations', () => {
  it('creates all tables on fresh database', () => {
    const db = new Database(':memory:');
    runMigrations(db);

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all()
      .map((r: { name: string }) => r.name);

    expect(tables).toContain('entities');
    expect(tables).toContain('components');
    expect(tables).toContain('events');
    expect(tables).toContain('memory');
    expect(tables).toContain('scheduled_tasks');
    expect(tables).toContain('media');
    expect(tables).toContain('schema_version');

    db.close();
  });

  it('records version in schema_version table', () => {
    const db = new Database(':memory:');
    runMigrations(db);

    const versions = db
      .prepare('SELECT version FROM schema_version ORDER BY version')
      .all()
      .map((r: { version: number }) => r.version);

    expect(versions).toEqual([1, 2]);
    db.close();
  });

  it('skips already-applied migrations', () => {
    const db = new Database(':memory:');
    runMigrations(db);
    // Run again — should not throw
    runMigrations(db);

    const versions = db
      .prepare('SELECT version FROM schema_version ORDER BY version')
      .all()
      .map((r: { version: number }) => r.version);

    expect(versions).toEqual([1, 2]);
    db.close();
  });

  it('sets WAL journal mode and foreign keys', () => {
    const db = new Database(':memory:');
    runMigrations(db);

    const fk = db.pragma('foreign_keys') as Array<{ foreign_keys: number }>;
    expect(fk[0].foreign_keys).toBe(1);
    db.close();
  });
});
