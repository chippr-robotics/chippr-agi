import type { Engine } from '../ecs/engine.js';
import type { System } from '../ecs/types.js';
import { uniqueId } from '../util/hash.js';

/**
 * Parses a simplified cron expression and checks if it should run now.
 * Supports: "* * * * *" (min hour dom month dow) and "@every Ns/Nm/Nh"
 */
function shouldRun(cron: string, lastRun: number | null, now: number): boolean {
  const everyMatch = cron.match(/^@every\s+(\d+)([smh])$/);
  if (everyMatch) {
    const value = parseInt(everyMatch[1], 10);
    const unit = everyMatch[2];
    const intervalMs =
      unit === 's' ? value * 1000 : unit === 'm' ? value * 60_000 : value * 3_600_000;
    return lastRun === null || now - lastRun >= intervalMs;
  }

  // Standard cron: validate format first
  const parts = cron.split(/\s+/);
  if (parts.length !== 5) return false;

  if (lastRun === null) return true;
  const date = new Date(now);

  const [min, hour] = parts;
  if (min !== '*' && parseInt(min, 10) !== date.getMinutes()) return false;
  if (hour !== '*' && parseInt(hour, 10) !== date.getHours()) return false;

  // Only run once per minute
  return now - lastRun >= 60_000;
}

export default function createScheduler(engine: Engine): System {
  let timer: ReturnType<typeof setInterval> | null = null;

  return {
    name: 'Scheduler',
    version: '2.0.0',
    type: 'core',
    description: 'Runs scheduled tasks based on cron expressions.',

    init() {
      timer = setInterval(() => this.handleEvent({
        type: 'scheduler:tick',
        entityId: '',
        data: {},
        source: 'Scheduler',
        timestamp: Date.now(),
      }), 60_000);
    },

    async handleEvent(_event) {
      const now = Date.now();
      const tasks = engine.getStore().getScheduledTasks();

      for (const task of tasks) {
        if (shouldRun(task.cron, task.last_run, now)) {
          const entityId = uniqueId();
          engine.createEntity(entityId);
          engine.addComponent(entityId, 'TaskDescription', {
            task: task.prompt,
            complete: false,
            scheduled: true,
            scheduleId: task.id,
          });

          engine.getStore().updateTaskLastRun(task.id, now);

          engine.emit({
            type: 'entity:needs-routing',
            entityId,
            data: { scheduleId: task.id },
            source: 'Scheduler',
            timestamp: now,
          });
        }
      }
    },
  };
}

export { shouldRun };
