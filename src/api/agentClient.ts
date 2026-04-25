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
  name: 'readSelection' | 'replaceSelection' | 'convertToBullets' | 'setMargin' | 'applyFormatting';
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
  replaceText?: (oldText: string, newText: string) => void;
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
        switch (action.name) {
          case 'applyFormatting':
            const options = action.args.options as { bold?: boolean; italic?: boolean; underline?: boolean } | undefined;
            if (options?.bold) {
              editorCommands.applyBold?.();
            }
            if (options?.italic) {
              editorCommands.applyItalic?.();
            }
            if (options?.underline) {
              editorCommands.applyUnderline?.();
            }
            break;
          case 'convertToBullets':
            editorCommands.convertToBullets?.();
            break;
          case 'replaceSelection':
            if (action.args.text && typeof action.args.text === 'string') {
              editorCommands.replaceText?.(editorState.selection, action.args.text);
            }
            break;
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