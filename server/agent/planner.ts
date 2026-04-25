import { AgentState, ToolCall } from './types';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/responses';

interface ToolDef {
  name: string;
  category: string;
  description: string;
  params: string;
  examples: string[];
}

const TOOL_REGISTRY: ToolDef[] = [
  {
    name: 'applyFormatting',
    category: 'formatting',
    description: 'Apply visual formatting (bold/italic/underline) to text. Use scope to target: selection (default), line, first_word, or all_lines.',
    params: '{ bold?: boolean, italic?: boolean, underline?: boolean, scope?: "selection" | "line" | "first_word" | "all_lines" }',
    examples: ['Make this bold', 'Apply italic to first word', 'Bold each line', 'Bold first word of each bullet']
  },
  {
    name: 'applyHeading',
    category: 'formatting',
    description: 'Convert selected text to a heading at specified level',
    params: '{ level: 1-6 }',
    examples: ['Make this a heading', 'Apply H2', 'Convert to heading level 2']
  },
  {
    name: 'setAlignment',
    category: 'formatting',
    description: 'Set text alignment for selected paragraph(s)',
    params: '{ align: "left" | "center" | "right" | "justify" }',
    examples: ['Align center', 'Set to right align']
  },
  {
    name: 'replaceSelection',
    category: 'content',
    description: 'Replace selected text with plain text content. Use ONLY for rewording, summarizing.',
    params: '{ newText: string }',
    examples: ['Rewrite this paragraph', 'Summarize this text', 'Make it shorter']
  },
  {
    name: 'replaceSelectionWithContent',
    category: 'content',
    description: 'Replace selected text with structured content (bullets/numbered list). Provide content array with lines.',
    params: '{ content: { type: "bulletList" | "orderedList" | "paragraph", content: string[] } }',
    examples: ['Convert to bullets with specific content', 'Create numbered list from items']
  },
  {
    name: 'convertToBullets',
    category: 'structure',
    description: 'Convert selected text to bullet point list using Tiptap AST structure.',
    params: '{}',
    examples: ['Convert to bullets', 'Make this a bullet list', 'Convert paragraph to bullet points']
  },
  {
    name: 'convertToBulletsFromLines',
    category: 'structure',
    description: 'Create bullet list from array of lines. Returns proper AST bulletList with listItem nodes.',
    params: '{ lines: string[] }',
    examples: ['Create bullet list from these items', 'Convert lines to bullets']
  },
  {
    name: 'convertToNumberedList',
    category: 'structure',
    description: 'Convert selected text to numbered list using Tiptap AST structure.',
    params: '{}',
    examples: ['Convert to numbered list', 'Make this numbered']
  },
  {
    name: 'insertTable',
    category: 'structure',
    description: 'Insert a table at cursor position',
    params: '{ rows?: number, cols?: number }',
    examples: ['Insert table', 'Add a table', 'Create 3x3 table']
  },
  {
    name: 'insertStructuredContent',
    category: 'structure',
    description: 'Insert structured content (bulletList/orderedList) at cursor. Use proper AST structure.',
    params: '{ content: { type, content: string[], attrs? } }',
    examples: ['Insert bullet list', 'Add numbered list', 'Create structured list']
  },
  {
    name: 'setMargin',
    category: 'document',
    description: 'Set document page margins',
    params: '{ top?, right?, bottom?, left? }',
    examples: ['Set margins', 'Change page margins']
  }
];

function generateToolPrompt(): string {
  return TOOL_REGISTRY.map(t => 
    `- ${t.name}(${t.params}): ${t.description}`
  ).join('\n');
}

function generateExamplesPrompt(): string {
  return TOOL_REGISTRY.map(t =>
    t.examples.map(ex => `- "${ex}" → ${t.name}()`).join('\n')
  ).join('\n');
}

const SYSTEM_PROMPT = `You are a precise document editing agent. Your role is to plan the correct sequence of tool calls.

CRITICAL RULES:
1. NEVER CREATE NEW TOOL NAMES. Always reuse existing tools with appropriate parameters.
2. NEVER invent tools like "applyBoldToFirstWord", "makeFirstWordBold", "boldEachLine", etc.
3. Use the "scope" parameter on existing tools to handle variations instead of creating new tools.
4. FORMATTING TASKS (bold, italic, underline, heading, alignment) → use formatting tools
5. CONTENT TRANSFORMATION (rewrite, summarize, reword) → use replaceSelection
6. STRUCTURE CHANGES (bullets, numbered lists, tables) → use structure tools
7. For formatting first word of bullets → use applyFormatting with scope: "first_word"
8. For formatting each line → use applyFormatting with scope: "all_lines"

IMPORTANT: Use scope parameter to target specific text portions:
- "first_word" = first word of each line/bullet
- "all_lines" = every entire line
- "selection" = current selection (default)
- "line" = current line only

CORRECT EXAMPLES:
- "Make first word of each bullet bold" → convertToBullets + applyFormatting({bold: true, scope: "first_word"})
- "Bold each line" → applyFormatting({bold: true, scope: "all_lines"})
- "Make concise and convert to bullets" → replaceSelection (newline-separated) + convertToBullets
- "Convert to 5 bullets and bold first word" → replaceSelection + convertToBullets + applyFormatting({bold: true, scope: "first_word"})

NEVER use replaceSelection to simulate formatting.
NEVER wrap text with **, *, <strong>, <em> to fake formatting.

TOOLS:
${generateToolPrompt()}

EXAMPLES:
${generateExamplesPrompt()}`;

let lastPlan: string = '';

export async function planner(state: AgentState): Promise<ToolCall[]> {
  const prompt = `${SYSTEM_PROMPT}

User Goal: ${state.goal}
Context: ${state.context.selection ? `Selected text: "${state.context.selection}"` : 'No text selected'}

Return ONLY a JSON array of tool calls. No other text.
Example: [{"name": "replaceSelection", "args": {"newText": "Line 1\\nLine 2\\nLine 3"}}, {"name": "convertToBullets", "args": {}}]`;

  if (!OPENAI_API_KEY) {
    console.log('[Planner] No API key configured');
    return [];
  }

  const retryHint = lastPlan ? '\n\nIMPORTANT: Previous plan did not work. Try a different approach.' : '';

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      input: prompt + retryHint,
      temperature: 0
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json() as { output: Array<{ content: Array<{ text: string }> }> };
  const content = data.output[0]?.content[0]?.text || '';

  try {
    const cleaned = content.trim().replace(/^```json\n?|```$/g, '');
    const parsed = JSON.parse(cleaned) as ToolCall[];
    
    lastPlan = JSON.stringify(parsed);
    return parsed;
  } catch {
    console.error('Failed to parse planner output as JSON:', content);
    return [];
  }
}

export function resetPlannerState(): void {
  lastPlan = '';
}