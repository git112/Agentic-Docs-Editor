import { ToolCall } from './types';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/responses';

export interface CriticResult {
  satisfied: boolean;
  reason: string;
  suggestions?: string[];
}

const MAX_CRITIC_REVIEWS = 3;

export class Critic {
  private iterationCount = 0;

  async review(
    originalGoal: string,
    executedTools: ToolCall[],
    resultText: string,
    newSelection: string
  ): Promise<CriticResult> {
    if (this.iterationCount >= MAX_CRITIC_REVIEWS) {
      return {
        satisfied: false,
        reason: 'Max iterations reached',
        suggestions: ['Try a simpler goal', 'Break down the task into smaller steps']
      };
    }

    const prompt = `You are a critic reviewing agent actions. Determine if the user's goal was achieved.

Original Goal: "${originalGoal}"
Executed Tools: ${JSON.stringify(executedTools)}
Result Text: "${resultText}"
New Selection: "${newSelection}"

Review criteria:
1. Did the actions address the original goal?
2. Was the execution successful?
3. Is the result satisfactory?

Return ONLY JSON with this structure:
{"satisfied": true/false, "reason": "why", "suggestions": ["optional", "improvements"]}`;

    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          input: prompt,
          temperature: 0
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as { output: Array<{ content: Array<{ text: string }> }> };
      const content = data.output[0]?.content[0]?.text || '';

      const cleaned = content.trim().replace(/^```json\n?|```$/g, '');
      const result = JSON.parse(cleaned) as CriticResult;

      if (!result.satisfied) {
        this.iterationCount++;
      }

      return result;
    } catch (error) {
      console.error('[Critic] Review failed:', error);
      return { satisfied: true, reason: 'Review skipped due to error' };
    }
  }

  reset(): void {
    this.iterationCount = 0;
  }
}