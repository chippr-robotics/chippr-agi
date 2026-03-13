import { createHash } from 'node:crypto';

export function entityId(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 16);
}

export function uniqueId(): string {
  return entityId(`${Date.now()}-${Math.random()}`);
}
