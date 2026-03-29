import type Database from 'better-sqlite3';
import type { EntityId } from '../ecs/types.js';
import { serializeEmbedding, deserializeEmbedding, cosineSimilarity } from '../model/embedding.js';

export interface SemanticEntry {
  id: string;
  entityId: string;
  content: string;
  category: string | null;
  score?: number;
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
}

export interface EpisodicEntry {
  id: string;
  entityId: string;
  episodeSummary: string;
  fullEpisode: string | null;
  noveltyScore: number | null;
  tickNumber: number | null;
  createdAt: number;
}

export interface ProceduralEntry {
  id: string;
  entityId: string;
  skillName: string;
  description: string | null;
  toolSequence: unknown[];
  successCount: number;
  failureCount: number;
  avgReward: number;
  source: string | null;
  createdAt: number;
  updatedAt: number;
}

/**
 * Query helpers for the OODA memory tables.
 */
export class MemoryStore {
  constructor(private db: Database.Database) {}

  // --- Semantic Memory ---

  addSemantic(entityId: EntityId, id: string, content: string, category?: string, embedding?: number[]): void {
    this.db
      .prepare(
        'INSERT OR REPLACE INTO semantic_memory (id, entity_id, content, category, embedding) VALUES (?, ?, ?, ?, ?)',
      )
      .run(id, entityId, content, category ?? null, embedding ? serializeEmbedding(embedding) : null);
  }

