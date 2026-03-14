import { z } from 'zod';
import type { Engine } from '../ecs/engine.js';
import type { System, EntityId } from '../ecs/types.js';
import { uniqueId } from '../util/hash.js';

/**
 * Zod schemas for LLM response parsing.
 */
const ExperimentProposalSchema = z.object({
  hypothesis: z.string(),
  change: z.string(),
  reasoning: z.string(),
});

const ExperimentEvalSchema = z.object({
  improved: z.boolean(),
  score: z.number().min(0).max(1),
  reasoning: z.string(),
});

/**
 * Component shapes used by this system.
 *
 * ImprovementLoop — attached to the root loop entity:
 *   { objective, constraints, maxIterations, iteration, baselineScore, bestScore, stoppedReason? }
 *
 * ExperimentProposal — attached to each experiment entity:
 *   { hypothesis, change, reasoning, iteration }
 *
 * ExperimentResult — attached after execution + evaluation:
 *   { improved, score, reasoning, accepted }
 */

interface ImprovementLoopData {
  objective: string;
  constraints: string[];
  maxIterations: number;
  iteration: number;
  baselineScore: number;
  bestScore: number;
  stoppedReason?: string;
  improvements: Array<{ hypothesis: string; change: string; score: number }>;
  [key: string]: unknown;
}

/** How many consecutive non-improvements before we stop early. */
const PLATEAU_THRESHOLD = 3;

export default function createRecursiveImprover(engine: Engine): System {
  return {
    name: 'RecursiveImprover',
    version: '1.0.0',
    type: 'system',
    description:
      'Runs autonomous recursive improvement loops — iteratively proposes, executes, and evaluates experiments against an objective.',

    init() {
      // Kick off a loop when the SystemSelector routes to us.
      engine.on('system:selected', (event) => {
        if (event.data.system === 'RecursiveImprover') this.handleEvent(event);
      });

      // Continue the loop after an experiment is judged.
      engine.on('experiment:evaluated', (event) => this.handleEvent(event));
    },

    async handleEvent(event) {
      const logger = engine.getLogger();

      if (event.type === 'system:selected') {
        // ---------- Bootstrap a new improvement loop ----------
        const taskDesc = engine.getComponent(event.entityId, 'TaskDescription');
        if (!taskDesc) return;

        const loopData = await bootstrapLoop(engine, event.entityId, taskDesc);
        if (!loopData) return;

        logger.info(
          { entityId: event.entityId, objective: loopData.objective, maxIterations: loopData.maxIterations },
          'RecursiveImprover: loop started',
        );

        await runNextIteration(engine, event.entityId, loopData);
        return;
      }

      if (event.type === 'experiment:evaluated') {
        // ---------- Process evaluation and decide next step ----------
        const loopEntityId = event.data.loopEntityId as EntityId;
        if (!loopEntityId) return;

        const loopData = engine.getComponent<ImprovementLoopData>(loopEntityId, 'ImprovementLoop');
        if (!loopData || loopData.stoppedReason) return;

        const result = event.data as {
          improved: boolean;
          score: number;
          reasoning: string;
          hypothesis: string;
          change: string;
        };

        // Update loop state based on evaluation
        const updated = { ...loopData };
        if (result.improved && result.score > updated.bestScore) {
          updated.bestScore = result.score;
          updated.improvements = [
            ...updated.improvements,
            { hypothesis: result.hypothesis, change: result.change, score: result.score },
          ];
          logger.info(
            { iteration: updated.iteration, score: result.score },
            'RecursiveImprover: improvement accepted',
          );
        } else {
          logger.info(
            { iteration: updated.iteration, score: result.score },
            'RecursiveImprover: experiment rejected',
          );
        }

        // Check stopping criteria
        const stoppedReason = checkStoppingCriteria(updated);
        if (stoppedReason) {
          updated.stoppedReason = stoppedReason;
          engine.setComponent(loopEntityId, 'ImprovementLoop', updated);

          logger.info(
            { reason: stoppedReason, bestScore: updated.bestScore, improvements: updated.improvements.length },
            'RecursiveImprover: loop stopped',
          );

          engine.emit({
            type: 'improvement-loop:completed',
            entityId: loopEntityId,
            data: {
              reason: stoppedReason,
              bestScore: updated.bestScore,
              totalIterations: updated.iteration,
              improvements: updated.improvements,
            },
            source: 'RecursiveImprover',
            timestamp: Date.now(),
          });

          // Store summary in memory for future context
          await engine.getStore().addMemoryEmbedded(
            loopEntityId,
            'system',
            `Improvement loop completed: objective="${updated.objective}" ` +
              `iterations=${updated.iteration} bestScore=${updated.bestScore} ` +
              `improvements=${updated.improvements.length} reason=${stoppedReason}\n` +
              `Accepted changes:\n${updated.improvements.map((i) => `- ${i.hypothesis} (score: ${i.score})`).join('\n')}`,
          );

          return;
        }

        engine.setComponent(loopEntityId, 'ImprovementLoop', updated);
        await runNextIteration(engine, loopEntityId, updated);
      }
    },
  };
}

