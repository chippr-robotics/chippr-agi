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
 * Local model provider for OpenAI-compatible APIs (Ollama, llama.cpp, BitNet).
 */
export class LocalProvider implements ModelProvider {
  constructor(
    private baseUrl: string = 'http://localhost:11434/v1',
    private modelName: string = 'bitnet-b1.58',
  ) {}

  async generate(messages: ModelMessage[], tools?: ToolDefinition[]): Promise<ModelResponse> {
    const body: Record<string, unknown> = {
      model: this.modelName,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    };

    if (tools?.length) {
      body.tools = tools.map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.inputSchema,
        },
      }));
    }

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Local model API error ${res.status}: ${text}`);
    }

    const data = (await res.json()) as {
      choices: Array<{
        message: {
          content: string | null;
          tool_calls?: Array<{
            id: string;
            function: { name: string; arguments: string };
          }>;
        };
      }>;
      usage?: { prompt_tokens: number; completion_tokens: number };
    };

    const choice = data.choices[0];
    if (!choice) {
      return { content: '' };
    }

    const toolCalls: ToolCall[] = (choice.message.tool_calls ?? []).map((tc) => ({
      id: tc.id,
      name: tc.function.name,
      input: JSON.parse(tc.function.arguments) as Record<string, unknown>,
    }));

    return {
      content: choice.message.content ?? '',
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: data.usage
        ? { inputTokens: data.usage.prompt_tokens, outputTokens: data.usage.completion_tokens }
        : undefined,
    };
  }

  async *agentLoop(
    prompt: string,
    tools: ToolDefinition[],
    executor: ToolExecutor,
  ): AsyncGenerator<AgentEvent> {
    const messages: ModelMessage[] = [{ role: 'user', content: prompt }];
    const maxIterations = 10;

    for (let i = 0; i < maxIterations; i++) {
      const response = await this.generate(messages, tools);

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
          content: JSON.stringify({ tool_calls: [{ name: call.name, input: call.input }] }),
        });
        messages.push({
          role: 'user',
          content: `Tool result for ${call.name}: ${result.content}`,
        });
      }
    }

    yield { type: 'done', data: 'Max iterations reached' };
  }
}
