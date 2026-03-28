import { describe, it, expect, vi, afterEach } from 'vitest';
import { LocalProvider } from '../../src/model/local.js';

describe('LocalProvider', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function mockFetch(body: unknown, status = 200) {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
      text: async () => JSON.stringify(body),
    });
  }

  it('sends correct request body', async () => {
    mockFetch({ choices: [{ message: { content: 'hi' } }] });
    const provider = new LocalProvider('http://localhost:1234/v1', 'test-model');
    await provider.generate([{ role: 'user', content: 'hello' }]);

    const [url, opts] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('http://localhost:1234/v1/chat/completions');
    const body = JSON.parse(opts.body);
    expect(body.model).toBe('test-model');
    expect(body.messages).toEqual([{ role: 'user', content: 'hello' }]);
  });

  it('includes tools in OpenAI format', async () => {
    mockFetch({ choices: [{ message: { content: '' } }] });
    const provider = new LocalProvider();
    await provider.generate(
      [{ role: 'user', content: 'test' }],
      [{ name: 'myTool', description: 'desc', inputSchema: { type: 'object' } }],
    );

    const body = JSON.parse((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.tools).toEqual([
      {
        type: 'function',
        function: { name: 'myTool', description: 'desc', parameters: { type: 'object' } },
      },
    ]);
  });

  it('parses choices[0] response', async () => {
    mockFetch({
      choices: [{ message: { content: 'result text' } }],
      usage: { prompt_tokens: 5, completion_tokens: 10 },
    });
    const provider = new LocalProvider();
    const response = await provider.generate([{ role: 'user', content: 'test' }]);
    expect(response.content).toBe('result text');
    expect(response.usage).toEqual({ inputTokens: 5, outputTokens: 10 });
  });

  it('returns empty content when no choices', async () => {
    mockFetch({ choices: [] });
    const provider = new LocalProvider();
    const response = await provider.generate([{ role: 'user', content: 'test' }]);
    expect(response.content).toBe('');
    expect(response.toolCalls).toBeUndefined();
  });

  it('parses tool_calls from response', async () => {
    mockFetch({
      choices: [{
        message: {
          content: null,
          tool_calls: [{
            id: 'tc-1',
            function: { name: 'myTool', arguments: '{"x":1}' },
          }],
        },
      }],
    });
    const provider = new LocalProvider();
    const response = await provider.generate([{ role: 'user', content: 'test' }]);
    expect(response.toolCalls).toEqual([
      { id: 'tc-1', name: 'myTool', input: { x: 1 } },
    ]);
  });

  it('throws on non-OK response', async () => {
    mockFetch({ error: 'not found' }, 404);
    const provider = new LocalProvider();
    await expect(provider.generate([{ role: 'user', content: 'hi' }])).rejects.toThrow(
      'Local model API error 404',
    );
  });

  describe('agentLoop', () => {
    it('yields done when no tool calls', async () => {
      mockFetch({ choices: [{ message: { content: 'answer' } }] });
      const provider = new LocalProvider();

      const events = [];
      for await (const event of provider.agentLoop('prompt', [], vi.fn())) {
        events.push(event);
      }

      expect(events.map((e) => e.type)).toEqual(['text', 'done']);
    });
  });
});
