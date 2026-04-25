import { EditorAPI } from './tools';

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

  async replaceSelection(text: string): Promise<void> {
    console.log(`[MockEditor] replaceSelection("${text}") called`);
    doc.setContent(text);
  },

  async convertToBullets(): Promise<void> {
    console.log('[MockEditor] convertToBullets() called');
    doc.convertToBullets();
  },

  async setMargin(values: { top?: number; right?: number; bottom?: number; left?: number }): Promise<void> {
    console.log(`[MockEditor] setMargin(${JSON.stringify(values)}) called`);
  },

  async applyFormatting(options: { bold?: boolean; italic?: boolean; underline?: boolean }): Promise<void> {
    console.log(`[MockEditor] applyFormatting(${JSON.stringify(options)}) called`);
  }
};

export function resetMockDocument(): void {
  doc.setContent('This is a sample paragraph that should be converted to bullet points.');
}