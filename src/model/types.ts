export interface ModelMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  content: string;
  isError?: boolean;
}

export interface ModelResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage?: { inputTokens: number; outputTokens: number };
}

export type ToolExecutor = (call: ToolCall) => Promise<ToolResult>;

export interface AgentEvent {
  type: 'text' | 'tool_call' | 'tool_result' | 'done';
  data: unknown;
}

export interface ModelProvider {
  generate(messages: ModelMessage[], tools?: ToolDefinition[]): Promise<ModelResponse>;
  agentLoop?(prompt: string, tools: ToolDefinition[], executor: ToolExecutor): AsyncGenerator<AgentEvent>;
}