/**
 * Parse the objective into a structured improvement loop and attach the ImprovementLoop component.
 */
async function bootstrapLoop(
  engine: Engine,
  entityId: EntityId,
  taskDesc: Record<string, unknown>,
): Promise<ImprovementLoopData | null> {
  const taskText = (taskDesc.task ?? '') as string;
  if (!taskText) return null;

  const response = await engine.getProvider().generate([
    {
      role: 'system',
      content:
        'You are an experiment planner. Given an improvement objective, extract structured parameters. ' +
        'Respond with a JSON object: {objective: string, constraints: string[], maxIterations: number}. ' +
        'maxIterations should be between 5 and 50 based on complexity. constraints are things that must not change. Nothing else.',
    },
    { role: 'user', content: taskText },
  ]);

  let parsed;
  try {
    parsed = z
      .object({
        objective: z.string(),
        constraints: z.array(z.string()),
        maxIterations: z.number().min(1).max(100),
      })
      .safeParse(JSON.parse(response.content));
  } catch {
    engine.getLogger().warn({ content: response.content }, 'RecursiveImprover: failed to parse bootstrap response');
    return null;
  }

  if (!parsed.success) {
    engine.getLogger().warn({ err: parsed.error }, 'RecursiveImprover: invalid bootstrap schema');
    return null;
  }

  const loopData: ImprovementLoopData = {
    objective: parsed.data.objective,
    constraints: parsed.data.constraints,
    maxIterations: parsed.data.maxIterations,
    iteration: 0,
    baselineScore: 0,
    bestScore: 0,
    improvements: [],
  };

  engine.addComponent(entityId, 'ImprovementLoop', loopData);
  return loopData;
}

/**
 * Propose the next experiment, create an entity for it, and route it for execution.
 */
