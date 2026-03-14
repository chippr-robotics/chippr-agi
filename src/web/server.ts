/**
 * Web server for chippr-agi. Provides:
 *   - GET /           → Frontend UI
 *   - POST /api/upload → File upload (multipart/form-data)
 *   - POST /api/objective → Submit text objective
 *   - GET /api/events → Recent events (SSE stream)
 *   - GET /api/media  → List uploaded media
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMultipart } from './multipart.js';
import type { IngestPipeline } from '../ingest/pipeline.js';
import type { Engine } from '../ecs/engine.js';
import type { Logger } from '../util/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MAX_UPLOAD_SIZE = 50 * 1024 * 1024; // 50 MB

export interface WebServerConfig {
  port: number;
  engine: Engine;
  pipeline: IngestPipeline;
  logger: Logger;
}

export function startWebServer(config: WebServerConfig): ReturnType<typeof createServer> {
  const { port, engine, pipeline, logger } = config;

  // SSE clients for live event streaming
  const sseClients = new Set<ServerResponse>();

  // Forward ECS events to all SSE clients
  engine.on('*', (event) => {
    const data = JSON.stringify(event);
    for (const client of sseClients) {
      client.write(`data: ${data}\n\n`);
    }
  });

  const server = createServer(async (req, res) => {
    try {
      await handleRequest(req, res, { engine, pipeline, logger, sseClients });
    } catch (err) {
      logger.error({ err, url: req.url }, 'Request error');
      sendJson(res, 500, { error: 'Internal server error' });
    }
  });

  server.listen(port, () => {
    logger.info({ port }, 'Web server listening');
  });

  return server;
}

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: {
    engine: Engine;
    pipeline: IngestPipeline;
    logger: Logger;
    sseClients: Set<ServerResponse>;
  },
): Promise<void> {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const path = url.pathname;

  // CORS headers for local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Routes
  if (path === '/' && req.method === 'GET') {
    return serveUI(res);
  }

  if (path === '/api/upload' && req.method === 'POST') {
    return handleUpload(req, res, ctx);
  }

  if (path === '/api/objective' && req.method === 'POST') {
    return handleObjective(req, res, ctx);
  }

  if (path === '/api/events' && req.method === 'GET') {
    return handleSSE(res, ctx.sseClients);
  }

  if (path === '/api/media' && req.method === 'GET') {
    return handleListMedia(res, ctx, url);
  }

  if (path === '/api/memory/search' && req.method === 'GET') {
    return handleMemorySearch(res, ctx, url);
  }

  sendJson(res, 404, { error: 'Not found' });
}

async function serveUI(res: ServerResponse): Promise<void> {
  const html = await readFile(join(__dirname, 'frontend.html'), 'utf-8');
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

async function handleUpload(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: { pipeline: IngestPipeline; logger: Logger },
): Promise<void> {
  const contentType = req.headers['content-type'] ?? '';
  const boundaryMatch = contentType.match(/boundary=(.+)/);
  if (!boundaryMatch) {
    sendJson(res, 400, { error: 'Missing multipart boundary' });
    return;
  }

  const body = await readBody(req, MAX_UPLOAD_SIZE);
  if (!body) {
    sendJson(res, 413, { error: `Upload exceeds ${MAX_UPLOAD_SIZE / 1024 / 1024}MB limit` });
    return;
  }

  const parsed = parseMultipart(body, boundaryMatch[1]);
  if (parsed.files.length === 0) {
    sendJson(res, 400, { error: 'No files in upload' });
    return;
  }

  const messageField = parsed.fields.find((f) => f.name === 'message');
  const contextField = parsed.fields.find((f) => f.name === 'contextId');

  const results = await ctx.pipeline.ingestBatch(
    parsed.files.map((file) => ({
      filename: file.filename,
      mimeType: file.mimeType,
      buffer: file.buffer,
      source: 'web',
      contextId: contextField?.value,
      message: messageField?.value,
    })),
  );

  sendJson(res, 200, {
    uploaded: results.map((r) => ({
      mediaId: r.mediaId,
      entityId: r.entityId,
      category: r.category,
      extractedTextPreview: r.extractedText.slice(0, 200),
    })),
  });
}

async function handleObjective(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: { engine: Engine },
): Promise<void> {
  const body = await readBody(req, 1024 * 1024);
  if (!body) {
    sendJson(res, 413, { error: 'Request too large' });
    return;
  }

  let data: { objective?: string };
  try {
    data = JSON.parse(body.toString('utf-8'));
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON' });
    return;
  }

  if (!data.objective || typeof data.objective !== 'string') {
    sendJson(res, 400, { error: 'Missing objective field' });
    return;
  }

  const { uniqueId } = await import('../util/hash.js');
  const entityId = uniqueId();
  ctx.engine.createEntity(entityId);
  ctx.engine.addComponent(entityId, 'ObjectiveDescription', { objective: data.objective });
  ctx.engine.addComponent(entityId, 'TaskDescription', { task: data.objective, complete: false });

  ctx.engine.emit({
    type: 'entity:needs-routing',
    entityId,
    data: { objective: data.objective },
    source: 'web',
    timestamp: Date.now(),
  });

  sendJson(res, 200, { entityId, objective: data.objective });
}

function handleSSE(res: ServerResponse, clients: Set<ServerResponse>): void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write(':\n\n'); // SSE comment to establish connection

  clients.add(res);
  res.on('close', () => clients.delete(res));
}

function handleListMedia(
  res: ServerResponse,
  ctx: { engine: Engine },
  url: URL,
): void {
  const contextId = url.searchParams.get('contextId');
  const store = ctx.engine.getStore();
  if (contextId) {
    const media = store.getMediaByContext(contextId);
    sendJson(res, 200, { media });
  } else {
    // Return recent media (last 50)
    const rows = store.db
      .prepare(
        'SELECT id, filename, mime_type, size, source, context_id, extracted_text, created_at FROM media ORDER BY created_at DESC LIMIT 50',
      )
      .all();
    sendJson(res, 200, { media: rows });
  }
}

async function handleMemorySearch(
  res: ServerResponse,
  ctx: { engine: Engine },
  url: URL,
): Promise<void> {
  const query = url.searchParams.get('q');
  if (!query) {
    sendJson(res, 400, { error: 'Missing q parameter' });
    return;
  }

  try {
    const results = await ctx.engine.getStore().searchMemory(query, 10);
    sendJson(res, 200, { results });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Search failed';
    sendJson(res, 500, { error: message });
  }
}

function readBody(req: IncomingMessage, maxSize: number): Promise<Buffer | null> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > maxSize) {
        req.destroy();
        resolve(null);
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', () => resolve(null));
  });
}

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(body);
}
