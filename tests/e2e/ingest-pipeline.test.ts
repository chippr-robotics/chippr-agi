import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rmSync, existsSync } from 'node:fs';
import { Store } from '../../src/store/db.js';
import { Engine } from '../../src/ecs/engine.js';
import { IngestPipeline } from '../../src/ingest/pipeline.js';
import { mockLogger, mockProvider, collectEvents } from '../helpers.js';

describe('Ingest Pipeline E2E', () => {
  let store: Store;
  let engine: Engine;
  let pipeline: IngestPipeline;
  let uploadDir: string;

  beforeEach(() => {
    store = new Store(':memory:');
    const logger = mockLogger();
    const provider = mockProvider([]);
    engine = new Engine(store, provider, logger);
    uploadDir = join(tmpdir(), `chippr-e2e-ingest-${Date.now()}`);
    pipeline = new IngestPipeline(engine, logger as any, uploadDir);
  });

  afterEach(() => {
    store.close();
    if (existsSync(uploadDir)) {
      rmSync(uploadDir, { recursive: true, force: true });
    }
  });

  it('ingests a text file and creates entity with components', async () => {
    const events = collectEvents(engine);

    const result = await pipeline.ingest({
      filename: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Hello, world!'),
      source: 'test',
    });

    expect(result.mediaId).toBeDefined();
    expect(result.entityId).toBeDefined();
    expect(result.category).toBe('text');
    expect(result.extractedText).toContain('Hello, world!');

    // Verify entity exists
    expect(engine.entityExists(result.entityId)).toBe(true);

    // Verify events were emitted
    expect(events.some((e) => e.type === 'media:ingested')).toBe(true);
  });

  it('stores memory record for ingested file', async () => {
    const result = await pipeline.ingest({
      filename: 'doc.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Important document content'),
      source: 'test',
      contextId: 'ctx-1',
    });

    // Memory should be stored with context
    const memory = store.getMemory('ctx-1');
    expect(memory.length).toBeGreaterThan(0);
  });

  it('batch upload creates multiple entities', async () => {
    const results = await pipeline.ingestBatch([
      {
        filename: 'file1.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('File 1 content'),
        source: 'test',
      },
      {
        filename: 'file2.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('File 2 content'),
        source: 'test',
      },
    ]);

    expect(results.length).toBe(2);
    expect(engine.entityExists(results[0].entityId)).toBe(true);
    expect(engine.entityExists(results[1].entityId)).toBe(true);

    // Verify they're different entities
    expect(results[0].entityId).not.toBe(results[1].entityId);
  });

  it('emits entity:needs-routing when message is included', async () => {
    const events = collectEvents(engine, 'entity:needs-routing');

    await pipeline.ingest({
      filename: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('content'),
      source: 'test',
      message: 'Analyze this file',
    });

    expect(events.some((e) => e.type === 'entity:needs-routing')).toBe(true);
  });
});
