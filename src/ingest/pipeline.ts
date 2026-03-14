/**
 * Shared ingestion pipeline for processing uploaded files.
 *
 * This is the single pipeline that all interfaces (web, Telegram, Signal, etc.)
 * use to process incoming media. It handles:
 *   1. File storage to disk
 *   2. Text extraction
 *   3. Embedding generation and memory storage
 *   4. Entity creation in the ECS engine
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { extractText, mediaCategory } from './extractors.js';
import type { Engine } from '../ecs/engine.js';
import type { Logger } from '../util/logger.js';
import { uniqueId } from '../util/hash.js';

export interface IngestInput {
  /** Original filename. */
  filename: string;
  /** MIME type (e.g. 'image/png', 'application/pdf'). */
  mimeType: string;
  /** Raw file contents. */
  buffer: Buffer;
  /** Which interface submitted this (e.g. 'web', 'telegram', 'signal'). */
  source: string;
  /** Optional context/conversation ID for grouping. */
  contextId?: string;
  /** Optional text message accompanying the upload. */
  message?: string;
}

export interface IngestResult {
  mediaId: string;
  entityId: string;
  extractedText: string;
  category: ReturnType<typeof mediaCategory>;
  storagePath: string;
}

export class IngestPipeline {
  private readonly uploadDir: string;

  constructor(
    private engine: Engine,
    private logger: Logger,
    uploadDir: string,
  ) {
    this.uploadDir = uploadDir;
  }

  /** Process a single file upload through the full pipeline. */
  async ingest(input: IngestInput): Promise<IngestResult> {
    const mediaId = uniqueId();
    const category = mediaCategory(input.mimeType);
    const contextId = input.contextId ?? `upload-${mediaId}`;

    this.logger.info(
      { mediaId, filename: input.filename, mimeType: input.mimeType, source: input.source, size: input.buffer.length },
      'Ingesting file',
    );

    // 1. Store file to disk
    const storagePath = await this.storeFile(mediaId, input.filename, input.buffer);

    // 2. Extract text content
    const extractedText = extractText(input.buffer, input.mimeType, input.filename);

    // 3. Create ECS entity
    const entityId = this.engine.createEntity();
    this.engine.addComponent(entityId, 'MediaUpload', {
      mediaId,
      filename: input.filename,
      mimeType: input.mimeType,
      size: input.buffer.length,
      category,
      source: input.source,
      storagePath,
    });

    if (input.message) {
      this.engine.addComponent(entityId, 'ObjectiveDescription', {
        objective: input.message,
      });
    }

    // 4. Persist media record
    const store = this.engine.getStore();
    store.addMedia({
      id: mediaId,
      entityId,
      filename: input.filename,
      mimeType: input.mimeType,
      size: input.buffer.length,
      source: input.source,
      contextId,
      extractedText,
      storagePath,
    });

    // 5. Embed extracted text into memory for semantic search
    const memoryContent = this.buildMemoryContent(input, extractedText, category);
    await store.addMemoryEmbedded(contextId, 'document', memoryContent);

    // 6. Emit event for other systems to react
    this.engine.emit({
      type: 'media:ingested',
      entityId,
      data: { mediaId, filename: input.filename, category, source: input.source, contextId },
      source: input.source,
      timestamp: Date.now(),
    });

    // 7. If there's a message, route the entity for processing
    if (input.message) {
      this.engine.addComponent(entityId, 'TaskDescription', {
        task: input.message,
        complete: false,
      });
      this.engine.emit({
        type: 'entity:needs-routing',
        entityId,
        data: { objective: input.message, mediaId, hasAttachment: true },
        source: input.source,
        timestamp: Date.now(),
      });
    }

    this.logger.info({ mediaId, entityId, category, extractedTextLength: extractedText.length }, 'File ingested');

    return { mediaId, entityId, extractedText, category, storagePath };
  }

  /** Process multiple files in a single batch. */
  async ingestBatch(inputs: IngestInput[]): Promise<IngestResult[]> {
    return Promise.all(inputs.map((input) => this.ingest(input)));
  }

  private async storeFile(mediaId: string, filename: string, buffer: Buffer): Promise<string> {
    // Organize by date: uploads/2026/03/14/<mediaId>-<filename>
    const now = new Date();
    const dir = join(
      this.uploadDir,
      String(now.getFullYear()),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    );
    await mkdir(dir, { recursive: true });

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = join(dir, `${mediaId}-${safeName}`);
    await writeFile(storagePath, buffer);
    return storagePath;
  }

  private buildMemoryContent(
    input: IngestInput,
    extractedText: string,
    category: string,
  ): string {
    const parts = [
      `[Uploaded ${category}: ${input.filename}]`,
      `Source: ${input.source}`,
      `Type: ${input.mimeType}`,
      `Size: ${input.buffer.length} bytes`,
    ];

    if (input.message) {
      parts.push(`User message: ${input.message}`);
    }

    parts.push(`Content: ${extractedText}`);
    return parts.join('\n');
  }
}
