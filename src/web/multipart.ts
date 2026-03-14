/** Minimal multipart/form-data parser. No external dependencies. */

export interface ParsedFile {
  fieldname: string;
  filename: string;
  mimeType: string;
  buffer: Buffer;
}

export interface ParsedField {
  name: string;
  value: string;
}

export interface ParsedMultipart {
  files: ParsedFile[];
  fields: ParsedField[];
}

export function parseMultipart(body: Buffer, boundary: string): ParsedMultipart {
  const files: ParsedFile[] = [];
  const fields: ParsedField[] = [];
  const boundaryBuf = Buffer.from(`--${boundary}`);

  // Split on boundary
  const parts = splitBuffer(body, boundaryBuf);

  for (const part of parts) {
    // Skip preamble and closing boundary
    const str = part.toString('utf-8', 0, Math.min(part.length, 512));
    if (!str.includes('Content-Disposition')) continue;

    // Find header/body split (double CRLF)
    const headerEnd = findDoubleCRLF(part);
    if (headerEnd === -1) continue;

    const headers = part.toString('utf-8', 0, headerEnd);
    const content = part.subarray(headerEnd + 4);

    // Trim trailing \r\n
    const trimmed = content.length >= 2 && content[content.length - 2] === 0x0d && content[content.length - 1] === 0x0a
      ? content.subarray(0, content.length - 2)
      : content;

    const nameMatch = headers.match(/name="([^"]+)"/);
    if (!nameMatch) continue;

    const filenameMatch = headers.match(/filename="([^"]+)"/);
    if (filenameMatch) {
      const contentTypeMatch = headers.match(/Content-Type:\s*(.+)/i);
      files.push({
        fieldname: nameMatch[1],
        filename: filenameMatch[1],
        mimeType: contentTypeMatch?.[1]?.trim() ?? 'application/octet-stream',
        buffer: Buffer.from(trimmed),
      });
    } else {
      fields.push({
        name: nameMatch[1],
        value: trimmed.toString('utf-8'),
      });
    }
  }

  return { files, fields };
}

function splitBuffer(buf: Buffer, delimiter: Buffer): Buffer[] {
  const parts: Buffer[] = [];
  let start = 0;

  while (start < buf.length) {
    const idx = buf.indexOf(delimiter, start);
    if (idx === -1) {
      parts.push(buf.subarray(start));
      break;
    }
    if (idx > start) {
      parts.push(buf.subarray(start, idx));
    }
    start = idx + delimiter.length;
  }

  return parts;
}

function findDoubleCRLF(buf: Buffer): number {
  for (let i = 0; i < buf.length - 3; i++) {
    if (buf[i] === 0x0d && buf[i + 1] === 0x0a && buf[i + 2] === 0x0d && buf[i + 3] === 0x0a) {
      return i;
    }
  }
  return -1;
}
