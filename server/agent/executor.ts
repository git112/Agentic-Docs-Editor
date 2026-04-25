import { ToolName, ToolCall, StructuredContent } from './types';
import { EditorAPI } from './tools';
import { 
  validateProseMirrorJSON, 
  logNodeOperation, 
  createBulletList, 
  createOrderedList,
  splitTextIntoLines 
} from './nodeUtils';

const VALID_TOOLS: ToolName[] = [
  'readSelection',
  'replaceSelection',
  'replaceSelectionWithContent',
  'convertToBullets',
  'convertToNumberedList',
  'convertToBulletsFromLines',
  'applyFormatting',
  'applyHeading',
  'setAlignment',
  'insertTable',
  'setMargin',
  'insertStructuredContent'
];

function validateTool(toolName: string): toolName is ToolName {
  if (!VALID_TOOLS.includes(toolName as ToolName)) {
    throw new Error(`Invalid tool: "${toolName}". Only use tools from the available tool list: ${VALID_TOOLS.join(', ')}`);
  }
  return true;
}

function validateStructuredContent(content: unknown): { valid: boolean; errors: string[] } {
  if (!content || typeof content !== 'object') {
    return { valid: false, errors: ['Content must be an object'] };
  }
  const c = content as Record<string, unknown>;
  if (!c.type || typeof c.type !== 'string') {
    return { valid: false, errors: ['Content must have a type'] };
  }
  return { valid: true, errors: [] };
}

export async function executeTools(plan: ToolCall[], editor: EditorAPI): Promise<void> {
  for (const step of plan) {
    try {
      validateTool(step.name);

      switch (step.name) {
        case 'readSelection':
          console.log('[Executor] readSelection');
          await editor.readSelection();
          break;
        case 'replaceSelection':
          console.log('[Executor] replaceSelection');
          await editor.replaceSelection(step.args.newText as string);
          break;
        case 'replaceSelectionWithContent': {
          const content = step.args.content as StructuredContent;
          console.log('[Executor] replaceSelectionWithContent', content);
          await editor.replaceSelectionWithContent(content);
          break;
        }
        case 'convertToBullets':
          console.log('[Executor] convertToBullets');
          await editor.convertToBullets();
          break;
        case 'convertToNumberedList':
          console.log('[Executor] convertToNumberedList');
          await editor.convertToNumberedList();
          break;
        case 'convertToBulletsFromLines': {
          const lines = step.args.lines as string[];
          console.log('[Executor] convertToBulletsFromLines', lines);
          logNodeOperation('convertToBulletsFromLines', { input: lines }, createBulletList(lines));
          await editor.convertToBulletsFromLines(lines);
          break;
        }
        case 'applyFormatting': {
          const { bold, italic, underline, scope } = step.args as { bold?: boolean; italic?: boolean; underline?: boolean; scope?: 'selection' | 'line' | 'first_word' | 'all_lines' };
          console.log('[Executor] applyFormatting', { bold, italic, underline, scope });
          await editor.applyFormatting({ bold, italic, underline, scope });
          break;
        }
        case 'applyHeading':
          console.log('[Executor] applyHeading');
          await editor.applyHeading(step.args.level as 1 | 2 | 3 | 4 | 5 | 6);
          break;
        case 'setAlignment':
          console.log('[Executor] setAlignment');
          await editor.setAlignment(step.args.align as 'left' | 'center' | 'right' | 'justify');
          break;
        case 'insertTable':
          console.log('[Executor] insertTable');
          await editor.insertTable(
            step.args.rows as number ?? 3,
            step.args.cols as number ?? 3
          );
          break;
        case 'setMargin':
          console.log('[Executor] setMargin');
          await editor.setMargin(step.args as { top?: number; right?: number; bottom?: number; left?: number });
          break;
        case 'insertStructuredContent': {
          const content = step.args.content as StructuredContent;
          console.log('[Executor] insertStructuredContent', content);
          await editor.insertStructuredContent(content);
          break;
        }
        default:
          console.warn(`[Executor] Unknown tool: ${step.name}`);
      }
    } catch (error) {
      console.error(`[Executor] Error executing tool ${step.name}:`, error);
      throw error;
    }
  }
}