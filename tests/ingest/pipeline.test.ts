import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Store } from '../../src/store/db.js';
import { Engine } from '../../src/ecs/engine.js';
import { IngestPipeline } from '../../src/ingest/pipeline.js';
import type { ModelProvider } from '../../src/model/types.js';
import { createLogger } from '../../src/util/logger.js';

function createTestEngine(): { engine: Engine; store: Store } {
  const store = new Store(':memory:');
  const provider: ModelProvider = {
    complete: async () => 'mock response',
    completeWithTools: async () => ({ content: 'mock', toolCalls: [] }),
  };
  const logger = createLogger({ LOG_LEVEL: 'error' });
  const engine = new Engine(store, provider, logger);
  return { engine, store };
}

describe('IngestPipeline', () => {
  let engine: Engine;
  let store: Store;
  let pipeline: IngestPipeline;
  let uploadDir: string;

  beforeEach(() => {
    ({ engine, store } = createTestEngine());
    uploadDir = join(tmpdir(), `chippr-test-uploads-${Date.now()}`);
    const logger = createLogger({ LOG_LEVEL: 'error' });
    pipeline = new IngestPipeline(engine, logger, uploadDir);
  });

  afterEach(async () => {
    store.close();
    if (existsSync(uploadDir)) {
      await rm(uploadDir, { recursive: true });
    }
  });

  it('ingests a text file and stores to disk', async () => {
    const result = await pipeline.ingest({
      filename: 'hello.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Hello world'),
      source: 'test',
    });

    expect(result.mediaId).toBeDefined();
    expect(result.entityId).toBeDefined();
    expect(result.category).toBe('text');
    expect(result.extractedText).toBe('Hello world');
    expect(existsSync(result.storagePath)).toBe(true);
  });

  it('creates ECS entity with MediaUpload component', async () => {
    const result = await pipeline.ingest({
      filename: 'doc.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('fake pdf content'),
      source: 'web',
    });

    const component = engine.getComponent(result.entityId, 'MediaUpload');
    expect(component).toBeDefined();
    expect(component!.filename).toBe('doc.pdf');
    expect(component!.mimeType).toBe('application/pdf');
    expect(component!.source).toBe('web');
    expect(component!.category).toBe('document');
  });

  it('persists media record in database', async () => {
    const result = await pipeline.ingest({
      filename: 'image.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake png'),
      source: 'telegram',
      contextId: 'ctx-123',
    });

    const media = store.getMedia(result.mediaId);
    expect(media).toBeDefined();
    expect(media!.filename).toBe('image.png');
    expect(media!.mime_type).toBe('image/png');
    expect(media!.source).toBe('telegram');
    expect(media!.context_id).toBe('ctx-123');
  });

  it('stores memory for embedding search', async () => {
    await pipeline.ingest({
      filename: 'notes.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Important meeting notes about project alpha'),
      source: 'web',
      contextId: 'ctx-abc',
    });

    const memory = store.getMemory('ctx-abc');
    expect(memory).toHaveLength(1);
    expect(memory[0].content).toContain('Important meeting notes');
    expect(memory[0].role).toBe('document');
  });

  it('emits media:ingested event', async () => {
    const events: Array<{ type: string; data: Record<string, unknown> }> = [];
    engine.on('media:ingested', (e) => events.push(e));

    await pipeline.ingest({
      filename: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('test'),
      source: 'signal',
    });

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('media:ingested');
    expect(events[0].data.source).toBe('signal');
  });

  it('routes entity when message is provided', async () => {
    const events: Array<{ type: string }> = [];
    engine.on('entity:needs-routing', (e) => events.push(e));

    await pipeline.ingest({
      filename: 'photo.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake jpeg'),
      source: 'web',
      message: 'Analyze this photo',
    });

    expect(events).toHaveLength(1);
  });

  it('handles batch ingestion', async () => {
    const results = await pipeline.ingestBatch([
      { filename: 'a.txt', mimeType: 'text/plain', buffer: Buffer.from('aaa'), source: 'web' },
      { filename: 'b.txt', mimeType: 'text/plain', buffer: Buffer.from('bbb'), source: 'web' },
    ]);

    expect(results).toHaveLength(2);
    expect(results[0].mediaId).not.toBe(results[1].mediaId);
  });

  it('retrieves media by context', async () => {
    await pipeline.ingest({
      filename: 'ctx-file.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('content'),
      source: 'web',
      contextId: 'group-1',
    });

    const media = store.getMediaByContext('group-1');
    expect(media).toHaveLength(1);
    expect(media[0].filename).toBe('ctx-file.txt');
  });
});
