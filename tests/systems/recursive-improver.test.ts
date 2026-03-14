import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Engine } from '../../src/ecs/engine.js';
import { Store } from '../../src/store/db.js';
import type { ModelProvider, ModelResponse } from '../../src/model/types.js';
import type { Logger } from '../../src/util/logger.js';
import createRecursiveImprover, {
  checkStoppingCriteria,
  PLATEAU_THRESHOLD,
  type ImprovementLoopData,
} from '../../src/systems/recursive-improver.js';

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

function mockProvider(responses: string[]): ModelProvider {
  let callIndex = 0;
  return {
    async generate(): Promise<ModelResponse> {
      const content = responses[callIndex] ?? '{}';
      callIndex++;
      return { content };
    },
  };
}

describe('checkStoppingCriteria', () => {
  const baseLoop: ImprovementLoopData = {
    objective: 'test',
    constraints: [],
    maxIterations: 10,
    iteration: 0,
    baselineScore: 0,
    bestScore: 0,
    improvements: [],
  };

  it('returns null when no criteria met', () => {
    expect(checkStoppingCriteria({ ...baseLoop, iteration: 1 })).toBeNull();
  });

  it('stops at max iterations', () => {
    expect(checkStoppingCriteria({ ...baseLoop, iteration: 10 })).toBe('max_iterations_reached');
  });

  it('stops at near-perfect score', () => {
    expect(checkStoppingCriteria({ ...baseLoop, iteration: 1, bestScore: 0.99 })).toBe('near_perfect_score');
    expect(checkStoppingCriteria({ ...baseLoop, iteration: 1, bestScore: 1.0 })).toBe('near_perfect_score');
  });

  it('detects plateau when no improvements after threshold iterations', () => {
    const stalled: ImprovementLoopData = {
      ...baseLoop,
      iteration: PLATEAU_THRESHOLD,
      improvements: [],
    };
    expect(checkStoppingCriteria(stalled)).toBe('plateau_detected');
  });

  it('does not detect plateau when improvements exist', () => {
    const improving: ImprovementLoopData = {
      ...baseLoop,
      iteration: PLATEAU_THRESHOLD,
      improvements: [
        { hypothesis: 'h1', change: 'c1', score: 0.5 },
        { hypothesis: 'h2', change: 'c2', score: 0.6 },
        { hypothesis: 'h3', change: 'c3', score: 0.7 },
      ],
    };
    expect(checkStoppingCriteria(improving)).toBeNull();
  });
});

