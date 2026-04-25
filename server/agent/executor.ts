import { ToolCall } from './types';
import { EditorAPI } from './tools';

export async function executeTools(plan: ToolCall[], editor: EditorAPI): Promise<void> {
  for (const step of plan) {
    try {
      switch (step.name) {
        case 'readSelection':
          await editor.readSelection();
          break;
        case 'replaceSelection':
          await editor.replaceSelection(step.args.text as string);
          break;
        case 'convertToBullets':
          await editor.convertToBullets();
          break;
        case 'setMargin':
          await editor.setMargin(step.args.values as { top?: number; right?: number; bottom?: number; left?: number });
          break;
        case 'applyFormatting':
          await editor.applyFormatting(step.args.options as { bold?: boolean; italic?: boolean; underline?: boolean });
          break;
        default:
          console.warn(`Unknown tool: ${(step as ToolCall).name}`);
      }
    } catch (error) {
      console.error(`Error executing tool ${step.name}:`, error);
      throw error;
    }
  }
}
