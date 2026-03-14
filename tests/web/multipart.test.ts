import { describe, it, expect } from 'vitest';
import { parseMultipart } from '../../src/web/multipart.js';

function buildMultipart(boundary: string, parts: Array<{ name: string; filename?: string; contentType?: string; content: string | Buffer }>): Buffer {
  const chunks: Buffer[] = [];
  for (const part of parts) {
    chunks.push(Buffer.from(`--${boundary}\r\n`));
    let disposition = `Content-Disposition: form-data; name="${part.name}"`;
    if (part.filename) disposition += `; filename="${part.filename}"`;
    chunks.push(Buffer.from(disposition + '\r\n'));
    if (part.contentType) {
      chunks.push(Buffer.from(`Content-Type: ${part.contentType}\r\n`));
    }
    chunks.push(Buffer.from('\r\n'));
    chunks.push(Buffer.isBuffer(part.content) ? part.content : Buffer.from(part.content));
    chunks.push(Buffer.from('\r\n'));
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  return Buffer.concat(chunks);
}

describe('parseMultipart', () => {
  it('parses text fields', () => {
    const boundary = 'test-boundary-123';
    const body = buildMultipart(boundary, [
      { name: 'message', content: 'hello world' },
    ]);

    const result = parseMultipart(body, boundary);
    expect(result.fields).toHaveLength(1);
    expect(result.fields[0].name).toBe('message');
    expect(result.fields[0].value).toBe('hello world');
    expect(result.files).toHaveLength(0);
  });

  it('parses file uploads', () => {
    const boundary = 'boundary-456';
    const body = buildMultipart(boundary, [
      { name: 'file', filename: 'test.txt', contentType: 'text/plain', content: 'file content here' },
    ]);

    const result = parseMultipart(body, boundary);
    expect(result.files).toHaveLength(1);
    expect(result.files[0].fieldname).toBe('file');
    expect(result.files[0].filename).toBe('test.txt');
    expect(result.files[0].mimeType).toBe('text/plain');
    expect(result.files[0].buffer.toString()).toBe('file content here');
  });

  it('parses mixed fields and files', () => {
    const boundary = 'mix-boundary';
    const body = buildMultipart(boundary, [
      { name: 'description', content: 'my upload' },
      { name: 'files', filename: 'a.txt', contentType: 'text/plain', content: 'aaa' },
      { name: 'files', filename: 'b.png', contentType: 'image/png', content: 'bbb' },
    ]);

    const result = parseMultipart(body, boundary);
    expect(result.fields).toHaveLength(1);
    expect(result.files).toHaveLength(2);
    expect(result.files[0].filename).toBe('a.txt');
    expect(result.files[1].filename).toBe('b.png');
  });

  it('handles binary file content', () => {
    const boundary = 'bin-boundary';
    const binaryContent = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const body = buildMultipart(boundary, [
      { name: 'file', filename: 'image.png', contentType: 'image/png', content: binaryContent },
    ]);

    const result = parseMultipart(body, boundary);
    expect(result.files).toHaveLength(1);
    expect(Buffer.compare(result.files[0].buffer, binaryContent)).toBe(0);
  });
});
