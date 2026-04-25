import { AgentState } from './types';

export interface ConversationEntry {
  role: 'user' | 'agent';
  content: string;
  timestamp: number;
}

export interface ObservedState {
  selection: string;
  documentContent: string;
  conversationHistory: ConversationEntry[];
  previousAttempts: number;
}

export class AgentMemory {
  private conversationHistory: ConversationEntry[] = [];
  private documentContent: string = '';

  observe(selection: string): ObservedState {
    return {
      selection,
      documentContent: this.documentContent,
      conversationHistory: [...this.conversationHistory],
      previousAttempts: this.conversationHistory.filter(e => e.role === 'user').length
    };
  }

  addUserMessage(content: string): void {
    this.conversationHistory.push({
      role: 'user',
      content,
      timestamp: Date.now()
    });
  }

  addAgentMessage(content: string): void {
    this.conversationHistory.push({
      role: 'agent',
      content,
      timestamp: Date.now()
    });
  }

  updateDocument(content: string): void {
    this.documentContent = content;
  }

  getHistory(): ConversationEntry[] {
    return [...this.conversationHistory];
  }

  buildStateWithContext(goal: string, selection: string): AgentState {
    const observed = this.observe(selection);
    return {
      goal,
      context: {
        selection: observed.selection,
        content: observed.documentContent,
        documentTitle: 'Untitled'
      },
      plan: []
    };
  }
}
