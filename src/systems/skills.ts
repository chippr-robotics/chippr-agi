import type { Engine } from '../ecs/engine.js';
import type { System, EntityId } from '../ecs/types.js';
import type {
  ActionResultComponent,
  EpisodicMemoryComponent,
  ProceduralMemoryComponent,
  SkillRecord,
  ToolStep,
} from '../core/components.js';
import { MemoryStore } from '../store/memory-store.js';
import { uniqueId } from '../util/hash.js';

const SKILL_CREATION_MIN_STEPS = 2;
const FAILURE_RESYNTHESIZE_THRESHOLD = 3;
const EMA_ALPHA = 0.3;

/**
 * SkillCreationSystem: After a successful multi-step action sequence,
 * synthesizes a reusable skill from the episodic memory buffer.
 * Skills are per-entity — different agents learn different skills.
 */
export function createSkillCreationSystem(engine: Engine): System {
  const memoryStore = new MemoryStore(engine.getStore().db);

  return {
    name: 'SkillCreationSystem',
    version: '1.0.0',
    type: 'system',
    description: 'Synthesizes reusable skills from successful multi-step action sequences',

    init() {},

    async handleEvent(event) {
      if (event.type === 'ooda:tick-complete') {
        await maybeCreateSkill(engine, memoryStore, event.entityId);
      }
    },
  };
}

async function maybeCreateSkill(engine: Engine, memoryStore: MemoryStore, entityId: EntityId): Promise<void> {
  const logger = engine.getLogger();

  const actionResult = engine.getComponent<ActionResultComponent>(entityId, 'ActionResult');
  if (!actionResult?.success) return;

  const episodic = engine.getComponent<EpisodicMemoryComponent>(entityId, 'EpisodicMemory');
  if (!episodic || episodic.episodes.length < SKILL_CREATION_MIN_STEPS) return;

  // Look at the recent episode sequence for a multi-step success pattern
  const recentEpisodes = episodic.episodes.slice(-SKILL_CREATION_MIN_STEPS);
  const allSuccessful = recentEpisodes.every((ep) => {
    const result = ep.result as Record<string, unknown> | null;
    return result && result.executed;
  });

  if (!allSuccessful) return;

  const provider = engine.getProvider();

  const systemPrompt = `You are a skill synthesizer. Given a sequence of successful action episodes, extract a reusable skill template.

Respond with valid JSON:
{
  "name": "string — short skill name",
  "description": "string — what the skill does",
  "preconditions": ["conditions that must be true to use this skill"],
  "toolSequence": [{"toolName": "string", "parameters": {}, "description": "string"}],
  "successCriteria": "string — how to verify the skill worked",
  "failureModes": ["possible failure modes"]
}`;

  try {
    const response = await provider.generate([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify({ episodes: recentEpisodes }) },
    ]);

    const jsonMatch = response.content.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, response.content];
    const parsed = JSON.parse((jsonMatch[1] ?? response.content).trim());

    const skill: SkillRecord = {
      id: uniqueId(),
      name: String(parsed.name ?? 'unnamed-skill'),
      description: String(parsed.description ?? ''),
      preconditions: Array.isArray(parsed.preconditions) ? parsed.preconditions.map(String) : [],
      toolSequence: Array.isArray(parsed.toolSequence)
        ? parsed.toolSequence.map((s: Record<string, unknown>) => ({
            toolName: String(s.toolName ?? ''),
            parameters: (s.parameters ?? {}) as Record<string, unknown>,
            description: String(s.description ?? ''),
          }))
        : [],
      successCriteria: String(parsed.successCriteria ?? ''),
      failureModes: Array.isArray(parsed.failureModes) ? parsed.failureModes.map(String) : [],
      successCount: 1,
      failureCount: 0,
      avgReward: 1.0,
      source: 'learned',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Store in procedural memory table
    memoryStore.addProcedural(
      entityId,
      skill.id,
      skill.name,
      skill.description,
      skill.toolSequence as unknown as ToolStep[],
      skill.source,
    );

    // Update component
    const procedural = engine.getComponent<ProceduralMemoryComponent>(entityId, 'ProceduralMemory') ?? { skills: [] };
    procedural.skills.push(skill);
    engine.setComponent(entityId, 'ProceduralMemory', procedural as unknown as Record<string, unknown>);

    engine.emit({
      type: 'skill:created',
      entityId,
      data: { skillId: skill.id, skillName: skill.name },
      source: 'SkillCreationSystem',
      timestamp: Date.now(),
    });

    logger.info({ entityId, skillName: skill.name }, 'SkillCreation: new skill synthesized');
  } catch (err) {
    logger.debug({ entityId, error: err }, 'SkillCreation: skill synthesis failed');
  }
}

/**
 * SkillImprovementSystem: Updates skill stats when skills are used.
 * Flags skills for re-synthesis when failure count exceeds threshold.
 */
export function createSkillImprovementSystem(engine: Engine): System {
  const memoryStore = new MemoryStore(engine.getStore().db);

  return {
    name: 'SkillImprovementSystem',
    version: '1.0.0',
    type: 'system',
    description: 'Tracks skill success/failure rates and flags degrading skills for re-synthesis',

    init() {},

    async handleEvent(event) {
      if (event.type === 'skill:used') {
        const { skillId, success, reward } = event.data as {
          skillId: string;
          success: boolean;
          reward: number;
        };
        memoryStore.updateProceduralStats(skillId, success, reward);

        // Check if skill needs re-synthesis
        const skill = memoryStore.getProceduralById(skillId);
        if (skill && skill.failureCount >= FAILURE_RESYNTHESIZE_THRESHOLD) {
          engine.emit({
            type: 'skill:needs-resynth',
            entityId: event.entityId,
            data: { skillId: skill.id, skillName: skill.skillName, failures: skill.failureCount },
            source: 'SkillImprovementSystem',
            timestamp: Date.now(),
          });
        }
      }
    },
  };
}

export default createSkillCreationSystem;
