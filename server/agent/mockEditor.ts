import { EditorAPI } from './tools';
import { StructuredContent } from './types';
import { createBulletList, createOrderedList, splitTextIntoLines } from './nodeUtils';

class MockDocument {
  private content = 'This is a sample paragraph that should be converted to bullet points.';
  private selection = this.content;

  getContent(): string {
    return this.content;
  }

  setContent(text: string): void {
    this.content = text;
    this.selection = text;
  }

  getSelection(): string {
    return this.selection;
  }

  convertToBullets(): void {
    this.content = '- This is a sample\n- Paragraph that should\n- Be converted to bullet points';
    this.selection = this.content;
  }
}

const doc = new MockDocument();

export const mockEditor: EditorAPI = {
  async readSelection(): Promise<string> {
    console.log('[MockEditor] readSelection() called');
    return doc.getSelection();
  },

  async replaceSelection(newText: string): Promise<void> {
    console.log(`[MockEditor] replaceSelection("${newText}") called`);
    doc.setContent(newText);
  },

  async replaceSelectionWithContent(content: StructuredContent): Promise<void> {
    console.log(`[MockEditor] replaceSelectionWithContent(${JSON.stringify(content)}) called`);
    if (content.type === 'bulletList' && content.content) {
      const bulletList = createBulletList(content.content);
      doc.setContent(JSON.stringify(bulletList));
    } else if (content.type === 'orderedList' && content.content) {
      const orderedList = createOrderedList(content.content);
      doc.setContent(JSON.stringify(orderedList));
    } else if (content.type === 'paragraph' && content.content) {
      doc.setContent(content.content.join('\n'));
    }
  },

  async convertToBullets(): Promise<void> {
    console.log('[MockEditor] convertToBullets() called');
    doc.convertToBullets();
  },

  async convertToNumberedList(): Promise<void> {
    console.log('[MockEditor] convertToNumberedList() called');
  },

  async convertToBulletsFromLines(lines: string[]): Promise<void> {
    console.log(`[MockEditor] convertToBulletsFromLines(${JSON.stringify(lines)}) called`);
    const bulletList = createBulletList(lines);
    doc.setContent(JSON.stringify(bulletList, null, 2));
  },

  async applyFormatting(options: { bold?: boolean; italic?: boolean; underline?: boolean; scope?: string }): Promise<void> {
    console.log(`[MockEditor] applyFormatting(${JSON.stringify(options)}) called`);
  },

  async applyHeading(level: 1 | 2 | 3 | 4 | 5 | 6): Promise<void> {
    console.log(`[MockEditor] applyHeading(level=${level}) called`);
  },

  async setAlignment(align: 'left' | 'center' | 'right' | 'justify'): Promise<void> {
    console.log(`[MockEditor] setAlignment(${align}) called`);
  },

  async insertTable(rows: number, cols: number): Promise<void> {
    console.log(`[MockEditor] insertTable(${rows}x${cols}) called`);
  },

  async setMargin(values: { top?: number; right?: number; bottom?: number; left?: number }): Promise<void> {
    console.log(`[MockEditor] setMargin(${JSON.stringify(values)}) called`);
  },

  async insertStructuredContent(content: StructuredContent): Promise<void> {
    console.log(`[MockEditor] insertStructuredContent(${JSON.stringify(content)}) called`);
    if (content.type === 'bulletList' && content.content) {
      const bulletList = createBulletList(content.content);
      doc.setContent(JSON.stringify(bulletList, null, 2));
    } else if (content.type === 'orderedList' && content.content) {
      const orderedList = createOrderedList(content.content);
      doc.setContent(JSON.stringify(orderedList, null, 2));
    } else if (content.type === 'paragraph' && content.content) {
      doc.setContent(content.content.join('\n'));
    }
  }
};

export function resetMockDocument(): void {
  doc.setContent('This is a sample paragraph that should be converted to bullet points.');
}