import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { request } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rmSync, existsSync } from 'node:fs';
import { Store } from '../../src/store/db.js';
import { Engine } from '../../src/ecs/engine.js';
import { IngestPipeline } from '../../src/ingest/pipeline.js';
import { startWebServer } from '../../src/web/server.js';
import { mockLogger, mockProvider } from '../helpers.js';
import type { Server } from 'node:http';

function httpRequest(
  port: number,
  method: string,
  path: string,
  body?: string | Buffer,
  headers?: Record<string, string>,
): Promise<{ status: number; body: string; headers: Record<string, string> }> {
  return new Promise((resolve, reject) => {
    const req = request(
      { hostname: '127.0.0.1', port, method, path, headers },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          resolve({
            status: res.statusCode!,
            body: Buffer.concat(chunks).toString(),
            headers: res.headers as Record<string, string>,
          });
        });
      },
    );
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

describe('Web Server', () => {
  let store: Store;
  let engine: Engine;
  let server: Server;
  let uploadDir: string;
  let port: number;

  beforeEach(async () => {
    store = new Store(':memory:');
    const logger = mockLogger();
    const provider = mockProvider([]);
    engine = new Engine(store, provider, logger);
    uploadDir = join(tmpdir(), `chippr-test-web-${Date.now()}`);
    const pipeline = new IngestPipeline(engine, logger as any, uploadDir);

    // Use port 0 to get a random available port
    server = startWebServer({ port: 0, engine, pipeline, logger: logger as any });

    // Wait for server to start and get assigned port
    await new Promise<void>((resolve) => {
      server.on('listening', () => {
        port = (server.address() as { port: number }).port;
        resolve();
      });
    });
  });

  afterEach(async () => {
    store.close();
    if (existsSync(uploadDir)) {
      rmSync(uploadDir, { recursive: true, force: true });
    }
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('GET / serves HTML', async () => {
    const res = await httpRequest(port, 'GET', '/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
  });

  it('POST /api/objective creates entity and emits event', async () => {
    const res = await httpRequest(
      port,
      'POST',
      '/api/objective',
      JSON.stringify({ objective: 'Test objective' }),
      { 'Content-Type': 'application/json' },
    );

    expect(res.status).toBe(200);
    const data = JSON.parse(res.body);
    expect(data.entityId).toBeDefined();
    expect(data.objective).toBe('Test objective');
    expect(engine.entityExists(data.entityId)).toBe(true);
  });

  it('POST /api/objective rejects invalid JSON', async () => {
    const res = await httpRequest(
      port,
      'POST',
      '/api/objective',
      'not json',
      { 'Content-Type': 'application/json' },
    );
    expect(res.status).toBe(400);
  });

  it('POST /api/objective rejects missing objective field', async () => {
    const res = await httpRequest(
      port,
      'POST',
      '/api/objective',
      JSON.stringify({ other: 'field' }),
      { 'Content-Type': 'application/json' },
    );
    expect(res.status).toBe(400);
  });

  it('POST /api/upload rejects missing boundary', async () => {
    const res = await httpRequest(
      port,
      'POST',
      '/api/upload',
      'some data',
      { 'Content-Type': 'application/octet-stream' },
    );
    expect(res.status).toBe(400);
    expect(JSON.parse(res.body).error).toContain('boundary');
  });

  it('GET /api/events establishes SSE connection', async () => {
    // Just verify the headers, don't keep connection open
    const res = await new Promise<{ status: number; headers: Record<string, string> }>((resolve, reject) => {
      const req = request(
        { hostname: '127.0.0.1', port, method: 'GET', path: '/api/events' },
        (res) => {
          resolve({
            status: res.statusCode!,
            headers: res.headers as Record<string, string>,
          });
          res.destroy(); // Close immediately
        },
      );
      req.on('error', reject);
      req.end();
    });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('text/event-stream');
    expect(res.headers['cache-control']).toBe('no-cache');
  });

  it('GET /api/media returns media list', async () => {
    const res = await httpRequest(port, 'GET', '/api/media');
    expect(res.status).toBe(200);
    const data = JSON.parse(res.body);
    expect(data.media).toEqual([]);
  });

  it('GET /api/memory/search rejects missing query', async () => {
    const res = await httpRequest(port, 'GET', '/api/memory/search');
    expect(res.status).toBe(400);
    expect(JSON.parse(res.body).error).toContain('Missing q');
  });

  it('unknown routes return 404', async () => {
    const res = await httpRequest(port, 'GET', '/api/nonexistent');
    expect(res.status).toBe(404);
  });

  it('CORS headers are present', async () => {
    const res = await httpRequest(port, 'GET', '/api/media');
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });

  it('OPTIONS returns 204', async () => {
    const res = await httpRequest(port, 'OPTIONS', '/api/upload');
    expect(res.status).toBe(204);
  });
});
