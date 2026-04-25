import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { planner } from '../agent/planner.js';
import { executeTools } from '../agent/executor.js';
import { AgentMemory } from '../agent/memory.js';
import type { ToolCall, EditorState } from '../agent/types.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const memory = new AgentMemory();

interface RunAgentRequest {
  goal: string;
  editorState: EditorState;
}

interface ToolResult {
  tool: string;
  success: boolean;
  result?: unknown;
  error?: string;
}

app.post('/api/agent/run', async (req, res) => {
  const { goal: initialGoal, editorState }: RunAgentRequest = req.body;

  if (!initialGoal || !editorState) {
    return res.status(400).json({ error: 'Missing goal or editorState' });
  }

  const logs: string[] = [];
  const toolResults: ToolResult[] = [];
  let plannedActions: ToolCall[] = [];
  let goal = initialGoal;

  const editorAdapter = {
    readSelection: async (): Promise<string> => {
      const text = editorState.selection || editorState.content || '';
      logs.push(`[ReadSelection] → "${text}"`);
      return text;
    },

    replaceSelection: async (text: string): Promise<void> => {
      logs.push(`[ReplaceSelection] text="${text}"`);
      toolResults.push({ tool: 'replaceSelection', success: true, result: text });
    },

    convertToBullets: async (): Promise<void> => {
      logs.push('[ConvertToBullets]');
      toolResults.push({ tool: 'convertToBullets', success: true });
    },

    setMargin: async (values: { top?: number; right?: number; bottom?: number; left?: number }): Promise<void> => {
      logs.push(`[SetMargin] ${JSON.stringify(values)}`);
      toolResults.push({ tool: 'setMargin', success: true, result: values });
    },

    applyFormatting: async (options: { bold?: boolean; italic?: boolean; underline?: boolean }): Promise<void> => {
      logs.push(`[ApplyFormatting] ${JSON.stringify(options)}`);
      toolResults.push({ tool: 'applyFormatting', success: true, result: options });
    }
  };

  try {
    console.log(`\n[SERVER] Starting agent for goal: "${goal}"`);

    memory.addUserMessage(goal);

    const maxIterations = 3;
    let iteration = 0;
    let success = false;
    let lastPlan = '';

    while (iteration < maxIterations && !success) {
      iteration++;
      console.log(`\n[Agent] ─── Iteration ${iteration}/${maxIterations} ───\n`);

      const selection = await editorAdapter.readSelection();
      console.log(`[Agent] OBSERVE: Selection = "${selection}"`);

      const state = {
        goal,
        context: {
          selection,
          content: editorState.content,
          documentTitle: editorState.documentTitle
        },
        plan: [] as ToolCall[]
      };

      console.log(`[Agent] PLAN: Generating tool list...`);
      plannedActions = await planner(state);
      console.log(`[Agent] PLAN: ${JSON.stringify(plannedActions, null, 2)}`);

      if (plannedActions.length > 0 && JSON.stringify(plannedActions) === lastPlan && iteration > 1) {
        console.log(`[Agent] ⚠ Same plan detected. Adding retry hint.`);
        goal = `${goal} (ensure formatting is applied correctly)`;
      }
      lastPlan = JSON.stringify(plannedActions);

      console.log(`[Agent] EXECUTE: Running ${plannedActions.length} tool(s)...`);
      await executeTools(plannedActions, editorAdapter);

      const result = selection;
      console.log(`[Agent] OBSERVE: After execution, selection should be: "${result}"`);

      success = plannedActions.length > 0;

      if (!success && iteration < maxIterations) {
        goal = `${goal}. Please apply the formatting.`;
        memory.addUserMessage(`Re-plan: Apply formatting to selected text`);
      }
    }

    const memoryState = memory.getHistory();

    res.json({
      success: true,
      logs,
      toolResults,
      plannedActions,
      memory: memoryState,
      suggestedEdits: plannedActions
    });
  } catch (error) {
    console.error('[SERVER] Agent error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      logs
    });
  }
});

app.get('/api/agent/memory', (_req, res) => {
  res.json({
    messages: memory.getHistory(),
    documentContent: memory['documentContent']
  });
});

app.delete('/api/agent/memory', (_req, res) => {
  memory.updateDocument('');
  res.json({ success: true, message: 'Memory cleared' });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Agentic Docs Server running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Agent:  POST http://localhost:${PORT}/api/agent/run\n`);
});