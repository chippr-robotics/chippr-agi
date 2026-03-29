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
  {
    version: 2,
    up: `
      CREATE TABLE IF NOT EXISTS media (
        id TEXT PRIMARY KEY,
        entity_id TEXT,
        filename TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        source TEXT NOT NULL,
        context_id TEXT,
        extracted_text TEXT,
        storage_path TEXT NOT NULL,
        created_at INTEGER DEFAULT (unixepoch()),
        FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS idx_media_entity ON media(entity_id);
      CREATE INDEX IF NOT EXISTS idx_media_context ON media(context_id);
      CREATE INDEX IF NOT EXISTS idx_media_source ON media(source);
    `,
  },
  {
    version: 3,
    up: `
      CREATE TABLE IF NOT EXISTS semantic_memory (
        id TEXT PRIMARY KEY,
        entity_id TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT,
        embedding BLOB,
        created_at INTEGER DEFAULT (unixepoch()),
        last_accessed INTEGER DEFAULT (unixepoch()),
        access_count INTEGER DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_semantic_entity ON semantic_memory(entity_id);
      CREATE INDEX IF NOT EXISTS idx_semantic_category ON semantic_memory(category);

      CREATE TABLE IF NOT EXISTS episodic_memory (
        id TEXT PRIMARY KEY,
        entity_id TEXT NOT NULL,
        episode_summary TEXT NOT NULL,
        full_episode TEXT,
        novelty_score REAL,
        embedding BLOB,
        tick_number INTEGER,
        created_at INTEGER DEFAULT (unixepoch())
      );

      CREATE INDEX IF NOT EXISTS idx_episodic_entity ON episodic_memory(entity_id);
      CREATE INDEX IF NOT EXISTS idx_episodic_novelty ON episodic_memory(novelty_score);

      CREATE TABLE IF NOT EXISTS procedural_memory (
        id TEXT PRIMARY KEY,
        entity_id TEXT NOT NULL,
        skill_name TEXT NOT NULL,
        description TEXT,
        tool_sequence TEXT,
        success_count INTEGER DEFAULT 0,
        failure_count INTEGER DEFAULT 0,
        avg_reward REAL DEFAULT 0.0,
        source TEXT,
        created_at INTEGER DEFAULT (unixepoch()),
        updated_at INTEGER DEFAULT (unixepoch())
      );

      CREATE INDEX IF NOT EXISTS idx_procedural_entity ON procedural_memory(entity_id);
      CREATE INDEX IF NOT EXISTS idx_procedural_skill ON procedural_memory(skill_name);

      CREATE TABLE IF NOT EXISTS entity_snapshots (
        entity_id TEXT NOT NULL,
        snapshot_time INTEGER NOT NULL,
        components TEXT NOT NULL,
        PRIMARY KEY (entity_id, snapshot_time)
      );

      CREATE INDEX IF NOT EXISTS idx_snapshots_entity ON entity_snapshots(entity_id);
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
