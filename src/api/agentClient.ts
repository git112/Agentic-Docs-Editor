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
  name: 'readSelection' | 'replaceSelection' | 'convertToBullets' | 'convertToProperBullets' | 'setMargin' | 'applyFormatting';
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
  convertMultipleToBullets?: (lines: string[]) => void;
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

    console.log('[AgentClient] Response:', JSON.stringify(result, null, 2));

    if (result.plannedActions && editorCommands) {
      console.log('[AgentClient] Executing', result.plannedActions.length, 'planned actions');
      for (const action of result.plannedActions) {
        console.log('[AgentClient] Action:', JSON.stringify(action));
        switch (action.name) {
          case 'applyFormatting':
            const options = action.args.options as { bold?: boolean; italic?: boolean; underline?: boolean } | undefined;
            const directBold = action.args.bold as boolean | undefined;
            const directItalic = action.args.italic as boolean | undefined;
            const directUnderline = action.args.underline as boolean | undefined;
            const bold = options?.bold ?? directBold;
            const italic = options?.italic ?? directItalic;
            const underline = options?.underline ?? directUnderline;
            console.log('[AgentClient] applyFormatting - options:', options, 'direct:', { bold, italic, underline });
            if (bold) {
              console.log('[AgentClient] Calling applyBold');
              editorCommands.applyBold?.();
            }
            if (italic) {
              console.log('[AgentClient] Calling applyItalic');
              editorCommands.applyItalic?.();
            }
            if (underline) {
              console.log('[AgentClient] Calling applyUnderline');
              editorCommands.applyUnderline?.();
            }
            break;
          case 'convertToBullets':
            console.log('[AgentClient] Calling convertToBullets');
            editorCommands.convertToBullets?.();
            break;
          case 'convertToProperBullets':
            const lines = action.args.lines as string[] | undefined;
            console.log('[AgentClient] convertToProperBullets lines:', lines);
            if (lines && editorCommands.convertMultipleToBullets) {
              editorCommands.convertMultipleToBullets(lines);
            } else if (lines) {
              for (const line of lines) {
                editorCommands.replaceText?.('', line);
              }
            }
            break;
          case 'replaceSelection':
            if (action.args.text && typeof action.args.text === 'string') {
              console.log('[AgentClient] replaceSelection:', action.args.text);
              editorCommands.replaceText?.(editorState.selection, action.args.text);
            }
            break;
        }
      }
    } else {
      console.log('[AgentClient] No plannedActions or editorCommands');
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