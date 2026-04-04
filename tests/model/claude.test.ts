import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ClaudeProvider } from '../../src/model/claude.js';

describe('ClaudeProvider', () => {
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

  it('sends correct headers', async () => {
    mockFetch({ content: [{ type: 'text', text: 'hi' }] });
    const provider = new ClaudeProvider('test-model', { apiKey: 'sk-test' });
    await provider.generate([{ role: 'user', content: 'hello' }]);

    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const headers = call[1].headers;
    expect(headers['x-api-key']).toBe('sk-test');
    expect(headers['anthropic-version']).toBe('2023-06-01');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('builds correct request body with system message', async () => {
    mockFetch({ content: [{ type: 'text', text: 'ok' }] });
    const provider = new ClaudeProvider('claude-test');
    await provider.generate([
      { role: 'system', content: 'Be helpful' },
      { role: 'user', content: 'hello' },
    ]);

    const body = JSON.parse((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.model).toBe('claude-test');
    expect(body.system).toBe('Be helpful');
    expect(body.messages).toEqual([{ role: 'user', content: 'hello' }]);
    expect(body.max_tokens).toBe(4096);
  });

  it('includes tools in request when provided', async () => {
    mockFetch({ content: [{ type: 'text', text: '' }] });
    const provider = new ClaudeProvider('test-model', { apiKey: 'sk-test' });
    await provider.generate(
      [{ role: 'user', content: 'test' }],
      [{ name: 'myTool', description: 'does stuff', inputSchema: { type: 'object' } }],
    );

    const body = JSON.parse((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.tools).toEqual([
      { name: 'myTool', description: 'does stuff', input_schema: { type: 'object' } },
    ]);
  });

  it('parses text content blocks', async () => {
    mockFetch({
      content: [
        { type: 'text', text: 'Hello ' },
        { type: 'text', text: 'world' },
      ],
    });
    const provider = new ClaudeProvider('test-model', { apiKey: 'sk-test' });
    const response = await provider.generate([{ role: 'user', content: 'hi' }]);
    expect(response.content).toBe('Hello world');
  });

  it('parses tool_use content blocks into toolCalls', async () => {
    mockFetch({
      content: [
        {
          type: 'tool_use',
          id: 'call-1',
          name: 'myTool',
          input: { key: 'value' },
        },
      ],
    });
    const provider = new ClaudeProvider('test-model', { apiKey: 'sk-test' });
    const response = await provider.generate([{ role: 'user', content: 'test' }]);
    expect(response.toolCalls).toEqual([
      { id: 'call-1', name: 'myTool', input: { key: 'value' } },
    ]);
  });

  it('parses usage data', async () => {
    mockFetch({
      content: [{ type: 'text', text: 'ok' }],
      usage: { input_tokens: 10, output_tokens: 20 },
    });
    const provider = new ClaudeProvider('test-model', { apiKey: 'sk-test' });
    const response = await provider.generate([{ role: 'user', content: 'test' }]);
    expect(response.usage).toEqual({ inputTokens: 10, outputTokens: 20 });
  });

  it('throws on non-OK response', async () => {
    mockFetch({ error: 'bad request' }, 400);
    const provider = new ClaudeProvider('test-model', { apiKey: 'sk-test' });
    await expect(provider.generate([{ role: 'user', content: 'hi' }])).rejects.toThrow(
      'Claude API error 400',
    );
  });

  describe('agentLoop', () => {
    it('yields text and done events when no tool calls', async () => {
      mockFetch({ content: [{ type: 'text', text: 'result' }] });
      const provider = new ClaudeProvider('test-model', { apiKey: 'sk-test' });

      const events = [];
      for await (const event of provider.agentLoop('test prompt', [], vi.fn())) {
        events.push(event);
      }

      expect(events).toEqual([
        { type: 'text', data: 'result' },
        { type: 'done', data: 'result' },
      ]);
    });

    it('executes tools and yields tool events', async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              content: [
                { type: 'tool_use', id: 'c1', name: 'myTool', input: { x: 1 } },
              ],
            }),
          };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            content: [{ type: 'text', text: 'final' }],
          }),
        };
      });

      const executor = vi.fn().mockResolvedValue({ toolCallId: 'c1', content: 'tool-result' });
      const provider = new ClaudeProvider('test-model', { apiKey: 'sk-test' });

      const events = [];
      for await (const event of provider.agentLoop('test', [{ name: 'myTool', description: 'test', inputSchema: {} }], executor)) {
        events.push(event);
      }

      expect(events.map((e) => e.type)).toEqual([
        'tool_call', 'tool_result', 'text', 'done',
      ]);
      expect(executor).toHaveBeenCalledWith({ id: 'c1', name: 'myTool', input: { x: 1 } });
    });
  });
});
