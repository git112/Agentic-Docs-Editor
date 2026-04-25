export interface EditorAPI {
  readSelection(): Promise<string>;
  replaceSelection(text: string): Promise<void>;
  convertToBullets(): Promise<void>;
  setMargin(values: { top?: number; right?: number; bottom?: number; left?: number }): Promise<void>;
  applyFormatting(options: { bold?: boolean; italic?: boolean; underline?: boolean }): Promise<void>;
}
