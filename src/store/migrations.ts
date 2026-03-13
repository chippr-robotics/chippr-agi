import type Database from 'better-sqlite3';

const MIGRATIONS = [
  {
    version: 1,
    up: `
      CREATE TABLE IF NOT EXISTS entities (
        id TEXT PRIMARY KEY,
        created_at INTEGER DEFAULT (unixepoch())
      );

      CREATE TABLE IF NOT EXISTS components (
        entity_id TEXT NOT NULL,
        name TEXT NOT NULL,
        data TEXT NOT NULL,
        updated_at INTEGER DEFAULT (unixepoch()),
        PRIMARY KEY (entity_id, name),
        FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        entity_id TEXT,
        component TEXT,
        data TEXT NOT NULL,
        source TEXT NOT NULL,
        timestamp INTEGER DEFAULT (unixepoch())
      );

      CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
      CREATE INDEX IF NOT EXISTS idx_events_entity ON events(entity_id);

      CREATE TABLE IF NOT EXISTS memory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        context_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        embedding BLOB,
        created_at INTEGER DEFAULT (unixepoch())
      );

      CREATE INDEX IF NOT EXISTS idx_memory_context ON memory(context_id);

      CREATE TABLE IF NOT EXISTS scheduled_tasks (
        id TEXT PRIMARY KEY,
        cron TEXT NOT NULL,
        prompt TEXT NOT NULL,
        context_id TEXT,
        last_run INTEGER,
        enabled INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY
      );
    `,
  },
];

export function runMigrations(db: Database.Database): void {
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY)`);

  const currentVersion =
    db.prepare('SELECT MAX(version) as v FROM schema_version').get() as
      | { v: number | null }
      | undefined;
  const current = currentVersion?.v ?? 0;

  for (const migration of MIGRATIONS) {
    if (migration.version > current) {
      db.exec(migration.up);
      db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(migration.version);
    }
  }
}
