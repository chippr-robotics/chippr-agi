import { describe, it, expect } from 'vitest';
import { entityId, uniqueId } from '../../src/util/hash.js';

describe('entityId', () => {
  it('returns a 16-character hex string', () => {
    const id = entityId('test-input');
    expect(id).toMatch(/^[0-9a-f]{16}$/);
  });

  it('is deterministic for the same input', () => {
    expect(entityId('hello')).toBe(entityId('hello'));
  });

  it('produces different output for different input', () => {
    expect(entityId('a')).not.toBe(entityId('b'));
  });
});

describe('uniqueId', () => {
  it('returns a 16-character hex string', () => {
    expect(uniqueId()).toMatch(/^[0-9a-f]{16}$/);
  });

  it('returns unique values on successive calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => uniqueId()));
    expect(ids.size).toBe(100);
  });
});
