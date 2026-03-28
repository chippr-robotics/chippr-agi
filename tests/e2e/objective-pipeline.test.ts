import { describe, it, expect, afterEach, vi } from 'vitest';
import { Store } from '../../src/store/db.js';
import { Engine } from '../../src/ecs/engine.js';
import { mockLogger, collectEvents } from '../helpers.js';
import createSystemSelector from '../../src/systems/system-selector.js';
import createTaskGenerator from '../../src/systems/task-generator.js';
import createJudge from '../../src/systems/judge.js';
import createEntityCreationSystem from '../../src/systems/entity-creation.js';
import type { ModelProvider, ModelResponse, ModelMessage, ToolDefinition } from '../../src/model/types.js';
import { uniqueId } from '../../src/util/hash.js';

/**
 * E2E test: Objective → SystemSelector → TaskGenerator → subtasks → Judge
 * Uses a scripted mock provider that responds differently based on the prompt content.
 */
describe('Objective Pipeline E2E', () => {
  let store: Store;
  let engine: Engine;

  afterEach(() => {
    store.close();
  });

  function createScriptedProvider(): ModelProvider {
    return {
      async generate(messages: ModelMessage[], tools?: ToolDefinition[]): Promise<ModelResponse> {
        const lastMsg = messages[messages.length - 1].content;

        // SystemSelector: select TaskGenerator via tool call
        if (tools?.length && lastMsg.includes('Select the best system')) {
          return {
            content: '',
            toolCalls: [{ id: 'tc-1', name: 'TaskGenerator', input: { entityId: 'e1' } }],
          };
        }

        // TaskGenerator: generate subtasks
        if (lastMsg && !lastMsg.includes('evaluator')) {
          return {
            content: JSON.stringify([
              { task: 'Step 1: Research', taskId: 'step-1' },
              { task: 'Step 2: Implement', taskId: 'step-2' },
            ]),
          };
        }

        // Judge: evaluate task
        return {
          content: JSON.stringify({
            complete: true,
            reasoning: 'Task completed successfully',
            score: 0.85,
          }),
        };
      },
    };
  }

  it('routes objective through task generation pipeline', async () => {
    store = new Store(':memory:');
    const logger = mockLogger();
    const provider = createScriptedProvider();
    engine = new Engine(store, provider, logger);

    // Register all systems
    await engine.registerSystem(createEntityCreationSystem(engine));
    await engine.registerSystem(createSystemSelector(engine));
    await engine.registerSystem(createTaskGenerator(engine));
    await engine.registerSystem(createJudge(engine));

    const allEvents = collectEvents(engine);

    // Submit an objective
    const entityId = 'obj-1';
    engine.createEntity(entityId);
    engine.addComponent(entityId, 'ObjectiveDescription', { objective: 'Build a widget' });
    engine.addComponent(entityId, 'TaskDescription', { task: 'Build a widget', complete: false });

    engine.emit({
      type: 'entity:needs-routing',
      entityId,
      data: { objective: 'Build a widget' },
      source: 'test',
      timestamp: Date.now(),
    });

    // Wait for async event processing
    await new Promise((r) => setTimeout(r, 100));

    // Verify SystemSelector ran and selected TaskGenerator
    expect(engine.getComponent(entityId, 'SystemSelection')).toEqual({
      selectedSystem: 'TaskGenerator',
    });

    // Verify subtask entities were created
    expect(engine.entityExists('step-1')).toBe(true);
    expect(engine.entityExists('step-2')).toBe(true);

    // Verify subtask components
    expect(engine.getComponent('step-1', 'TaskDescription')).toEqual({
      task: 'Step 1: Research',
      complete: false,
    });
    expect(engine.getComponent('step-1', 'TaskParent')).toEqual({ parentId: entityId });
  });

  it('persists all entities and events in the database', async () => {
    store = new Store(':memory:');
    const logger = mockLogger();
    const provider = createScriptedProvider();
    engine = new Engine(store, provider, logger);

    await engine.registerSystem(createSystemSelector(engine));
    await engine.registerSystem(createTaskGenerator(engine));

    const entityId = 'persist-test';
    engine.createEntity(entityId);
    engine.addComponent(entityId, 'TaskDescription', { task: 'Persist test', complete: false });

    engine.emit({
      type: 'entity:needs-routing',
      entityId,
      data: {},
      source: 'test',
      timestamp: Date.now(),
    });

    await new Promise((r) => setTimeout(r, 100));

    // Verify database persistence
    expect(store.entityExists(entityId)).toBe(true);
    expect(store.entityExists('step-1')).toBe(true);

    // Verify events were logged
    const events = store.getEvents({ limit: 50 });
    expect(events.length).toBeGreaterThan(0);
    expect(events.some((e: any) => e.type === 'entity:needs-routing')).toBe(true);
    expect(events.some((e: any) => e.type === 'system:selected')).toBe(true);
  });

  it('handles judge evaluation of completed tasks', async () => {
    store = new Store(':memory:');
    const logger = mockLogger();
    const provider: ModelProvider = {
      async generate(): Promise<ModelResponse> {
        return {
          content: JSON.stringify({ complete: true, reasoning: 'Done', score: 0.9 }),
        };
      },
    };
    engine = new Engine(store, provider, logger);

    await engine.registerSystem(createJudge(engine));

    engine.createEntity('judged-task');
    engine.addComponent('judged-task', 'TaskDescription', { task: 'A completed task', complete: false });

    const judgedEvents = collectEvents(engine, 'task:judged');

    engine.emit({
      type: 'task:completed',
      entityId: 'judged-task',
      data: { result: 'Task result' },
      source: 'test',
      timestamp: Date.now(),
    });

    await new Promise((r) => setTimeout(r, 100));

    expect(judgedEvents.length).toBe(1);
    expect(judgedEvents[0].data).toEqual({ complete: true, reasoning: 'Done', score: 0.9 });
    expect(engine.getComponent('judged-task', 'Judgement')).toEqual({
      complete: true,
      reasoning: 'Done',
      score: 0.9,
    });
  });

  it('emits system:error when LLM returns invalid JSON in task generator', async () => {
    store = new Store(':memory:');
    const logger = mockLogger();
    let callCount = 0;
    const provider: ModelProvider = {
      async generate(_messages: ModelMessage[], tools?: ToolDefinition[]): Promise<ModelResponse> {
        callCount++;
        if (tools?.length) {
          return {
            content: '',
            toolCalls: [{ id: 'tc-1', name: 'TaskGenerator', input: { entityId: 'e1' } }],
          };
        }
        return { content: 'not valid json {{' };
      },
    };
    engine = new Engine(store, provider, logger);

    await engine.registerSystem(createSystemSelector(engine));
    await engine.registerSystem(createTaskGenerator(engine));

    const errorEvents = collectEvents(engine, 'system:error');

    engine.createEntity('bad-json');
    engine.addComponent('bad-json', 'TaskDescription', { task: 'Test', complete: false });

    engine.emit({
      type: 'entity:needs-routing',
      entityId: 'bad-json',
      data: {},
      source: 'test',
      timestamp: Date.now(),
    });

    await new Promise((r) => setTimeout(r, 100));

    expect(errorEvents.some((e) => e.data.system === 'TaskGenerator')).toBe(true);
  });
});
