import { z } from 'zod';
import type { Engine } from '../ecs/engine.js';
import type { System } from '../ecs/types.js';
import { uniqueId } from '../util/hash.js';

const TaskListSchema = z.array(
  z.object({
    task: z.string(),
    taskId: z.string(),
  }),
);

export default function createTaskGenerator(engine: Engine): System {
  return {
    name: 'TaskGenerator',
    version: '2.0.0',
    type: 'system',
    description: 'Breaks objectives into discrete, actionable tasks.',

    init() {
      engine.on('system:selected', (event) => {
        if (event.data.system === 'TaskGenerator') this.handleEvent(event);
      });
    },

    async handleEvent(event) {
      const objective =
        engine.getComponent(event.entityId, 'ObjectiveDescription') ??
        engine.getComponent(event.entityId, 'TaskDescription');
      if (!objective) return;

      const taskText = (objective.task ?? objective.objective ?? '') as string;
      if (!taskText) return;

      const response = await engine.getProvider().generate([
        {
          role: 'system',
          content:
            'You are a task planner. Break the objective into concrete subtasks. Respond with a JSON array of {task, taskId} objects. Nothing else.',
        },
        { role: 'user', content: taskText },
      ]);

      let parsed;
      try {
        parsed = TaskListSchema.safeParse(JSON.parse(response.content));
      } catch {
        engine.getLogger().warn({ content: response.content }, 'TaskGenerator: failed to parse response');
        return;
      }

      if (!parsed.success) {
        engine.getLogger().warn({ err: parsed.error }, 'TaskGenerator: invalid response schema');
        return;
      }

      for (const task of parsed.data) {
        const id = task.taskId || uniqueId();
        engine.createEntity(id);
        engine.addComponent(id, 'TaskDescription', { task: task.task, complete: false });
        engine.addComponent(id, 'TaskParent', { parentId: event.entityId });
        engine.emit({
          type: 'entity:needs-routing',
          entityId: id,
          data: {},
          source: 'TaskGenerator',
          timestamp: Date.now(),
        });
      }
    },
  };
}
