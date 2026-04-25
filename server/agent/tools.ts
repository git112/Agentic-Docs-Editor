import { StructuredContent } from './types';

export interface EditorAPI {
  readSelection(): Promise<string>;
  replaceSelection(newText: string): Promise<void>;
  replaceSelectionWithContent(content: StructuredContent): Promise<void>;
  convertToBullets(): Promise<void>;
  convertToNumberedList(): Promise<void>;
  convertToBulletsFromLines(lines: string[]): Promise<void>;
  applyFormatting(options: { bold?: boolean; italic?: boolean; underline?: boolean; scope?: 'selection' | 'line' | 'first_word' | 'all_lines' }): Promise<void>;
  applyHeading(level: 1 | 2 | 3 | 4 | 5 | 6): Promise<void>;
  setAlignment(align: 'left' | 'center' | 'right' | 'justify'): Promise<void>;
  insertTable(rows: number, cols: number): Promise<void>;
  setMargin(values: { top?: number; right?: number; bottom?: number; left?: number }): Promise<void>;
  insertStructuredContent(content: StructuredContent): Promise<void>;
}
