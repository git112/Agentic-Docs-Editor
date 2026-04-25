import { AgentState, ToolCall } from './types';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/responses';

const TOOL_DESCRIPTIONS = {
  readSelection: "readSelection(): Read the currently selected text in the editor.",
  applyFormatting: "applyFormatting(options: { bold?: boolean, italic?: boolean, underline?: boolean }): Apply visual formatting (bold/italic/underline) to selected text WITHOUT changing content.",
  replaceSelection: "replaceSelection(text: string): Replace selected text with NEW content. Use ONLY for content transformations like rewording, summarizing, or restructuring text.",
  convertToBullets: "convertToBullets(): Convert selected text to bullet point list format.",
  setMargin: "setMargin(values: { top?, right?, bottom?, left? }): Set document page margins in inches."
};

const SYSTEM_PROMPT = `You are a precise document editing agent. Your role is to plan the correct sequence of tool calls.

CRITICAL RULES:
1. FORMATTING TASKS (bold, italic, underline) → MUST use applyFormatting tool
2. CONTENT TRANSFORMATION (rewrite, summarize, reword) → use replaceSelection
3. STRUCTURE CHANGES (bullets, margins) → use appropriate tools

NEVER use replaceSelection to simulate formatting with markdown or HTML.
NEVER wrap text with **, *, <strong>, <em> to simulate bold/italic.

TOOL DESCRIPTIONS:
${Object.values(TOOL_DESCRIPTIONS).join('\n')}

EXAMPLES:
- "Make this bold" → applyFormatting({ bold: true })
- "Make this italic" → applyFormatting({ italic: true })
- "Rewrite this paragraph" → replaceSelection("rewritten text")
- "Convert to bullets" → convertToBullets()
- "Set margins" → setMargin({ top: 1, bottom: 1 })`;

let lastPlan: string = '';

export async function planner(state: AgentState): Promise<ToolCall[]> {
  const prompt = `${SYSTEM_PROMPT}

User Goal: ${state.goal}
Context: ${state.context.selection ? `Selected text: "${state.context.selection}"` : 'No text selected'}

Return ONLY a JSON array of tool calls. No other text.
Example: [{"name": "applyFormatting", "args": {"options": {"bold": true}}}]`;

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