import { describe, it, expect, vi } from 'vitest';
import { ModelProviderRouter } from '../../src/model/router.js';
import type { ModelProvider, ModelResponse } from '../../src/model/types.js';

function createMockProvider(name: string, shouldFail = false): ModelProvider {
  return {
    async generate(): Promise<ModelResponse> {
      if (shouldFail) throw new Error(`${name} failed`);
      return { content: `response from ${name}` };
    },
    async embed(text: string): Promise<number[]> {
      return [1, 2, 3];
    },
  };
}

describe('ModelProviderRouter', () => {
  it('routes to primary provider by default', async () => {
    const primary = createMockProvider('primary');
    const fallback = createMockProvider('fallback');
    const router = new ModelProviderRouter(primary, fallback);

    const result = await router.generate([{ role: 'user', content: 'test' }]);
    expect(result.content).toBe('response from primary');
  });

  it('falls back to secondary on primary failure', async () => {
    const primary = createMockProvider('primary', true);
    const fallback = createMockProvider('fallback');
    const router = new ModelProviderRouter(primary, fallback);

    const result = await router.generate([{ role: 'user', content: 'test' }]);
    expect(result.content).toBe('response from fallback');
  });

  it('tracks request stats', async () => {
    const primary = createMockProvider('primary');
    const fallback = createMockProvider('fallback');
    const router = new ModelProviderRouter(primary, fallback);

    await router.generate([{ role: 'user', content: 'test' }]);
    await router.generate([{ role: 'user', content: 'test2' }]);

    const stats = router.getStats();
    expect(stats.primary.requests).toBe(2);
    expect(stats.primary.errors).toBe(0);
  });

  it('tracks error rate', async () => {
    const primary = createMockProvider('primary', true);
    const fallback = createMockProvider('fallback');
    const router = new ModelProviderRouter(primary, fallback);

    await router.generate([{ role: 'user', content: 'test' }]);

    expect(router.getErrorRate('primary')).toBe(1); // 1 error / 1 request
    expect(router.getStats().primary.requests).toBe(1);
    expect(router.getStats().primary.errors).toBe(1);
  });

  it('delegates embed to provider that supports it', async () => {
    const primary = createMockProvider('primary');
    const fallback = createMockProvider('fallback');
    const router = new ModelProviderRouter(primary, fallback);

    const result = await router.embed('test');
    expect(result).toEqual([1, 2, 3]);
  });

  it('throws when no provider supports embed', async () => {
    const primary: ModelProvider = { async generate() { return { content: '' }; } };
    const fallback: ModelProvider = { async generate() { return { content: '' }; } };
    const router = new ModelProviderRouter(primary, fallback);

    await expect(router.embed('test')).rejects.toThrow('No provider supports embed()');
  });
});
