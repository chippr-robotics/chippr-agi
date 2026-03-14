/** Text extraction from uploaded files. Minimal, dependency-free implementations. */

/** Extract text content from a buffer based on MIME type. */
export function extractText(buffer: Buffer, mimeType: string, filename: string): string {
  if (mimeType.startsWith('text/')) {
    return buffer.toString('utf-8');
  }

  if (mimeType === 'application/json') {
    return buffer.toString('utf-8');
  }

  if (mimeType === 'application/pdf') {
    return extractPdfText(buffer);
  }

  if (mimeType.startsWith('image/')) {
    // Images get described by metadata; actual vision analysis can be added via model provider
    return `[Image: ${filename}, type: ${mimeType}, size: ${buffer.length} bytes]`;
  }

  if (mimeType.startsWith('audio/') || mimeType.startsWith('video/')) {
    return `[Media: ${filename}, type: ${mimeType}, size: ${buffer.length} bytes]`;
  }

  // Fallback: try reading as text
  const text = buffer.toString('utf-8');
  const nullCount = (text.match(/\0/g) || []).length;
  if (nullCount / text.length < 0.01) {
    return text;
  }

  return `[Binary file: ${filename}, type: ${mimeType}, size: ${buffer.length} bytes]`;
}

/** Basic PDF text extraction — pulls text between stream markers. */
function extractPdfText(buffer: Buffer): string {
  const raw = buffer.toString('latin1');
  const textParts: string[] = [];

  // Extract text from PDF text objects (BT ... ET blocks)
  const btEtRegex = /BT\s([\s\S]*?)ET/g;
  let match;
  while ((match = btEtRegex.exec(raw)) !== null) {
    const block = match[1];
    // Extract strings in parentheses (PDF literal strings)
    const strRegex = /\(([^)]*)\)/g;
    let strMatch;
    while ((strMatch = strRegex.exec(block)) !== null) {
      const decoded = strMatch[1]
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\\\/g, '\\')
        .replace(/\\([()])/g, '$1');
      if (decoded.trim()) textParts.push(decoded);
    }
    // Extract hex strings <>
    const hexRegex = /<([0-9a-fA-F]+)>/g;
    let hexMatch;
    while ((hexMatch = hexRegex.exec(block)) !== null) {
      const hex = hexMatch[1];
      let decoded = '';
      for (let i = 0; i < hex.length; i += 2) {
        decoded += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16));
      }
      if (decoded.trim()) textParts.push(decoded);
    }
  }

  return textParts.join(' ').trim() || '[PDF: no extractable text found]';
}

/** Categorize a MIME type into a broad media category. */
export function mediaCategory(mimeType: string): 'text' | 'image' | 'document' | 'audio' | 'video' | 'other' {
  if (mimeType.startsWith('text/')) return 'text';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'application/pdf') return 'document';
  if (mimeType.includes('document') || mimeType.includes('sheet') || mimeType.includes('presentation')) return 'document';
  return 'other';
}
