import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { request } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rmSync, existsSync } from 'node:fs';
import { Store } from '../../src/store/db.js';
import { Engine } from '../../src/ecs/engine.js';
import { IngestPipeline } from '../../src/ingest/pipeline.js';
import { startWebServer } from '../../src/web/server.js';
import { mockLogger, mockProvider, collectEvents } from '../helpers.js';
import type { Server } from 'node:http';

function httpPost(
  port: number,
  path: string,
  body: string,
  headers: Record<string, string> = {},
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = request(
      {
        hostname: '127.0.0.1',
        port,
        method: 'POST',
        path,
        headers: { 'Content-Type': 'application/json', ...headers },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          resolve({
            status: res.statusCode!,
            body: Buffer.concat(chunks).toString(),
          });
        });
      },
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

describe('Web → Objective → SSE E2E', () => {
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
    uploadDir = join(tmpdir(), `chippr-e2e-web-${Date.now()}`);
    const pipeline = new IngestPipeline(engine, logger as any, uploadDir);

    server = startWebServer({ port: 0, engine, pipeline, logger: logger as any });
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

  it('POST /api/objective creates entity and emits events', async () => {
    const events = collectEvents(engine);

    const res = await httpPost(port, '/api/objective', JSON.stringify({
      objective: 'E2E test objective',
    }));

    expect(res.status).toBe(200);
    const data = JSON.parse(res.body);
    expect(data.entityId).toBeDefined();

    // Verify entity was created with correct components
    expect(engine.entityExists(data.entityId)).toBe(true);
    expect(engine.getComponent(data.entityId, 'ObjectiveDescription')).toEqual({
      objective: 'E2E test objective',
    });
    expect(engine.getComponent(data.entityId, 'TaskDescription')).toEqual({
      task: 'E2E test objective',
      complete: false,
    });

    // Verify event was emitted
    expect(events.some((e) => e.type === 'entity:needs-routing' && e.entityId === data.entityId)).toBe(true);
  });

  it('SSE client receives events', async () => {
    const receivedData: string[] = [];

    // Connect SSE client
    await new Promise<void>((resolve, reject) => {
      const req = request(
        { hostname: '127.0.0.1', port, method: 'GET', path: '/api/events' },
        (res) => {
          res.on('data', (chunk) => {
            receivedData.push(chunk.toString());
          });

          // Once SSE connection is established, submit an objective
          setTimeout(async () => {
            await httpPost(port, '/api/objective', JSON.stringify({
              objective: 'SSE test',
            }));

            // Give time for event to propagate
            setTimeout(() => {
              res.destroy();
              resolve();
            }, 100);
          }, 50);
        },
      );
      req.on('error', (err) => {
        // Ignore connection reset errors from destroying the response
        if ((err as any).code !== 'ECONNRESET') reject(err);
      });
      req.end();
    });

    // Verify we received SSE data containing the event
    const allData = receivedData.join('');
    expect(allData).toContain('entity:needs-routing');
  });

  it('SSE client cleanup on disconnect', async () => {
    // Connect and immediately disconnect
    await new Promise<void>((resolve) => {
      const req = request(
        { hostname: '127.0.0.1', port, method: 'GET', path: '/api/events' },
        (res) => {
          res.destroy();
          setTimeout(resolve, 50);
        },
      );
      req.on('error', () => {}); // Ignore errors
      req.end();
    });

    // After disconnect, submitting an objective should still work
    const res = await httpPost(port, '/api/objective', JSON.stringify({
      objective: 'After disconnect',
    }));
    expect(res.status).toBe(200);
  });
});