describe('RecursiveImprover system', () => {
  let store: Store;
  let engine: Engine;

  afterEach(() => {
    store.close();
  });

  it('has correct metadata', () => {
    store = new Store(':memory:');
    engine = new Engine(store, mockProvider([]), mockLogger());
    const system = createRecursiveImprover(engine);
    expect(system.name).toBe('RecursiveImprover');
    expect(system.type).toBe('system');
    expect(system.version).toBe('1.0.0');
  });

  it('bootstraps a loop on system:selected and creates experiment entity', async () => {
    const bootstrapResponse = JSON.stringify({
      objective: 'Optimize training speed',
      constraints: ['Do not change batch size'],
      maxIterations: 5,
    });

    const proposalResponse = JSON.stringify({
      hypothesis: 'Increase learning rate',
      change: 'Set lr=0.01',
      reasoning: 'Higher LR converges faster',
    });

    store = new Store(':memory:');
    engine = new Engine(store, mockProvider([bootstrapResponse, proposalResponse]), mockLogger());

    const system = createRecursiveImprover(engine);
    await engine.registerSystem(system);

    // Create an entity with a task
    engine.createEntity('loop-1');
    engine.addComponent('loop-1', 'TaskDescription', {
      task: 'Optimize training speed without changing batch size',
      complete: false,
    });

    // Track emitted events
    const emittedEvents: string[] = [];
    engine.on('entity:needs-routing', (e) => emittedEvents.push(`needs-routing:${e.entityId}`));

    // Trigger the system
    await system.handleEvent({
      type: 'system:selected',
      entityId: 'loop-1',
      data: { system: 'RecursiveImprover' },
      source: 'SystemSelector',
      timestamp: Date.now(),
    });

    // Verify ImprovementLoop component was attached
    const loopComp = engine.getComponent('loop-1', 'ImprovementLoop');
    expect(loopComp).not.toBeNull();
    expect(loopComp!.objective).toBe('Optimize training speed');
    expect(loopComp!.constraints).toEqual(['Do not change batch size']);
    expect(loopComp!.iteration).toBe(1);

    // Verify an experiment entity was created and routed
    expect(emittedEvents.length).toBeGreaterThanOrEqual(1);
    const routedId = emittedEvents[0].replace('needs-routing:', '');
    expect(engine.entityExists(routedId)).toBe(true);

    const proposal = engine.getComponent(routedId, 'ExperimentProposal');
    expect(proposal).not.toBeNull();
    expect(proposal!.hypothesis).toBe('Increase learning rate');
    expect(proposal!.iteration).toBe(1);

    const parent = engine.getComponent(routedId, 'TaskParent');
    expect(parent).not.toBeNull();
    expect(parent!.parentId).toBe('loop-1');
  });

  it('handles invalid bootstrap response gracefully', async () => {
    store = new Store(':memory:');
    const logger = mockLogger();
    engine = new Engine(store, mockProvider(['not json']), logger);

    const system = createRecursiveImprover(engine);
    await engine.registerSystem(system);

    engine.createEntity('loop-bad');
    engine.addComponent('loop-bad', 'TaskDescription', { task: 'test', complete: false });

    await system.handleEvent({
      type: 'system:selected',
      entityId: 'loop-bad',
      data: { system: 'RecursiveImprover' },
      source: 'SystemSelector',
      timestamp: Date.now(),
    });

    // Should not crash, should log warning
    expect(logger.warn).toHaveBeenCalled();
    expect(engine.getComponent('loop-bad', 'ImprovementLoop')).toBeNull();
  });

  it('stops the loop and emits completion when max iterations reached', async () => {
    store = new Store(':memory:');
    engine = new Engine(store, mockProvider([]), mockLogger());

    const system = createRecursiveImprover(engine);
    await engine.registerSystem(system);

    // Set up a loop entity that's at max iterations
    engine.createEntity('loop-done');
    engine.addComponent('loop-done', 'ImprovementLoop', {
      objective: 'test',
      constraints: [],
      maxIterations: 5,
      iteration: 5,
      baselineScore: 0,
      bestScore: 0.7,
      improvements: [{ hypothesis: 'h1', change: 'c1', score: 0.7 }],
    });

    const completedEvents: Array<{ type: string; data: Record<string, unknown> }> = [];
    engine.on('improvement-loop:completed', (e) => completedEvents.push({ type: e.type, data: e.data }));

    // Simulate an experiment evaluation coming back
    await system.handleEvent({
      type: 'experiment:evaluated',
      entityId: 'exp-1',
      data: {
        loopEntityId: 'loop-done',
        improved: false,
        score: 0.3,
        reasoning: 'No improvement',
        hypothesis: 'test',
        change: 'test',
      },
      source: 'RecursiveImprover',
      timestamp: Date.now(),
    });

    expect(completedEvents).toHaveLength(1);
    expect(completedEvents[0].data.reason).toBe('max_iterations_reached');
    expect(completedEvents[0].data.bestScore).toBe(0.7);

    const loopComp = engine.getComponent('loop-done', 'ImprovementLoop');
    expect(loopComp!.stoppedReason).toBe('max_iterations_reached');
  });

  it('accepts improvements and updates best score', async () => {
    const proposalResponse = JSON.stringify({
      hypothesis: 'Try warmup schedule',
      change: 'Add linear warmup for 100 steps',
      reasoning: 'Warm starts help convergence',
    });

    store = new Store(':memory:');
    engine = new Engine(store, mockProvider([proposalResponse]), mockLogger());

    const system = createRecursiveImprover(engine);
    await engine.registerSystem(system);

    engine.createEntity('loop-improving');
    engine.addComponent('loop-improving', 'ImprovementLoop', {
      objective: 'Optimize training',
      constraints: [],
      maxIterations: 10,
      iteration: 2,
      baselineScore: 0,
      bestScore: 0.5,
      improvements: [{ hypothesis: 'h1', change: 'c1', score: 0.5 }],
    });

    await system.handleEvent({
      type: 'experiment:evaluated',
      entityId: 'exp-2',
      data: {
        loopEntityId: 'loop-improving',
        improved: true,
        score: 0.8,
        reasoning: 'Significant improvement',
        hypothesis: 'Better LR schedule',
        change: 'Cosine annealing',
      },
      source: 'RecursiveImprover',
      timestamp: Date.now(),
    });

    const loopComp = engine.getComponent('loop-improving', 'ImprovementLoop');
    expect(loopComp!.bestScore).toBe(0.8);
    expect((loopComp!.improvements as Array<{ hypothesis: string }>)).toHaveLength(2);
    expect(loopComp!.iteration).toBe(3); // incremented by runNextIteration
  });

  it('skips if no TaskDescription on system:selected', async () => {
    store = new Store(':memory:');
    engine = new Engine(store, mockProvider([]), mockLogger());

    const system = createRecursiveImprover(engine);
    await engine.registerSystem(system);

    engine.createEntity('no-task');

    await system.handleEvent({
      type: 'system:selected',
      entityId: 'no-task',
      data: { system: 'RecursiveImprover' },
      source: 'SystemSelector',
      timestamp: Date.now(),
    });

    expect(engine.getComponent('no-task', 'ImprovementLoop')).toBeNull();
  });

  it('ignores experiment:evaluated without loopEntityId', async () => {
    store = new Store(':memory:');
    engine = new Engine(store, mockProvider([]), mockLogger());

    const system = createRecursiveImprover(engine);
    await engine.registerSystem(system);

    // Should not throw
    await system.handleEvent({
      type: 'experiment:evaluated',
      entityId: 'exp-orphan',
      data: { improved: true, score: 0.5, reasoning: 'test' },
      source: 'RecursiveImprover',
      timestamp: Date.now(),
    });
  });

  it('ignores experiment:evaluated when loop is already stopped', async () => {
    store = new Store(':memory:');
    engine = new Engine(store, mockProvider([]), mockLogger());

    const system = createRecursiveImprover(engine);
    await engine.registerSystem(system);

    engine.createEntity('loop-stopped');
    engine.addComponent('loop-stopped', 'ImprovementLoop', {
      objective: 'test',
      constraints: [],
      maxIterations: 5,
      iteration: 5,
      baselineScore: 0,
      bestScore: 0.7,
      stoppedReason: 'max_iterations_reached',
      improvements: [],
    });

    const completedEvents: string[] = [];
    engine.on('improvement-loop:completed', () => completedEvents.push('completed'));

    await system.handleEvent({
      type: 'experiment:evaluated',
      entityId: 'exp-late',
      data: {
        loopEntityId: 'loop-stopped',
        improved: true,
        score: 0.9,
        reasoning: 'Late result',
        hypothesis: 'h',
        change: 'c',
      },
      source: 'RecursiveImprover',
      timestamp: Date.now(),
    });

    // Should not emit another completion
    expect(completedEvents).toHaveLength(0);
  });
});
