import { Node as PMNode } from 'prosemirror-model';

export interface StructuredNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: StructuredNode[];
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  text?: string;
}

export interface FormattingOptions {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  scope?: 'selection' | 'line' | 'first_word' | 'all_lines';
}

export function createTextNode(text: string): StructuredNode {
  return {
    type: 'text',
    text
  };
}

export function createParagraphWithText(text: string): StructuredNode {
  return {
    type: 'paragraph',
    content: [createTextNode(text)]
  };
}

export function createListItem(text: string): StructuredNode {
  return {
    type: 'listItem',
    content: [createParagraphWithText(text)]
  };
}

export function createBulletList(lines: string[]): StructuredNode {
  return {
    type: 'bulletList',
    content: lines.filter(l => l.trim()).map(line => createListItem(line.trim()))
  };
}

export function createOrderedList(lines: string[]): StructuredNode {
  return {
    type: 'orderedList',
    content: lines.filter(l => l.trim()).map(line => createListItem(line.trim()))
  };
}

export function applyBoldMark(nodes: StructuredNode[]): StructuredNode[] {
  const boldMark = { type: 'bold' };
  return nodes.map(node => {
    if (node.type === 'text' && node.text) {
      return { ...node, marks: [...(node.marks || []), boldMark] };
    }
    if (node.content) {
      return { ...node, content: applyBoldMark(node.content) };
    }
    return node;
  });
}

export function applyItalicMark(nodes: StructuredNode[]): StructuredNode[] {
  const italicMark = { type: 'italic' };
  return nodes.map(node => {
    if (node.type === 'text' && node.text) {
      return { ...node, marks: [...(node.marks || []), italicMark] };
    }
    if (node.content) {
      return { ...node, content: applyItalicMark(node.content) };
    }
    return node;
  });
}

export function applyUnderlineMark(nodes: StructuredNode[]): StructuredNode[] {
  const underlineMark = { type: 'underline' };
  return nodes.map(node => {
    if (node.type === 'text' && node.text) {
      return { ...node, marks: [...(node.marks || []), underlineMark] };
    }
    if (node.content) {
      return { ...node, content: applyUnderlineMark(node.content) };
    }
    return node;
  });
}

export function boldFirstWord(nodes: StructuredNode[]): StructuredNode[] {
  const boldMark = { type: 'bold' };
  return nodes.map(node => {
    if (node.type === 'listItem' && node.content) {
      const processedContent = node.content.map((child, index) => {
        if (index === 0 && child.type === 'paragraph' && child.content) {
          return {
            ...child,
            content: child.content.map((textNode, textIndex) => {
              if (textNode.type === 'text' && textNode.text) {
                const words = textNode.text.split(' ');
                if (words.length > 0 && words[0]) {
                  const firstWord = words[0];
                  const rest = words.slice(1).join(' ');
                  const newContent: StructuredNode[] = [];
                  newContent.push({
                    ...textNode,
                    text: firstWord,
                    marks: [...(textNode.marks || []), boldMark]
                  });
                  if (rest) {
                    newContent.push(createTextNode(' ' + rest));
                  }
                  return newContent;
                }
              }
              return textNode;
            }).flat().filter(Boolean)
          };
        }
        return child;
      });
      return { ...node, content: processedContent };
    }
    if (node.content) {
      return { ...node, content: boldFirstWord(node.content) };
    }
    return node;
  });
}

export function splitTextIntoLines(text: string): string[] {
  return text.split('\n').filter(line => line.trim());
}

export function validateProseMirrorJSON(structure: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  function validateNode(node: unknown, path: string): void {
    if (!node || typeof node !== 'object') {
      errors.push(`${path}: Expected object`);
      return;
    }
    
    const n = node as Record<string, unknown>;
    
    if (!n.type || typeof n.type !== 'string') {
      errors.push(`${path}: Missing or invalid type`);
    }
    
    if (n.content && Array.isArray(n.content)) {
      n.content.forEach((child, i) => validateNode(child, `${path}.content[${i}]`));
    }
    
    if (n.marks && Array.isArray(n.marks)) {
      n.marks.forEach((mark, i) => {
        if (!mark || typeof mark !== 'object' || !(mark as Record<string, unknown>).type) {
          errors.push(`${path}.marks[${i}]: Invalid mark`);
        }
      });
    }
  }
  
  validateNode(structure, 'root');
  return { valid: errors.length === 0, errors };
}

export function logNodeOperation(operation: string, before: unknown, after: unknown): void {
  console.log(`[NodeOp] ${operation}`);
  console.log(`  BEFORE:`, JSON.stringify(before, null, 2).slice(0, 200));
  console.log(`  AFTER:`, JSON.stringify(after, null, 2).slice(0, 200));
}