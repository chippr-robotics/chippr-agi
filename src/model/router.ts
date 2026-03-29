import type {
  ModelProvider,
  ModelMessage,
  ModelResponse,
  ToolDefinition,
  ToolExecutor,
  AgentEvent,
} from './types.js';

interface ProviderStats {
  requests: number;
  errors: number;
  totalLatencyMs: number;
}

/**
 * Routes between primary and fallback ModelProviders.
 * Tracks latency and error rates per provider.
 */
export class ModelProviderRouter implements ModelProvider {
  private stats = new Map<string, ProviderStats>();

  constructor(
    private primary: ModelProvider,
    private fallback: ModelProvider,
    private primaryName = 'primary',
    private fallbackName = 'fallback',
  ) {
    this.stats.set(this.primaryName, { requests: 0, errors: 0, totalLatencyMs: 0 });
    this.stats.set(this.fallbackName, { requests: 0, errors: 0, totalLatencyMs: 0 });
  }

  async generate(messages: ModelMessage[], tools?: ToolDefinition[]): Promise<ModelResponse> {
    const s = this.stats.get(this.primaryName)!;
    s.requests++;
    const start = performance.now();
    try {
      const result = await this.primary.generate(messages, tools);
      s.totalLatencyMs += performance.now() - start;
      return result;
    } catch {
      s.totalLatencyMs += performance.now() - start;
      s.errors++;
      return this.timed(this.fallbackName, () => this.fallback.generate(messages, tools));
    }
  }

  async embed(text: string): Promise<number[]> {
    const provider = this.primary.embed ? this.primary : this.fallback;
    if (!provider.embed) throw new Error('No provider supports embed()');
    return provider.embed(text);
  }

  async *agentLoop(
    prompt: string,
    tools: ToolDefinition[],
    executor: ToolExecutor,
  ): AsyncGenerator<AgentEvent> {
    const provider = this.primary.agentLoop ? this.primary : this.fallback;
    if (!provider.agentLoop) throw new Error('No provider supports agentLoop()');
    yield* provider.agentLoop(prompt, tools, executor);
  }

  getStats(): Record<string, ProviderStats> {
    return Object.fromEntries(this.stats);
  }

  getErrorRate(name: string): number {
    const s = this.stats.get(name);
    return s && s.requests > 0 ? s.errors / s.requests : 0;
  }

  getAvgLatency(name: string): number {
    const s = this.stats.get(name);
    return s && s.requests > 0 ? s.totalLatencyMs / s.requests : 0;
  }

  private async timed<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const s = this.stats.get(name)!;
    s.requests++;
    try {
      const result = await fn();
      s.totalLatencyMs += performance.now() - start;
      return result;
    } catch (err) {
      s.totalLatencyMs += performance.now() - start;
      s.errors++;
      throw err;
    }
  }
}
