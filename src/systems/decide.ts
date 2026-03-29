import type { Engine } from '../ecs/engine.js';
import type { System, EntityId } from '../ecs/types.js';
import type {
  OrientationComponent,
  GoalComponent,
  ConstraintComponent,
  DecisionComponent,
} from '../core/components.js';

/**
 * DecideSystem: Selects an action based on orientation.
 * Low novelty + matching implicit options → fast path (System 1).
 * High novelty → deliberate evaluation via ModelProvider (System 2).
 */
export function createDecideSystem(engine: Engine): System {
  return {
    name: 'DecideSystem',
    version: '1.0.0',
    type: 'core',
    description: 'Selects action from orientation — fast path for routine, deliberate for novel',

    init() {},

    async handleEvent(event) {
      if (event.type === 'ooda:decide') {
        await decide(engine, event.entityId);
      }
    },
  };
}

const NOVELTY_THRESHOLD = 0.4;

export async function decide(engine: Engine, entityId: EntityId): Promise<void> {
  const logger = engine.getLogger();

  const orientation = engine.getComponent<OrientationComponent>(entityId, 'Orientation');
  if (!orientation) {
    logger.warn({ entityId }, 'DecideSystem: no orientation available');
    return;
  }

  // Gather goals and constraints
  const goals = engine.getComponent<GoalComponent>(entityId, 'Goals');
  const constraints = engine.getComponent<ConstraintComponent>(entityId, 'Constraints');

  let decision: DecisionComponent;

  if (orientation.novelty < NOVELTY_THRESHOLD && orientation.implicitOptions.length > 0) {
    // Fast path — pick highest confidence implicit option that satisfies goals
    const bestOption = orientation.implicitOptions.reduce((best, opt) =>
      opt.confidence > best.confidence ? opt : best,
    );

    decision = {
      selectedAction: bestOption.action,
      rationale: `Fast path (novelty=${orientation.novelty.toFixed(2)}): ${bestOption.rationale}`,
      deliberate: false,
      tick: orientation.tick,
    };

    logger.debug({ entityId, action: decision.selectedAction }, 'DecideSystem: fast path');
  } else {
    // Slow path — deliberate via ModelProvider
    decision = await deliberate(engine, entityId, orientation, goals, constraints);
    logger.debug({ entityId, action: decision.selectedAction }, 'DecideSystem: deliberate path');
  }

  engine.setComponent(entityId, 'Decision', decision as unknown as Record<string, unknown>);
}

async function deliberate(
  engine: Engine,
  entityId: EntityId,
  orientation: OrientationComponent,
  goals: GoalComponent | null,
  constraints: ConstraintComponent | null,
): Promise<DecisionComponent> {
  const provider = engine.getProvider();

  const systemPrompt = `You are the Decision phase of a Boyd OODA loop. The Orientation phase flagged high novelty, requiring careful deliberation.

Evaluate the implicit options against the agent's goals and constraints. You may also propose a new action not in the implicit options.

Respond with valid JSON:
{
  "selectedAction": "string — the action to take",
  "rationale": "string — why this action was chosen"
}`;

  const userContent = JSON.stringify({
    situationFrame: orientation.situationFrame,
    novelty: orientation.novelty,
    implicitOptions: orientation.implicitOptions,
    goals: goals ?? null,
    constraints: constraints ?? null,
  });

  try {
    const response = await provider.generate([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ]);

    const jsonMatch = response.content.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, response.content];
    const parsed = JSON.parse((jsonMatch[1] ?? response.content).trim());

    return {
      selectedAction: String(parsed.selectedAction ?? 'no-op'),
      rationale: `Deliberate (novelty=${orientation.novelty.toFixed(2)}): ${parsed.rationale ?? 'no rationale'}`,
      deliberate: true,
      tick: orientation.tick,
    };
  } catch {
    // Fallback: pick best implicit option or no-op
    const best = orientation.implicitOptions[0];
    return {
      selectedAction: best?.action ?? 'no-op',
      rationale: 'Deliberation failed — falling back to top implicit option',
      deliberate: true,
      tick: orientation.tick,
    };
  }
}

export default createDecideSystem;