  searchSemantic(entityId: EntityId, queryEmbedding: number[], limit = 10): SemanticEntry[] {
    const rows = this.db
      .prepare(
        'SELECT id, entity_id, content, category, embedding, created_at, last_accessed, access_count FROM semantic_memory WHERE entity_id = ? AND embedding IS NOT NULL',
      )
      .all(entityId) as Array<{
      id: string;
      entity_id: string;
      content: string;
      category: string | null;
      embedding: Buffer;
      created_at: number;
      last_accessed: number;
      access_count: number;
    }>;

    const scored = rows.map((row) => ({
      id: row.id,
      entityId: row.entity_id,
      content: row.content,
      category: row.category,
      score: cosineSimilarity(queryEmbedding, deserializeEmbedding(row.embedding)),
      createdAt: row.created_at,
      lastAccessed: row.last_accessed,
      accessCount: row.access_count,
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }

  touchSemantic(id: string): void {
    this.db
      .prepare('UPDATE semantic_memory SET last_accessed = unixepoch(), access_count = access_count + 1 WHERE id = ?')
      .run(id);
  }

  // --- Episodic Memory ---

  addEpisodic(
    entityId: EntityId,
    id: string,
    summary: string,
    fullEpisode?: unknown,
    noveltyScore?: number,
    tickNumber?: number,
    embedding?: number[],
  ): void {
    this.db
      .prepare(
        'INSERT OR REPLACE INTO episodic_memory (id, entity_id, episode_summary, full_episode, novelty_score, tick_number, embedding) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .run(
        id,
        entityId,
        summary,
        fullEpisode ? JSON.stringify(fullEpisode) : null,
        noveltyScore ?? null,
        tickNumber ?? null,
        embedding ? serializeEmbedding(embedding) : null,
      );
  }

  getEpisodicByEntity(entityId: EntityId, limit = 20): EpisodicEntry[] {
    const rows = this.db
      .prepare(
        'SELECT id, entity_id, episode_summary, full_episode, novelty_score, tick_number, created_at FROM episodic_memory WHERE entity_id = ? ORDER BY created_at DESC, rowid DESC LIMIT ?',
      )
      .all(entityId, limit) as Array<{
      id: string;
      entity_id: string;
      episode_summary: string;
      full_episode: string | null;
      novelty_score: number | null;
      tick_number: number | null;
      created_at: number;
    }>;

    return rows.map((r) => ({
      id: r.id,
      entityId: r.entity_id,
      episodeSummary: r.episode_summary,
      fullEpisode: r.full_episode,
      noveltyScore: r.novelty_score,
      tickNumber: r.tick_number,
      createdAt: r.created_at,
    }));
  }

  searchEpisodic(entityId: EntityId, queryEmbedding: number[], limit = 10): (EpisodicEntry & { score: number })[] {
    const rows = this.db
      .prepare(
        'SELECT id, entity_id, episode_summary, full_episode, novelty_score, tick_number, embedding, created_at FROM episodic_memory WHERE entity_id = ? AND embedding IS NOT NULL',
      )
      .all(entityId) as Array<{
      id: string;
      entity_id: string;
      episode_summary: string;
      full_episode: string | null;
      novelty_score: number | null;
      tick_number: number | null;
      embedding: Buffer;
      created_at: number;
    }>;

    const scored = rows.map((r) => ({
      id: r.id,
      entityId: r.entity_id,
      episodeSummary: r.episode_summary,
      fullEpisode: r.full_episode,
      noveltyScore: r.novelty_score,
      tickNumber: r.tick_number,
      createdAt: r.created_at,
      score: cosineSimilarity(queryEmbedding, deserializeEmbedding(r.embedding)),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }

  // --- Procedural Memory ---

  addProcedural(
    entityId: EntityId,
    id: string,
    skillName: string,
    description?: string,
    toolSequence?: unknown[],
    source?: string,
  ): void {
    this.db
      .prepare(
        'INSERT OR REPLACE INTO procedural_memory (id, entity_id, skill_name, description, tool_sequence, source) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(id, entityId, skillName, description ?? null, toolSequence ? JSON.stringify(toolSequence) : null, source ?? null);
  }

  getProceduralByEntity(entityId: EntityId): ProceduralEntry[] {
    const rows = this.db
      .prepare(
        'SELECT id, entity_id, skill_name, description, tool_sequence, success_count, failure_count, avg_reward, source, created_at, updated_at FROM procedural_memory WHERE entity_id = ? ORDER BY avg_reward DESC',
      )
      .all(entityId) as Array<{
      id: string;
      entity_id: string;
      skill_name: string;
      description: string | null;
      tool_sequence: string | null;
      success_count: number;
      failure_count: number;
      avg_reward: number;
      source: string | null;
      created_at: number;
      updated_at: number;
    }>;

    return rows.map((r) => ({
      id: r.id,
      entityId: r.entity_id,
      skillName: r.skill_name,
      description: r.description,
      toolSequence: r.tool_sequence ? JSON.parse(r.tool_sequence) : [],
      successCount: r.success_count,
      failureCount: r.failure_count,
      avgReward: r.avg_reward,
      source: r.source,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  updateProceduralStats(id: string, success: boolean, reward: number): void {
    const row = this.db
      .prepare('SELECT success_count, failure_count, avg_reward FROM procedural_memory WHERE id = ?')
      .get(id) as { success_count: number; failure_count: number; avg_reward: number } | undefined;

    if (!row) return;

    const alpha = 0.3; // EMA smoothing factor
    const newAvgReward = row.avg_reward * (1 - alpha) + reward * alpha;

    if (success) {
      this.db
        .prepare('UPDATE procedural_memory SET success_count = success_count + 1, avg_reward = ?, updated_at = unixepoch() WHERE id = ?')
        .run(newAvgReward, id);
    } else {
      this.db
        .prepare('UPDATE procedural_memory SET failure_count = failure_count + 1, avg_reward = ?, updated_at = unixepoch() WHERE id = ?')
        .run(newAvgReward, id);
    }
  }

  getProceduralById(id: string): ProceduralEntry | null {
    const row = this.db
      .prepare(
        'SELECT id, entity_id, skill_name, description, tool_sequence, success_count, failure_count, avg_reward, source, created_at, updated_at FROM procedural_memory WHERE id = ?',
      )
      .get(id) as {
      id: string;
      entity_id: string;
      skill_name: string;
      description: string | null;
      tool_sequence: string | null;
      success_count: number;
      failure_count: number;
      avg_reward: number;
      source: string | null;
      created_at: number;
      updated_at: number;
    } | undefined;

    if (!row) return null;

    return {
      id: row.id,
      entityId: row.entity_id,
      skillName: row.skill_name,
      description: row.description,
      toolSequence: row.tool_sequence ? JSON.parse(row.tool_sequence) : [],
      successCount: row.success_count,
      failureCount: row.failure_count,
      avgReward: row.avg_reward,
      source: row.source,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  getProceduralByName(entityId: EntityId, skillName: string): ProceduralEntry | null {
    const row = this.db
      .prepare(
        'SELECT id, entity_id, skill_name, description, tool_sequence, success_count, failure_count, avg_reward, source, created_at, updated_at FROM procedural_memory WHERE entity_id = ? AND skill_name = ?',
      )
      .get(entityId, skillName) as {
      id: string;
      entity_id: string;
      skill_name: string;
      description: string | null;
      tool_sequence: string | null;
      success_count: number;
      failure_count: number;
      avg_reward: number;
      source: string | null;
      created_at: number;
      updated_at: number;
    } | undefined;

    if (!row) return null;

    return {
      id: row.id,
      entityId: row.entity_id,
      skillName: row.skill_name,
      description: row.description,
      toolSequence: row.tool_sequence ? JSON.parse(row.tool_sequence) : [],
      successCount: row.success_count,
      failureCount: row.failure_count,
      avgReward: row.avg_reward,
      source: row.source,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // --- Entity Snapshots ---

  saveSnapshot(entityId: EntityId, components: Record<string, unknown>, timestamp?: number): void {
    this.db
      .prepare('INSERT OR REPLACE INTO entity_snapshots (entity_id, snapshot_time, components) VALUES (?, ?, ?)')
      .run(entityId, timestamp ?? Date.now(), JSON.stringify(components));
  }

  getLatestSnapshot(entityId: EntityId): { components: Record<string, unknown>; snapshotTime: number } | null {
    const row = this.db
      .prepare('SELECT components, snapshot_time FROM entity_snapshots WHERE entity_id = ? ORDER BY snapshot_time DESC LIMIT 1')
      .get(entityId) as { components: string; snapshot_time: number } | undefined;

    return row ? { components: JSON.parse(row.components), snapshotTime: row.snapshot_time } : null;
  }

  getAllLatestSnapshots(): Array<{ entityId: string; components: Record<string, unknown>; snapshotTime: number }> {
    const rows = this.db
      .prepare(
        `SELECT es.entity_id, es.components, es.snapshot_time
         FROM entity_snapshots es
         INNER JOIN (SELECT entity_id, MAX(snapshot_time) as max_time FROM entity_snapshots GROUP BY entity_id) latest
         ON es.entity_id = latest.entity_id AND es.snapshot_time = latest.max_time`,
      )
      .all() as Array<{ entity_id: string; components: string; snapshot_time: number }>;

    return rows.map((r) => ({
      entityId: r.entity_id,
      components: JSON.parse(r.components),
      snapshotTime: r.snapshot_time,
    }));
  }
}
