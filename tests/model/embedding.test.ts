import { describe, it, expect } from 'vitest';
import {
  serializeEmbedding,
  deserializeEmbedding,
  cosineSimilarity,
} from '../../src/model/embedding.js';

describe('embedding utilities', () => {
  describe('serializeEmbedding / deserializeEmbedding', () => {
    it('round-trips a vector', () => {
      const vec = [0.1, -0.5, 0.0, 1.0, -1.0, 0.123456789];
      const buf = serializeEmbedding(vec);
      const result = deserializeEmbedding(buf);
      expect(result).toHaveLength(vec.length);
      for (let i = 0; i < vec.length; i++) {
        expect(result[i]).toBeCloseTo(vec[i], 10);
      }
    });

    it('handles empty vector', () => {
      const buf = serializeEmbedding([]);
      expect(buf.length).toBe(0);
      expect(deserializeEmbedding(buf)).toEqual([]);
    });
  });

  describe('cosineSimilarity', () => {
    it('returns 1 for identical vectors', () => {
      const v = [1, 2, 3];
      expect(cosineSimilarity(v, v)).toBeCloseTo(1, 10);
    });

    it('returns -1 for opposite vectors', () => {
      const a = [1, 0, 0];
      const b = [-1, 0, 0];
      expect(cosineSimilarity(a, b)).toBeCloseTo(-1, 10);
    });

    it('returns 0 for orthogonal vectors', () => {
      const a = [1, 0];
      const b = [0, 1];
      expect(cosineSimilarity(a, b)).toBeCloseTo(0, 10);
    });

    it('returns 0 for zero vector', () => {
      const a = [0, 0, 0];
      const b = [1, 2, 3];
      expect(cosineSimilarity(a, b)).toBe(0);
    });

    it('is magnitude-independent', () => {
      const a = [1, 2, 3];
      const b = [2, 4, 6];
      expect(cosineSimilarity(a, b)).toBeCloseTo(1, 10);
    });
  });
});
