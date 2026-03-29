import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { runMigrations } from '../../src/store/migrations.js';
import { MemoryStore } from '../../src/store/memory-store.js';
import { serializeEmbedding } from '../../src/model/embedding.js';

describe('MemoryStore', () => {
  let db: Database.Database;
  let memStore: MemoryStore;

  beforeEach(() => {
    db = new Database(':memory:');
    runMigrations(db);
    memStore = new MemoryStore(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('Semantic Memory', () => {
    it('adds and searches semantic memories by vector', () => {
      const embedding1 = [1, 0, 0, 0];
      const embedding2 = [0, 1, 0, 0];
      const queryEmbedding = [0.9, 0.1, 0, 0]; // closer to embedding1

      memStore.addSemantic('agent-1', 'sm-1', 'The sky is blue', 'fact', embedding1);
      memStore.addSemantic('agent-1', 'sm-2', 'Water is wet', 'fact', embedding2);

      const results = memStore.searchSemantic('agent-1', queryEmbedding);
      expect(results.length).toBe(2);
      expect(results[0].id).toBe('sm-1'); // closer match
      expect(results[0].score).toBeGreaterThan(results[1].score!);
    });

    it('touches semantic memory to update access stats', () => {
      memStore.addSemantic('agent-1', 'sm-1', 'Test content', 'fact', [1, 0]);

      memStore.touchSemantic('sm-1');
      memStore.touchSemantic('sm-1');

      const row = db
        .prepare('SELECT access_count FROM semantic_memory WHERE id = ?')
        .get('sm-1') as { access_count: number };
      expect(row.access_count).toBe(2);
    });
  });

  describe('Episodic Memory', () => {
    it('adds and retrieves episodic memories', () => {
      memStore.addEpisodic('agent-1', 'ep-1', 'Found a bug', { tick: 1 }, 0.8, 1);
      memStore.addEpisodic('agent-1', 'ep-2', 'Fixed the bug', { tick: 2 }, 0.3, 2);

      const episodes = memStore.getEpisodicByEntity('agent-1');
      expect(episodes.length).toBe(2);
      expect(episodes[0].episodeSummary).toBe('Fixed the bug'); // most recent first
    });

    it('searches episodic memories by vector', () => {
      const emb1 = [1, 0, 0];
      const emb2 = [0, 1, 0];

      memStore.addEpisodic('agent-1', 'ep-1', 'Episode A', null, 0.5, 1, emb1);
      memStore.addEpisodic('agent-1', 'ep-2', 'Episode B', null, 0.7, 2, emb2);

      const results = memStore.searchEpisodic('agent-1', [0.9, 0.1, 0]);
      expect(results.length).toBe(2);
      expect(results[0].id).toBe('ep-1');
    });
  });

  describe('Procedural Memory', () => {
    it('adds and retrieves skills', () => {
      memStore.addProcedural('agent-1', 'sk-1', 'deploy', 'Deploy to prod', [{ step: 1 }], 'learned');

      const skills = memStore.getProceduralByEntity('agent-1');
      expect(skills.length).toBe(1);
      expect(skills[0].skillName).toBe('deploy');
      expect(skills[0].source).toBe('learned');
    });

    it('updates procedural stats with EMA', () => {
      memStore.addProcedural('agent-1', 'sk-1', 'test-skill', 'Test', [], 'learned');

      memStore.updateProceduralStats('sk-1', true, 1.0);
      memStore.updateProceduralStats('sk-1', true, 1.0);
      memStore.updateProceduralStats('sk-1', false, 0.0);

      const skill = memStore.getProceduralByName('agent-1', 'test-skill');
      expect(skill).not.toBeNull();
      expect(skill!.successCount).toBe(2);
      expect(skill!.failureCount).toBe(1);
      expect(skill!.avgReward).toBeGreaterThan(0);
      expect(skill!.avgReward).toBeLessThan(1);
    });

    it('looks up skill by name', () => {
      memStore.addProcedural('agent-1', 'sk-1', 'unique-skill', 'Desc', [], 'imported');

      const skill = memStore.getProceduralByName('agent-1', 'unique-skill');
      expect(skill).not.toBeNull();
      expect(skill!.id).toBe('sk-1');

      const missing = memStore.getProceduralByName('agent-1', 'nonexistent');
      expect(missing).toBeNull();
    });
  });

  describe('Entity Snapshots', () => {
    it('saves and retrieves entity snapshots', () => {
      // Need to create entity first for foreign key
      db.prepare('INSERT INTO entities (id) VALUES (?)').run('agent-1');

      const components = {
        Identity: { role: 'worker' },
        WorldModel: { beliefs: { key: 'value' } },
      };

      memStore.saveSnapshot('agent-1', components);

      const snapshot = memStore.getLatestSnapshot('agent-1');
      expect(snapshot).not.toBeNull();
      expect(snapshot!.components).toEqual(components);
    });

    it('returns latest snapshot when multiple exist', () => {
      db.prepare('INSERT INTO entities (id) VALUES (?)').run('agent-1');

      memStore.saveSnapshot('agent-1', { v: 1 }, 1000);
      memStore.saveSnapshot('agent-1', { v: 2 }, 2000);

      const snapshot = memStore.getLatestSnapshot('agent-1');
      expect(snapshot!.components).toEqual({ v: 2 });
    });

    it('gets all latest snapshots', () => {
      db.prepare('INSERT INTO entities (id) VALUES (?)').run('a1');
      db.prepare('INSERT INTO entities (id) VALUES (?)').run('a2');

      memStore.saveSnapshot('a1', { data: 'first' });
      memStore.saveSnapshot('a2', { data: 'second' });

      const all = memStore.getAllLatestSnapshots();
      expect(all.length).toBe(2);
    });

    it('returns null for missing snapshot', () => {
      expect(memStore.getLatestSnapshot('nonexistent')).toBeNull();
    });
  });
});
