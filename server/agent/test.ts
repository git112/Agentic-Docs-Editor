import 'dotenv/config';
import { runAgent } from './agent.js';
import { mockEditor } from './mockEditor.js';

async function main() {
  try {
    await runAgent('Rewrite the selected paragraph as bullet points', mockEditor);
  } catch (error) {
    console.error('[Test] Error:', error);
    process.exit(1);
  }
}

main();
