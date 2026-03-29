import type { Engine } from '../ecs/engine.js';
import type { System, EntityId } from '../ecs/types.js';
import type {
  ObservationComponent,
  WorldModelComponent,
  ExperienceComponent,
  IdentityComponent,
  OrientationComponent,
  AttentionFilterComponent,
  ActionOption,
} from '../core/components.js';

/**
 * OrientSystem: The schwerpunkt of the OODA loop.
 * Cross-references observations against world model, detects model violations,
 * updates the world model, and produces an OrientationComponent with
 * situation frame, novelty score, attention shifts, and implicit action options.
 */
export function createOrientSystem(engine: Engine): System {
  return {
    name: 'OrientSystem',
    version: '1.0.0',
    type: 'core',
    description: 'Destructures and reconstructs mental models from observations — the key OODA phase',

    init() {},

    async handleEvent(event) {
      if (event.type === 'ooda:orient') {
        await orient(engine, event.entityId);
      }
    },
  };
}

export async function orient(engine: Engine, entityId: EntityId): Promise<void> {
  const logger = engine.getLogger();
  const provider = engine.getProvider();

  const observation = engine.getComponent<ObservationComponent>(entityId, 'Observation');
  if (!observation || observation.observations.length === 0) {
    // No observations — produce low-novelty orientation
    engine.setComponent(entityId, 'Orientation', {
      situationFrame: 'No new observations.',
      novelty: 0,
      attentionShift: [],
      implicitOptions: [],
      tick: observation?.tick ?? 0,
    } as unknown as Record<string, unknown>);
    return;
  }

  const worldModel = engine.getComponent<WorldModelComponent>(entityId, 'WorldModel') ?? {
    beliefs: {},
    lastUpdated: 0,
    updateCount: 0,
  };
  const experience = engine.getComponent<ExperienceComponent>(entityId, 'Experience');
  const identity = engine.getComponent<IdentityComponent>(entityId, 'Identity');

  // Build orientation prompt
  const systemPrompt = `You are the Orientation phase of a Boyd OODA loop. Your task:
1. Compare new observations against the current world model (beliefs)
2. Detect model violations — observations that contradict current beliefs
3. Assess novelty (0.0 = routine, 1.0 = completely unexpected)
4. Suggest attention priorities for the next observation cycle
5. Surface implicit action options based on the situation

Respond with valid JSON only, matching this schema:
{
  "situationFrame": "string — your interpretation of the current situation",
  "novelty": number (0-1),
  "beliefUpdates": { "key": "value" } | null,
  "attentionShift": ["sensor types or focus areas to prioritize"],
  "implicitOptions": [{ "action": "string", "confidence": number (0-1), "rationale": "string" }]
}`;

  const userContent = JSON.stringify({
    observations: observation.observations,
    currentBeliefs: worldModel.beliefs,
    recentExperience: experience?.recent?.slice(0, 5) ?? [],
    identity: identity ? { role: identity.role, goals: identity.coreGoals } : null,
  });

  try {
    const response = await provider.generate([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ]);

    const parsed = parseOrientationResponse(response.content);

    // Update world model if belief updates are present
    if (parsed.beliefUpdates && Object.keys(parsed.beliefUpdates).length > 0) {
      const updatedBeliefs = { ...worldModel.beliefs, ...parsed.beliefUpdates };
      engine.setComponent(entityId, 'WorldModel', {
        beliefs: updatedBeliefs,
        lastUpdated: Date.now(),
        updateCount: worldModel.updateCount + 1,
      } as unknown as Record<string, unknown>);
    }

    // Update attention filter for next Observe cycle (Boyd feedback)
    if (parsed.attentionShift.length > 0) {
      const currentFilter = engine.getComponent<AttentionFilterComponent>(entityId, 'AttentionFilter');
      engine.setComponent(entityId, 'AttentionFilter', {
        priorities: parsed.attentionShift,
        activeSensors: currentFilter?.activeSensors ?? [],
      } as unknown as Record<string, unknown>);
    }

    // Write orientation
    const orientation: OrientationComponent = {
      situationFrame: parsed.situationFrame,
      novelty: parsed.novelty,
      attentionShift: parsed.attentionShift,
      implicitOptions: parsed.implicitOptions,
      tick: observation.tick,
    };
    engine.setComponent(entityId, 'Orientation', orientation as unknown as Record<string, unknown>);

    logger.debug(
      { entityId, novelty: parsed.novelty, options: parsed.implicitOptions.length },
      'OrientSystem: orientation complete',
    );
  } catch (err) {
    logger.error({ entityId, error: err }, 'OrientSystem: failed to orient');
    engine.setComponent(entityId, 'Orientation', {
      situationFrame: 'Orientation failed — using fallback.',
      novelty: 0.5,
      attentionShift: [],
      implicitOptions: [],
      tick: observation.tick,
    } as unknown as Record<string, unknown>);
  }
}

interface ParsedOrientation {
  situationFrame: string;
  novelty: number;
  beliefUpdates: Record<string, unknown> | null;
  attentionShift: string[];
  implicitOptions: ActionOption[];
}

function parseOrientationResponse(content: string): ParsedOrientation {
  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, content];
  const jsonStr = (jsonMatch[1] ?? content).trim();

  try {
    const parsed = JSON.parse(jsonStr);
    return {
      situationFrame: String(parsed.situationFrame ?? 'Unknown situation'),
      novelty: Math.max(0, Math.min(1, Number(parsed.novelty) || 0)),
      beliefUpdates: parsed.beliefUpdates ?? null,
      attentionShift: Array.isArray(parsed.attentionShift) ? parsed.attentionShift.map(String) : [],
      implicitOptions: Array.isArray(parsed.implicitOptions)
        ? parsed.implicitOptions.map((o: Record<string, unknown>) => ({
            action: String(o.action ?? ''),
            confidence: Math.max(0, Math.min(1, Number(o.confidence) || 0)),
            rationale: String(o.rationale ?? ''),
          }))
        : [],
    };
  } catch {
    return {
      situationFrame: content.slice(0, 200),
      novelty: 0.3,
      beliefUpdates: null,
      attentionShift: [],
      implicitOptions: [],
    };
  }
}

export default createOrientSystem;
