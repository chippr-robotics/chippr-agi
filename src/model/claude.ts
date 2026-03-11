import type {
  ModelProvider,
  ModelMessage,
  ModelResponse,
  ToolDefinition,
  ToolCall,
  ToolExecutor,
  AgentEvent,
} from './types.js';

/**
 * Claude provider via the Anthropic API.
 * Uses the Messages API directly (claude-agent-sdk integration planned).
 */
export class ClaudeProvider implements ModelProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor(
    private model: string = 'claude-sonnet-4-20250514',
    options?: { apiKey?: string; baseUrl?: string },
  ) {
    this.apiKey = options?.apiKey ?? process.env.ANTHROPIC_API_KEY ?? '';
    this.baseUrl = options?.baseUrl ?? 'https://api.anthropic.com';
  }

  async generate(messages: ModelMessage[], tools?: ToolDefinition[]): Promise<ModelResponse> {
    const systemMsg = messages.find((m) => m.role === 'system');
    const nonSystemMsgs = messages.filter((m) => m.role !== 'system');

    const body: Record<string, unknown> = {
      model: this.model,
      max_tokens: 4096,
      messages: nonSystemMsgs.map((m) => ({ role: m.role, content: m.content })),
    };

    if (systemMsg) {
      body.system = systemMsg.content;
    }

    if (tools?.length) {
      body.tools = tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.inputSchema,
      }));
    }

    const res = await fetch(`${this.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Claude API error ${res.status}: ${text}`);
    }

    const data = (await res.json()) as {
      content: Array<{ type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> }>;
      usage?: { input_tokens: number; output_tokens: number };
    };

    let content = '';
    const toolCalls: ToolCall[] = [];

    for (const block of data.content) {
      if (block.type === 'text' && block.text) {
        content += block.text;
      } else if (block.type === 'tool_use' && block.id && block.name) {
        toolCalls.push({
          id: block.id,
          name: block.name,
          input: block.input ?? {},
        });
      }
    }

    return {
      content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: data.usage
        ? { inputTokens: data.usage.input_tokens, outputTokens: data.usage.output_tokens }
        : undefined,
    };
  }

  async *agentLoop(
    prompt: string,
    tools: ToolDefinition[],
    executor: ToolExecutor,
  ): AsyncGenerator<AgentEvent> {
    const messages: Array<{ role: string; content: unknown }> = [
      { role: 'user', content: prompt },
    ];

    const maxIterations = 10;
    for (let i = 0; i < maxIterations; i++) {
      const response = await this.generate(
        messages.map((m) => ({
          role: m.role as ModelMessage['role'],
          content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
        })),
        tools,
      );

      if (response.content) {
        yield { type: 'text', data: response.content };
      }

      if (!response.toolCalls?.length) {
        yield { type: 'done', data: response.content };
        return;
      }

      for (const call of response.toolCalls) {
        yield { type: 'tool_call', data: call };
        const result = await executor(call);
        yield { type: 'tool_result', data: result };

        messages.push({
          role: 'assistant',
          content: [
            { type: 'tool_use', id: call.id, name: call.name, input: call.input },
          ],
        });
        messages.push({
          role: 'user',
          content: [
            { type: 'tool_result', tool_use_id: call.id, content: result.content },
          ],
        });
      }
    }

    yield { type: 'done', data: 'Max iterations reached' };
  }
}