async function runNextIteration(
  engine: Engine,
  loopEntityId: EntityId,
  loopData: ImprovementLoopData,
): Promise<void> {
  const logger = engine.getLogger();
  const nextIteration = loopData.iteration + 1;

  // Build context from past experiments
  const pastExperiments = loopData.improvements
    .map((i, idx) => `${idx + 1}. ${i.hypothesis} → score: ${i.score}`)
    .join('\n');

  const response = await engine.getProvider().generate([
    {
      role: 'system',
      content:
        'You are a research agent running an autonomous improvement loop. Propose the next experiment. ' +
        'Consider what has already been tried and find a novel approach. ' +
        'Respond with a JSON object: {hypothesis: string, change: string, reasoning: string}. Nothing else.\n' +
        `Constraints that must not change: ${JSON.stringify(loopData.constraints)}`,
    },
    {
      role: 'user',
      content:
        `Objective: ${loopData.objective}\n` +
        `Current best score: ${loopData.bestScore}\n` +
        `Iteration: ${nextIteration}/${loopData.maxIterations}\n` +
        (pastExperiments ? `Past accepted improvements:\n${pastExperiments}` : 'No improvements accepted yet.'),
    },
  ]);

  let parsed;
  try {
    parsed = ExperimentProposalSchema.safeParse(JSON.parse(response.content));
  } catch {
    logger.warn({ content: response.content }, 'RecursiveImprover: failed to parse proposal');
    return;
  }

  if (!parsed.success) {
    logger.warn({ err: parsed.error }, 'RecursiveImprover: invalid proposal schema');
    return;
  }

  // Create experiment entity
  const experimentId = uniqueId();
  engine.createEntity(experimentId);
  engine.addComponent(experimentId, 'ExperimentProposal', {
    ...parsed.data,
    iteration: nextIteration,
  });
  engine.addComponent(experimentId, 'TaskParent', { parentId: loopEntityId });
  engine.addComponent(experimentId, 'TaskDescription', {
    task: `Experiment ${nextIteration}: ${parsed.data.hypothesis}\nChange: ${parsed.data.change}`,
    complete: false,
  });

  // Update the loop iteration counter
  engine.setComponent(loopEntityId, 'ImprovementLoop', {
    ...loopData,
    iteration: nextIteration,
  });

  logger.info(
    { experimentId, iteration: nextIteration, hypothesis: parsed.data.hypothesis },
    'RecursiveImprover: experiment proposed',
  );

  // Route the experiment for execution — the experiment goes through the normal
  // system-selector → execution → judge pipeline. We listen for the judgement
  // back via task:judged on this entity, then evaluate it in the loop context.
  engine.on('task:judged', async function onJudged(judgedEvent) {
    if (judgedEvent.entityId !== experimentId) return;

    // Evaluate the experiment result in the context of the improvement loop
    const judgement = engine.getComponent(experimentId, 'Judgement');
    const proposal = engine.getComponent(experimentId, 'ExperimentProposal');
    if (!judgement || !proposal) return;

    const evalResponse = await engine.getProvider().generate([
      {
        role: 'system',
        content:
          'You are evaluating whether an experiment improved the objective. ' +
          'Consider the judgement score and reasoning relative to the current best score. ' +
          'Respond with a JSON object: {improved: boolean, score: number (0-1), reasoning: string}. Nothing else.',
      },
      {
        role: 'user',
        content:
          `Objective: ${loopData.objective}\n` +
          `Experiment hypothesis: ${proposal.hypothesis}\n` +
          `Experiment change: ${proposal.change}\n` +
          `Judgement score: ${judgement.score}\n` +
          `Judgement reasoning: ${judgement.reasoning}\n` +
          `Current best score: ${loopData.bestScore}`,
      },
    ]);

    let evalParsed;
    try {
      evalParsed = ExperimentEvalSchema.safeParse(JSON.parse(evalResponse.content));
    } catch {
      logger.warn({ content: evalResponse.content }, 'RecursiveImprover: failed to parse evaluation');
      return;
    }

    if (!evalParsed.success) {
      logger.warn({ err: evalParsed.error }, 'RecursiveImprover: invalid evaluation schema');
      return;
    }

    // Attach result to experiment entity
    engine.addComponent(experimentId, 'ExperimentResult', {
      ...evalParsed.data,
      accepted: evalParsed.data.improved && evalParsed.data.score > loopData.bestScore,
    });

    // Emit evaluation for the loop to process
    engine.emit({
      type: 'experiment:evaluated',
      entityId: experimentId,
      data: {
        loopEntityId,
        ...evalParsed.data,
        hypothesis: proposal.hypothesis as string,
        change: proposal.change as string,
      },
      source: 'RecursiveImprover',
      timestamp: Date.now(),
    });
  });

  // Route the experiment through the standard pipeline
  engine.emit({
    type: 'entity:needs-routing',
    entityId: experimentId,
    data: {},
    source: 'RecursiveImprover',
    timestamp: Date.now(),
  });
}

/**
 * Check whether the loop should stop.
 */
function checkStoppingCriteria(loopData: ImprovementLoopData): string | null {
  // Hit iteration cap
  if (loopData.iteration >= loopData.maxIterations) {
    return 'max_iterations_reached';
  }

  // Plateau detection: no improvements in the last N iterations
  if (loopData.iteration >= PLATEAU_THRESHOLD) {
    const recentImprovementIterations = loopData.improvements
      .filter((i) => i.score > 0)
      .length;
    const iterationsSinceLastImprovement =
      loopData.iteration - (recentImprovementIterations > 0 ? loopData.improvements.length : 0);
    if (iterationsSinceLastImprovement >= PLATEAU_THRESHOLD) {
      return 'plateau_detected';
    }
  }

  // Near-perfect score
  if (loopData.bestScore >= 0.99) {
    return 'near_perfect_score';
  }

  return null;
}

export { checkStoppingCriteria, PLATEAU_THRESHOLD };
export type { ImprovementLoopData };
