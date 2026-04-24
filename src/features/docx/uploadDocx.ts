import mammoth from 'mammoth';
import type { Block, Mark } from '../../types/document';

/**
 * Extracts formatting marks (bold, italic, underline) from a DOM element.
 */
function getMarks(element: Element): Mark[] {
  const marks: Mark[] = [];
  const tag = element.tagName.toLowerCase();
  
  // Note: DOMParser treats <strong> as STRONG, etc.
  if (tag === 'strong' || tag === 'b') marks.push({ type: 'bold' });
  if (tag === 'em' || tag === 'i') marks.push({ type: 'italic' });
  if (tag === 'u') marks.push({ type: 'underline' });
  
  // Recurse into children to find mixed marks in simple cases 
  // (though our current AST handles block-level marks best)
  Array.from(element.children).forEach(child => {
    const childMarks = getMarks(child);
    childMarks.forEach(cm => {
      if (!marks.find(m => m.type === cm.type)) marks.push(cm);
    });
  });

  return marks;
}

/**
 * Parses an HTML element into a DocumentModel block structure.
 * Robustly handles bold, italic, underline, lists, images, and tables.
 */
function parseElementToBlocks(element: Element, idCounter: { val: number }): Block | null {
  const tagName = element.tagName.toLowerCase();
  const text = element.textContent || '';
  
  idCounter.val++;
  const id = `block_docx_${idCounter.val}_${Date.now()}`;

  // 1. Text blocks (p, h1-h6)
  if (tagName === 'p' || /^h[1-6]$/.test(tagName)) {
    const marks = getMarks(element);
    
    if (tagName === 'p') {
      return { id, type: 'paragraph', text, marks };
    } else {
      const level = parseInt(tagName.substring(1), 10) as any;
      return { id, type: 'heading', text, level, marks };
    }
  }

  // 2. Lists (ul, ol)
  if (tagName === 'ul' || tagName === 'ol') {
    const items: Block[] = [];
    Array.from(element.children).forEach(child => {
      const parsed = parseElementToBlocks(child, idCounter);
      if (parsed) items.push(parsed);
    });
    
    return {
      id,
      type: tagName === 'ul' ? 'bullet_list' : 'ordered_list',
      items
    };
  }

  // 3. List Item (li)
  if (tagName === 'li') {
    const content: Block[] = [];
    
    // Check for direct text or nested structure
    if (element.children.length === 0 && text.trim()) {
      idCounter.val++;
      content.push({
        id: `block_docx_${idCounter.val}_${Date.now()}`,
        type: 'paragraph',
        text,
        marks: getMarks(element)
      });
    } else {
      Array.from(element.children).forEach(child => {
        const parsed = parseElementToBlocks(child, idCounter);
        if (parsed) content.push(parsed);
      });
    }

    return { id, type: 'list_item', content };
  }

  // 4. Image (img)
  if (tagName === 'img') {
    return {
      id,
      type: 'image',
      src: (element as HTMLImageElement).src || ''
    };
  }

  // 5. Table (table, tr, td)
  if (tagName === 'table') {
    const rows: Block[] = [];
    Array.from(element.querySelectorAll('tr')).forEach(tr => {
      const parsedRow = parseElementToBlocks(tr, idCounter);
      if (parsedRow && parsedRow.type === 'table_row') rows.push(parsedRow);
    });
    return { id, type: 'table', rows: rows as any[] };
  }

  if (tagName === 'tr') {
    const cells: Block[] = [];
    Array.from(element.children).forEach(td => {
      if (td.tagName.toLowerCase() === 'td' || td.tagName.toLowerCase() === 'th') {
        const parsedCell = parseElementToBlocks(td, idCounter);
        if (parsedCell && parsedCell.type === 'table_cell') cells.push(parsedCell);
      }
    });
    return { id, type: 'table_row', cells: cells as any[] };
  }

  if (tagName === 'td' || tagName === 'th') {
    const content: Block[] = [];
    Array.from(element.children).forEach(child => {
      const parsed = parseElementToBlocks(child, idCounter);
      if (parsed) content.push(parsed);
    });

    // Fallback if cell has text but no child tags
    if (content.length === 0 && text.trim()) {
      idCounter.val++;
      content.push({
        id: `block_docx_${idCounter.val}_${Date.now()}`,
        type: 'paragraph',
        text
      });
    }

    return { id, type: 'table_cell', content };
  }

  // 6. Safe Fallback
  if (text.trim()) {
    console.log(`[Parser] Falling back for tag: ${tagName}`);
    return { id, type: 'paragraph', text, marks: getMarks(element) };
  }

  return null;
}

/**
 * Parses a .docx file and converts it into structured AST blocks.
 */
export async function parseDocx(file: File): Promise<Block[]> {
  if (!file) throw new Error('No file provided');

  console.log('[Parser] Reading file:', file.name);
  const arrayBuffer = await file.arrayBuffer();
  
  // Use Mammoth to convert Docx -> HTML
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = result.value;
  
  console.log('[Parser] Mammoth HTML Output:', html);

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const elements = Array.from(doc.body.children);

  console.log('[Parser] Top-level HTML nodes:', elements.length);

  const idCounter = { val: 0 };
  const blocks: Block[] = [];

  elements.forEach(el => {
    const parsed = parseElementToBlocks(el, idCounter);
    if (parsed) {
      blocks.push(parsed);
    }
  });

  console.log('[Parser] Final AST structure:', blocks);
  return blocks;
}
