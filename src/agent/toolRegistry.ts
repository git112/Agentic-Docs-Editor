export interface ToolDefinition {
  name: string;
  category: 'formatting' | 'content' | 'structure' | 'document';
  description: string;
  parameters: ParameterDefinition[];
  examples: string[];
}

export interface ParameterDefinition {
  name: string;
  type: 'string' | 'boolean' | 'number' | 'array';
  required: boolean;
  description: string;
  default?: unknown;
}

export interface ToolHandler {
  name: string;
  execute: (args: Record<string, unknown>, context: ToolContext) => void;
}

export interface ToolContext {
  selection: { from: number; to: number; text: string };
  editorCommands: EditorCommands;
  getMarkState?: () => { bold: boolean; italic: boolean; underline: boolean };
}

export interface EditorCommands {
  applyBold?: () => void;
  applyItalic?: () => void;
  applyUnderline?: () => void;
  convertToBullets?: () => void;
  convertToNumberedList?: () => void;
  convertMultipleToBullets?: (lines: string[]) => void;
  applyHeading?: (level: 1 | 2 | 3 | 4 | 5 | 6) => void;
  setAlignment?: (align: 'left' | 'center' | 'right' | 'justify') => void;
  setTextColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  insertImage?: (src: string) => void;
  createTable?: (rows: number, cols: number) => void;
  setLineHeight?: (height: number) => void;
  setBlockMargin?: (margin: { top?: number; bottom?: number }) => void;
  replaceText?: (oldText: string, newText: string) => void;
  insertTable?: (rows: number, cols: number) => void;
}

export const TOOL_REGISTRY: ToolDefinition[] = [
  {
    name: 'applyBold',
    category: 'formatting',
    description: 'Apply bold formatting to selected text without changing content',
    parameters: [
      { name: 'value', type: 'boolean', required: false, description: 'true to apply, false to remove', default: true }
    ],
    examples: ['Make this text bold', 'Apply bold to selection']
  },
  {
    name: 'applyItalic',
    category: 'formatting',
    description: 'Apply italic formatting to selected text without changing content',
    parameters: [
      { name: 'value', type: 'boolean', required: false, description: 'true to apply, false to remove', default: true }
    ],
    examples: ['Make this italic', 'Apply italic to selection']
  },
  {
    name: 'applyUnderline',
    category: 'formatting',
    description: 'Apply underline formatting to selected text without changing content',
    parameters: [
      { name: 'value', type: 'boolean', required: false, description: 'true to apply, false to remove', default: true }
    ],
    examples: ['Underline this text', 'Add underline']
  },
  {
    name: 'applyHeading',
    category: 'formatting',
    description: 'Convert selected text to a heading',
    parameters: [
      { name: 'level', type: 'number', required: true, description: 'Heading level (1-6)' }
    ],
    examples: ['Make this a heading', 'Convert to H1', 'Apply heading level 2']
  },
  {
    name: 'convertToBullets',
    category: 'structure',
    description: 'Convert selected text to bullet point list',
    parameters: [],
    examples: ['Convert to bullets', 'Make this a bullet list', 'Create bullet points']
  },
  {
    name: 'convertToNumberedList',
    category: 'structure',
    description: 'Convert selected text to numbered list',
    parameters: [],
    examples: ['Convert to numbered list', 'Make this numbered']
  },
  {
    name: 'setAlignment',
    category: 'formatting',
    description: 'Set text alignment for selected paragraph(s)',
    parameters: [
      { name: 'align', type: 'string', required: true, description: 'Alignment: left, center, right, justify' }
    ],
    examples: ['Align center', 'Set alignment to right']
  },
  {
    name: 'setTextColor',
    category: 'formatting',
    description: 'Change text color of selected text',
    parameters: [
      { name: 'color', type: 'string', required: true, description: 'Color hex code or name (e.g., #FF0000, red)' }
    ],
    examples: ['Change color to red', 'Make text blue']
  },
  {
    name: 'insertTable',
    category: 'structure',
    description: 'Insert a table at cursor position',
    parameters: [
      { name: 'rows', type: 'number', required: false, description: 'Number of rows', default: 3 },
      { name: 'cols', type: 'number', required: false, description: 'Number of columns', default: 3 }
    ],
    examples: ['Insert table', 'Add a 4x4 table']
  },
  {
    name: 'setLineHeight',
    category: 'formatting',
    description: 'Set line height for selected paragraph(s)',
    parameters: [
      { name: 'height', type: 'number', required: true, description: 'Line height multiplier (e.g., 1.5, 2)' }
    ],
    examples: ['Set line height to 1.5', 'Increase line spacing']
  },
  {
    name: 'replaceText',
    category: 'content',
    description: 'Replace selected text with new content (for rewrites, summaries)',
    parameters: [
      { name: 'newText', type: 'string', required: true, description: 'The replacement text' }
    ],
    examples: ['Rewrite this paragraph', 'Summarize this text']
  }
];

export function generateToolPrompt(): string {
  return TOOL_REGISTRY.map(tool => {
    const params = tool.parameters.length > 0
      ? `{ ${tool.parameters.map(p => `${p.name}: ${p.description}`).join(', ')} }`
      : '';
    return `- ${tool.name}(${params}): ${tool.description}`;
  }).join('\n');
}

export function generateExamplesPrompt(): string {
  return TOOL_REGISTRY.map(tool => {
    return `- "${tool.examples[0]}" → ${tool.name}()`;
  }).join('\n');
}