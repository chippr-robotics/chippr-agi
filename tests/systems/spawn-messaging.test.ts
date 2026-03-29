import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Engine } from '../../src/ecs/engine.js';
import { Store } from '../../src/store/db.js';
import type { ModelProvider, ModelResponse } from '../../src/model/types.js';
import type { Logger } from '../../src/util/logger.js';
import { createAgentSpawnSystem } from '../../src/systems/spawn.js';
import { createInterAgentMessageSystem, flushMessages } from '../../src/systems/messaging.js';
import type { ECSEvent } from '../../src/ecs/types.js';

function mockProvider(): ModelProvider {
  return {
    async generate(): Promise<ModelResponse> {
      return { content: 'mock' };
    },
  };
}

function mockLogger(): Logger {
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

describe('AgentSpawnSystem', () => {
  let store: Store;
  let engine: Engine;

  beforeEach(async () => {
    store = new Store(':memory:');
    engine = new Engine(store, mockProvider(), mockLogger());
  });

  afterEach(() => {
    store.close();
  });

  it('spawns a child agent with OodaAgent component', async () => {
    const spawnSystem = createAgentSpawnSystem(engine);
    const parentId = engine.createEntity('parent');

    const spawned = vi.fn();
    engine.on('agent:spawned', spawned);

    const event: ECSEvent = {
      type: 'agent:spawn',
      entityId: parentId,
      data: { role: 'worker', goals: ['complete task'] },
      source: 'test',
      timestamp: Date.now(),
    };

    // Call handleEvent directly to ensure async completes
    await spawnSystem.handleEvent(event);

    expect(spawned).toHaveBeenCalledOnce();
    const childId = spawned.mock.calls[0][0].entityId;
    expect(engine.entityExists(childId)).toBe(true);

    const ooda = engine.getComponent(childId, 'OodaAgent');
    expect(ooda).not.toBeNull();

    const identity = engine.getComponent(childId, 'Identity') as Record<string, unknown>;
    expect(identity.role).toBe('worker');
    expect(identity.coreGoals).toEqual(['complete task']);
  });

  it('links parent and child via components', async () => {
    const spawnSystem = createAgentSpawnSystem(engine);
    const parentId = engine.createEntity('parent');

    const spawned = vi.fn();
    engine.on('agent:spawned', spawned);

    await spawnSystem.handleEvent({
      type: 'agent:spawn',
      entityId: parentId,
      data: { role: 'sub' },
      source: 'test',
      timestamp: Date.now(),
    });

    const childId = spawned.mock.calls[0][0].entityId;

    const parentRef = engine.getComponent(childId, 'ParentAgent') as Record<string, unknown>;
    expect(parentRef.parentEntityId).toBe(parentId);

    const children = engine.getComponent(parentId, 'ChildAgents') as Record<string, unknown>;
    expect((children.childEntityIds as string[])).toContain(childId);
  });
});

describe('InterAgentMessageSystem', () => {
  let store: Store;
  let engine: Engine;

  beforeEach(async () => {
    store = new Store(':memory:');
    engine = new Engine(store, mockProvider(), mockLogger());
  });

  afterEach(() => {
    store.close();
  });

  it('delivers messages from outbox to inbox', () => {
    const agentA = engine.createEntity('agent-a');
    const agentB = engine.createEntity('agent-b');

    engine.addComponent(agentA, 'Outbox', {
      messages: [
        { from: agentA, to: agentB, content: 'hello B', metadata: {}, timestamp: Date.now() },
      ],
    });
    engine.addComponent(agentB, 'Inbox', { messages: [] });

    flushMessages(engine);

    const inbox = engine.getComponent(agentB, 'Inbox') as Record<string, unknown>;
    const messages = inbox.messages as Array<Record<string, unknown>>;
    expect(messages.length).toBe(1);
    expect(messages[0].content).toBe('hello B');

    // Outbox should be cleared
    const outbox = engine.getComponent(agentA, 'Outbox') as Record<string, unknown>;
    expect((outbox.messages as unknown[]).length).toBe(0);
  });

  it('handles direct message send via handleEvent', async () => {
    const msgSystem = createInterAgentMessageSystem(engine);
    const agentA = engine.createEntity('agent-a');
    const agentB = engine.createEntity('agent-b');
    engine.addComponent(agentB, 'Inbox', { messages: [] });

    await msgSystem.handleEvent({
      type: 'message:send',
      entityId: agentA,
      data: { from: agentA, to: agentB, content: 'direct msg', metadata: {}, timestamp: Date.now() },
      source: 'test',
      timestamp: Date.now(),
    });

    const inbox = engine.getComponent(agentB, 'Inbox') as Record<string, unknown>;
    expect((inbox.messages as unknown[]).length).toBe(1);
  });

  it('warns when target entity does not exist', () => {
    const agentA = engine.createEntity('agent-a');
    engine.addComponent(agentA, 'Outbox', {
      messages: [
        { from: agentA, to: 'nonexistent', content: 'hello', metadata: {}, timestamp: Date.now() },
      ],
    });

    // Should not throw
    flushMessages(engine);
  });
});
