/**
 * OODA Loop component type definitions.
 * All components are plain data objects stored via ECS engine.
 */

// --- Observe Phase ---

export interface SensorComponent {
  sensorType: string; // 'tool_output' | 'message' | 'file_watcher' | 'action_result' | custom
  active: boolean;
  config: Record<string, unknown>;
}

export interface EnvironmentComponent {
  variables: Record<string, unknown>;
  lastUpdated: number;
}

export interface Observation {
  source: string;
  data: unknown;
  timestamp: number;
}

export interface ObservationComponent {
  observations: Observation[];
  tick: number;
}

// --- Orient Phase ---

export interface WorldModelComponent {
  beliefs: Record<string, unknown>;
  lastUpdated: number;
  updateCount: number;
}

export interface ExperienceEntry {
  id: string;
  summary: string;
  outcome: string;
  noveltyScore: number;
  tick: number;
  timestamp: number;
}

export interface ExperienceComponent {
  recent: ExperienceEntry[];
  maxEntries: number;
}

export interface IdentityComponent {
  role: string;
  systemPrompt: string;
  coreGoals: string[];
  learnedPreferences: Record<string, string>;
}

export interface OrientationComponent {
  situationFrame: string;
  novelty: number; // 0-1
  attentionShift: string[];
  implicitOptions: ActionOption[];
  tick: number;
}

export interface AttentionFilterComponent {
  priorities: string[];
  activeSensors: string[];
}

export interface ActionOption {
  action: string;
  confidence: number;
  rationale: string;
}

// --- Decide Phase ---

export interface GoalComponent {
  goal: string;
  priority: number;
  status: 'active' | 'achieved' | 'abandoned';
}

export interface ConstraintComponent {
  constraint: string;
  hard: boolean; // hard constraints cannot be violated
}

export interface DecisionComponent {
  selectedAction: string;
  rationale: string;
  deliberate: boolean; // true = System 2 slow path, false = System 1 fast path
  tick: number;
}

// --- Act Phase ---

export interface ToolComponent {
  toolName: string;
  description: string;
  inputSchema: Record<string, unknown>;
  executor: string; // reference to tool executor id
}

export interface ActionResultComponent {
  action: string;
  success: boolean;
  result: unknown;
  error?: string;
  tick: number;
  timestamp: number;
}

// --- Memory ---

export interface WorkingMemoryComponent {
  observations: Observation[];
  tickContext: string;
}

export interface EpisodicMemoryComponent {
  episodes: Episode[];
  persistThreshold: number;
  maxEpisodes: number;
}

export interface Episode {
  summary: string;
  observations: Observation[];
  decision: string;
  result: unknown;
  noveltyScore: number;
  tick: number;
  timestamp: number;
}

export interface SemanticMemoryComponent {
  entityId: string;
}

export interface ProceduralMemoryComponent {
  skills: SkillRecord[];
}

export interface SkillRecord {
  id: string;
  name: string;
  description: string;
  preconditions: string[];
  toolSequence: ToolStep[];
  successCriteria: string;
  failureModes: string[];
  successCount: number;
  failureCount: number;
  avgReward: number;
  source: 'learned' | 'imported' | 'agentskills.io';
  createdAt: number;
  updatedAt: number;
}

export interface ToolStep {
  toolName: string;
  parameters: Record<string, unknown>;
  description: string;
}

// --- Tick Metadata ---

export interface TickMetadataComponent {
  tickNumber: number;
  startTime: number;
  phaseDurations: {
    observe: number;
    orient: number;
    decide: number;
    act: number;
  };
  worldModelUpdated: boolean;
}

// --- Multi-Agent ---

export interface InboxComponent {
  messages: AgentMessage[];
}

export interface OutboxComponent {
  messages: AgentMessage[];
}

export interface AgentMessage {
  from: string;
  to: string;
  content: string;
  metadata: Record<string, unknown>;
  timestamp: number;
}

export interface ParentAgentComponent {
  parentEntityId: string;
}

export interface ChildAgentsComponent {
  childEntityIds: string[];
}
