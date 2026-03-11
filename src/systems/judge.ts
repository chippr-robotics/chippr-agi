import { z } from 'zod';
import type { Engine } from '../ecs/engine.js';
import type { System } from '../ecs/types.js';

const JudgementSchema = z.object({
  complete: z.boolean(),
  reasoning: z.string(),
  score: z.number().min(0).max(1),
});

export default function createJudge(engine: Engine): System {
  return {
    name: 'TheJudge',
    version: '2.0.0',
    type: 'core',
    description: 'Evaluates whether a task was completed successfully.',

    init() {
      engine.on('task:completed', (event) => this.handleEvent(event));
    },

    async handleEvent(event) {
      const taskDesc = engine.getComponent(event.entityId, 'TaskDescription');
      if (!taskDesc) return;

      const result = event.data.result as string | undefined;

      const response = await engine.getProvider().generate([
        {
          role: 'system',
          content:
            'You are a task evaluator. Given a task description and its result, determine if the task was completed successfully. Respond with a JSON object: {complete: boolean, reasoning: string, score: number (0-1)}. Nothing else.',
        },
        {
          role: 'user',
          content: `Task: "${taskDesc.task}"\nResult: "${result ?? 'No result provided'}"`,
        },
      ]);

      let parsed;
      try {
        parsed = JudgementSchema.safeParse(JSON.parse(response.content));
      } catch {
        engine.getLogger().warn({ content: response.content }, 'TheJudge: failed to parse response');
        return;
      }

      if (!parsed.success) {
        engine.getLogger().warn({ err: parsed.error }, 'TheJudge: invalid response schema');
        return;
      }

      engine.addComponent(event.entityId, 'Judgement', parsed.data);

      if (parsed.data.complete) {
        engine.setComponent(event.entityId, 'TaskDescription', {
          ...taskDesc,
          complete: true,
        });
      }

      engine.emit({
        type: 'task:judged',
        entityId: event.entityId,
        data: parsed.data,
        source: 'TheJudge',
        timestamp: Date.now(),
      });
    },
  };
}
