import type { Engine } from '../ecs/engine.js';
import type { System } from '../ecs/types.js';
import type { OutboxComponent, InboxComponent, AgentMessage } from '../core/components.js';

/**
 * InterAgentMessageSystem: Routes messages between agent entities.
 * Messages in an agent's Outbox are delivered to the target's Inbox.
 * Messages flow through the receiver's ObserveSystem like any other signal.
 */
export function createInterAgentMessageSystem(engine: Engine): System {
  return {
    name: 'InterAgentMessageSystem',
    version: '1.0.0',
    type: 'core',
    description: 'Routes asynchronous messages between agent entities via Outbox → Inbox',

    init() {},

    async handleEvent(event) {
      if (event.type === 'messaging:flush') {
        flushMessages(engine);
      } else if (event.type === 'message:send') {
        const msg = event.data as unknown as AgentMessage;
        deliverMessage(engine, msg);
      }
    },
  };
}

/**
 * Flush all outbox messages across all entities.
 * Call this between OODA ticks to deliver inter-agent messages.
 */
export function flushMessages(engine: Engine): void {
  const logger = engine.getLogger();
  const outboxEntities = engine.getEntitiesByComponent('Outbox');
  let delivered = 0;

  for (const senderId of outboxEntities) {
    const outbox = engine.getComponent<OutboxComponent>(senderId, 'Outbox');
    if (!outbox || outbox.messages.length === 0) continue;

    for (const msg of outbox.messages) {
      deliverMessage(engine, msg);
      delivered++;
    }

    // Clear outbox after delivery
    engine.setComponent(senderId, 'Outbox', { messages: [] } as unknown as Record<string, unknown>);
  }

  if (delivered > 0) {
    logger.debug({ delivered }, 'Messaging: flushed messages');
  }
}

function deliverMessage(engine: Engine, msg: AgentMessage): void {
  const logger = engine.getLogger();

  if (!engine.entityExists(msg.to)) {
    logger.warn({ to: msg.to, from: msg.from }, 'Messaging: target entity does not exist');
    return;
  }

  const inbox = engine.getComponent<InboxComponent>(msg.to, 'Inbox') ?? { messages: [] };
  inbox.messages.push(msg);
  engine.setComponent(msg.to, 'Inbox', inbox as unknown as Record<string, unknown>);
}

export default createInterAgentMessageSystem;
