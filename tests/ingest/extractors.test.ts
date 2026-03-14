import { describe, it, expect } from 'vitest';
import { extractText, mediaCategory } from '../../src/ingest/extractors.js';

describe('extractText', () => {
  it('extracts plain text from text files', () => {
    const buffer = Buffer.from('Hello, world!');
    expect(extractText(buffer, 'text/plain', 'test.txt')).toBe('Hello, world!');
  });

  it('extracts JSON as text', () => {
    const json = JSON.stringify({ key: 'value' });
    const buffer = Buffer.from(json);
    expect(extractText(buffer, 'application/json', 'data.json')).toBe(json);
  });

  it('returns image descriptor for images', () => {
    const result = extractText(Buffer.from('fake'), 'image/png', 'photo.png');
    expect(result).toContain('[Image: photo.png');
    expect(result).toContain('image/png');
  });

  it('returns media descriptor for audio/video', () => {
    const audio = extractText(Buffer.from('fake'), 'audio/mp3', 'song.mp3');
    expect(audio).toContain('[Media: song.mp3');

    const video = extractText(Buffer.from('fake'), 'video/mp4', 'clip.mp4');
    expect(video).toContain('[Media: clip.mp4');
  });

  it('tries text fallback for unknown types', () => {
    const buffer = Buffer.from('readable text content');
    expect(extractText(buffer, 'application/x-unknown', 'file.xyz')).toBe('readable text content');
  });

  it('handles binary files', () => {
    const buffer = Buffer.alloc(100);
    buffer.fill(0);
    const result = extractText(buffer, 'application/octet-stream', 'binary.bin');
    expect(result).toContain('[Binary file:');
  });
});

describe('mediaCategory', () => {
  it('categorizes text types', () => {
    expect(mediaCategory('text/plain')).toBe('text');
    expect(mediaCategory('text/html')).toBe('text');
    expect(mediaCategory('text/csv')).toBe('text');
  });

  it('categorizes image types', () => {
    expect(mediaCategory('image/png')).toBe('image');
    expect(mediaCategory('image/jpeg')).toBe('image');
  });

  it('categorizes audio types', () => {
    expect(mediaCategory('audio/mp3')).toBe('audio');
  });

  it('categorizes video types', () => {
    expect(mediaCategory('video/mp4')).toBe('video');
  });

  it('categorizes PDF as document', () => {
    expect(mediaCategory('application/pdf')).toBe('document');
  });

  it('categorizes office documents', () => {
    expect(mediaCategory('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe('document');
  });

  it('returns other for unknown types', () => {
    expect(mediaCategory('application/octet-stream')).toBe('other');
  });
});
