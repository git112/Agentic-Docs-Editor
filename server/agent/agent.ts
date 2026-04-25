import 'dotenv/config';
import { ToolCall } from './types';
import { EditorAPI } from './tools';
import { planner } from './planner';
import { executeTools } from './executor';
import { AgentMemory } from './memory';
import { Critic, CriticResult } from './critic';

export class Agent {
  private memory: AgentMemory;
  private critic: Critic;

  constructor() {
    this.memory = new AgentMemory();
    this.critic = new Critic();
  }

  async run(goal: string, editor: EditorAPI): Promise<void> {
    console.log(`\n[Agent] ════════════════════════════════════`);
    console.log(`[Agent] User Input: "${goal}"`);
    console.log(`[Agent] ════════════════════════════════════\n`);

    this.memory.addUserMessage(goal);
    this.critic.reset();

    const maxIterations = 3;
    let iteration = 0;

    while (iteration < maxIterations) {
      iteration++;
      console.log(`\n[Agent] ─── Iteration ${iteration}/${maxIterations} ───\n`);

      const selection = await editor.readSelection();
      console.log(`[Agent] OBSERVE: Selection = "${selection}"`);

      this.memory.addAgentMessage(`Iteration ${iteration}: Executing plan`);

      const state = this.memory.buildStateWithContext(goal, selection);
      console.log(`[Agent] PLAN: Generating tool list...`);

      const plan = await planner(state);
      console.log(`[Agent] PLAN: ${JSON.stringify(plan, null, 2)}`);

      console.log(`[Agent] EXECUTE: Running ${plan.length} tool(s)...`);
      await executeTools(plan, editor);

      const newSelection = await editor.readSelection();
      console.log(`[Agent] OBSERVE: New selection = "${newSelection}"`);

      console.log(`[Agent] CRITIC: Reviewing result...`);
      const result: CriticResult = await this.critic.review(goal, plan, newSelection, newSelection);

      console.log(`[Agent] CRITIC: satisfied=${result.satisfied}, reason="${result.reason}"`);

      if (result.satisfied) {
        console.log(`\n[Agent] ✓ Goal achieved!\n`);
        this.memory.addAgentMessage(`Success: ${result.reason}`);
        return;
      }

      if (iteration < maxIterations) {
        console.log(`[Agent] ⚠ Goal not satisfied. Re-planning...`);
        if (result.suggestions) {
          console.log(`[Agent] Suggestions: ${result.suggestions.join(', ')}`);
        }
        goal = `${goal}. ${result.suggestions?.join(' ') || 'Please retry.'}`;
        this.memory.addUserMessage(`Re-plan: ${result.reason}`);
      }
    }

    console.log(`\n[Agent] ✗ Max iterations reached. Goal may need adjustment.\n`);
    this.memory.addAgentMessage(`Failed: Max iterations reached`);
  }

  getMemory(): AgentMemory {
    return this.memory;
  }
}

export async function runAgent(goal: string, editor: EditorAPI): Promise<void> {
  const agent = new Agent();
  await agent.run(goal, editor);
}
