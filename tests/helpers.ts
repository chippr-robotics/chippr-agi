import { vi } from 'vitest';
import { Store } from '../src/store/db.js';
import { Engine } from '../src/ecs/engine.js';
import type { ModelProvider, ModelResponse } from '../src/model/types.js';
import type { Logger } from '../src/util/logger.js';
import type { ECSEvent } from '../src/ecs/types.js';

export function mockLogger(): Logger {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
    child: vi.fn(),
    level: 'info',
  } as unknown as Logger;
}

export function mockProvider(responses: string[]): ModelProvider {
  let callIndex = 0;
  return {
    async generate(): Promise<ModelResponse> {
      const content = responses[callIndex] ?? '{}';
      callIndex++;
      return { content };
    },
  };
}

export function mockProviderWithTools(responses: ModelResponse[]): ModelProvider {
  let callIndex = 0;
  return {
    async generate(): Promise<ModelResponse> {
      const response = responses[callIndex] ?? { content: '' };
      callIndex++;
      return response;
    },
  };
}

export function createTestEngine(opts?: {
  provider?: ModelProvider;
  logger?: Logger;
}): { engine: Engine; store: Store; logger: Logger; provider: ModelProvider } {
  const store = new Store(':memory:');
  const logger = opts?.logger ?? mockLogger();
  const provider = opts?.provider ?? mockProvider([]);
  const engine = new Engine(store, provider, logger);
  return { engine, store, logger, provider };
}

export function makeEvent(overrides: Partial<ECSEvent> = {}): ECSEvent {
  return {
    type: 'test:event',
    entityId: 'test-entity',
    data: {},
    source: 'test',
    timestamp: Date.now(),
    ...overrides,
  };
}

/** Collect events emitted by the engine for assertions. */
export function collectEvents(engine: Engine, eventType = '*'): ECSEvent[] {
  const events: ECSEvent[] = [];
  engine.on(eventType, (e) => events.push(e));
  return events;
}
