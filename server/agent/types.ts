export type ToolName = 'readSelection' | 'replaceSelection' | 'replaceSelectionWithContent' | 'convertToBullets' | 'convertToNumberedList' | 'convertToBulletsFromLines' | 'applyFormatting' | 'applyHeading' | 'setAlignment' | 'insertTable' | 'setMargin' | 'insertStructuredContent';

export interface ApplyFormattingArgs {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  scope?: 'selection' | 'line' | 'first_word' | 'all_lines';
}

export interface StructuredContent {
  type: 'bulletList' | 'orderedList' | 'paragraph';
  content?: string[];
  attrs?: Record<string, unknown>;
}

export interface InsertStructuredContentArgs {
  content: StructuredContent;
}

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
