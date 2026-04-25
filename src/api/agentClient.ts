export interface EditorState {
  selection: string;
  content: string;
  documentTitle?: string;
}

export interface ToolResult {
  tool: string;
  success: boolean;
  result?: unknown;
  error?: string;
}

export interface PlannedAction {
  name: 'readSelection' | 'replaceSelection' | 'replaceSelectionWithContent' | 'convertToBullets' | 'convertToBulletsFromLines' | 'convertToNumberedList' | 'applyFormatting' | 'applyHeading' | 'setAlignment' | 'insertTable' | 'setMargin' | 'insertStructuredContent';
  args: Record<string, unknown>;
}

export interface AgentResponse {
  success: boolean;
  logs?: string[];
  toolResults?: ToolResult[];
  plannedActions?: PlannedAction[];
  memory?: { messages: string[] };
  suggestedEdits?: PlannedAction[];
  error?: string;
}

export interface EditorCommands {
  applyBold?: () => void;
  applyItalic?: () => void;
  applyUnderline?: () => void;
  convertToBullets?: () => void;
  convertToNumberedList?: () => void;
  convertMultipleToBullets?: (lines: string[]) => void;
  convertToBulletsFromLines?: (lines: string[]) => void;
  applyHeading?: (level: 1 | 2 | 3 | 4 | 5 | 6) => void;
  setAlignment?: (align: 'left' | 'center' | 'right' | 'justify') => void;
  insertTable?: (rows: number, cols: number) => void;
  replaceText?: (oldText: string, newText: string) => void;
  convertToBulletsWithLines?: (lines: string[]) => void;
  boldFirstWordOfBullets?: () => void;
  insertStructuredContent?: (content: { type: string; content?: string[]; attrs?: Record<string, unknown> }) => void;
}

export async function runAgent(
  goal: string,
  editorState: EditorState,
  editorCommands?: EditorCommands
): Promise<AgentResponse> {
  try {
    const response = await fetch('http://localhost:3001/api/agent/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ goal, editorState }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}`,
      };
    }

    const result = await response.json();

    if (result.plannedActions && editorCommands) {
      for (const action of result.plannedActions) {
        console.log('[AgentClient] Executing action:', action.name, action.args);
        
        switch (action.name) {
          case 'applyFormatting': {
            const options = action.args as { bold?: boolean; italic?: boolean; underline?: boolean; scope?: string } | undefined;
            if (options?.bold) editorCommands.applyBold?.();
            if (options?.italic) editorCommands.applyItalic?.();
            if (options?.underline) editorCommands.applyUnderline?.();
            if (options?.scope === 'first_word') {
              editorCommands.boldFirstWordOfBullets?.();
            }
            if (options?.scope === 'all_lines') {
              console.log('[AgentClient] applyFormatting with scope: all_lines');
            }
            break;
          }
          case 'applyHeading':
            const level = action.args.level as number;
            if (level && editorCommands.applyHeading) {
              const validLevel = Math.min(Math.max(1, level), 6) as 1 | 2 | 3 | 4 | 5 | 6;
              editorCommands.applyHeading(validLevel);
            }
            break;
          case 'setAlignment':
            const align = action.args.align as 'left' | 'center' | 'right' | 'justify';
            if (align && editorCommands.setAlignment) {
              editorCommands.setAlignment(align);
            }
            break;
          case 'replaceSelection':
            const newText = action.args.newText as string | undefined;
            if (newText) {
              if (newText.includes('\n') && editorCommands.convertToBulletsWithLines) {
                const lines = newText.split('\n').filter(l => l.trim());
                editorCommands.convertToBulletsWithLines(lines);
              } else {
                editorCommands.replaceText?.(editorState.selection, newText);
              }
            }
            break;
          case 'replaceSelectionWithContent': {
            const content = action.args.content as { type: string; content?: string[] } | undefined;
            if (content && editorCommands.insertStructuredContent) {
              console.log('[AgentClient] replaceSelectionWithContent:', content);
              editorCommands.insertStructuredContent(content);
            }
            break;
          }
          case 'convertToBullets':
            editorCommands.convertToBullets?.();
            break;
          case 'convertToBulletsFromLines': {
            const lines = action.args.lines as string[] | undefined;
            if (lines && editorCommands.convertToBulletsFromLines) {
              console.log('[AgentClient] convertToBulletsFromLines:', lines);
              editorCommands.convertToBulletsFromLines(lines);
            }
            break;
          }
          case 'convertToNumberedList':
            editorCommands.convertToNumberedList?.();
            break;
          case 'insertTable':
            const rows = action.args.rows as number ?? 3;
            const cols = action.args.cols as number ?? 3;
            if (editorCommands.insertTable) {
              editorCommands.insertTable(rows, cols);
            }
            break;
          case 'insertStructuredContent': {
            const content = action.args.content as { type: string; content?: string[] } | undefined;
            if (content && editorCommands.insertStructuredContent) {
              console.log('[AgentClient] insertStructuredContent:', content);
              editorCommands.insertStructuredContent(content);
            }
            break;
          }
        }
      }
    }

    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Cannot connect to agent server. Please ensure the server is running on port 3001.',
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getAgentMemory(): Promise<{ messages: string[]; contextCount: number }> {
  const response = await fetch('http://localhost:3001/api/agent/memory');
  return response.json();
}

export async function clearAgentMemory(): Promise<void> {
  await fetch('http://localhost:3001/api/agent/memory', {
    method: 'DELETE',
  });
}

export async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:3001/api/health');
    return response.ok;
  } catch {
    return false;
  }
}