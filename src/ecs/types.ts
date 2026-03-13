export type EntityId = string;

export interface Component {
  name: string;
  data: Record<string, unknown>;
}

export interface System {
  name: string;
  version: string;
  type: 'core' | 'system';
  description: string;
  init: () => void | Promise<void>;
  handleEvent: (event: ECSEvent) => void | Promise<void>;
}

export interface ECSEvent {
  type: string;
  entityId: EntityId;
  component?: string;
  data: Record<string, unknown>;
  source: string;
  timestamp: number;
}
