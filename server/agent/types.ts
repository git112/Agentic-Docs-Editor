export type ToolName = 'readSelection' | 'replaceSelection' | 'convertToBullets' | 'setMargin' | 'applyFormatting';

export interface ToolCall {
  name: ToolName;
  args: Record<string, unknown>;
}

export interface EditorState {
  selection: string;
  content: string;
  documentTitle?: string;
}

export interface AgentState {
  goal: string;
  context: EditorState;
  plan: ToolCall[];
}
