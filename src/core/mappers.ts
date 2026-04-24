import type { DocumentModel } from './documentModel';
import type { Block, Mark } from '../types/document';

/**
 * Converts AST block(s) into TipTap JSON format.
 */
export function blocksToTipTap(blocks: Block[]): any[] {
  return blocks.map(block => {
    const baseAttrs = {
      id: block.id,
      layout: (block as any).layout || {},
      style: (block as any).style || {}
    };

    switch (block.type) {
      case 'paragraph':
        return {
          type: 'paragraph',
          attrs: baseAttrs,
          content: [
            { 
              type: 'text', 
              text: block.text || '', 
              marks: block.marks?.length ? block.marks : undefined 
            }
          ]
        };
      case 'heading':
        return {
          type: 'heading',
          attrs: { ...baseAttrs, level: block.level || 1 },
          content: [
            { 
              type: 'text', 
              text: block.text || '', 
              marks: block.marks?.length ? block.marks : undefined 
            }
          ]
        };
      case 'image':
        return {
          type: 'image',
          attrs: { 
            src: block.src, 
            layout: block.layout || {} 
          }
        };
      case 'bullet_list':
        return {
          type: 'bulletList',
          attrs: baseAttrs,
          content: blocksToTipTap(block.items)
        };
      case 'ordered_list':
        return {
          type: 'orderedList',
          attrs: baseAttrs,
          content: blocksToTipTap(block.items)
        };
      case 'list_item':
        return {
          type: 'listItem',
          attrs: baseAttrs,
          content: blocksToTipTap(block.content)
        };
      case 'table':
        return {
          type: 'table',
          attrs: baseAttrs,
          content: blocksToTipTap(block.rows)
        };
      case 'table_row':
        return {
          type: 'tableRow',
          attrs: baseAttrs,
          content: blocksToTipTap(block.cells)
        };
      case 'table_cell':
        return {
          type: 'tableCell',
          attrs: baseAttrs,
          content: blocksToTipTap(block.content)
        };
      default:
        return null;
    }
  }).filter(Boolean);
}

export function astToTipTap(model: DocumentModel): any {
  return {
    type: 'doc',
    content: blocksToTipTap(model.getBlocks())
  };
}

/**
 * Extracts combined marks from a node's content (if they are uniform).
 */
function extractMarks(node: any): Mark[] {
  const marks: Mark[] = [];
  if (!node.content || !Array.isArray(node.content)) return [];
  
  // We collect all unique marks from the text nodes
  const markTypes = new Set<string>();
  node.content.forEach((c: any) => {
    if (c.marks && Array.isArray(c.marks)) {
      c.marks.forEach((m: any) => markTypes.add(m.type));
    }
  });

  markTypes.forEach(type => {
    if (type === 'bold' || type === 'italic' || type === 'underline') {
      marks.push({ type });
    }
  });

  return marks;
}

/**
 * Parses TipTap JSON content and converts it into AST blocks.
 */
export function tipTapToBlocks(content: any[], model: DocumentModel): Block[] {
  if (!Array.isArray(content)) return [];

  const blocks: Block[] = [];

  for (const node of content) {
    try {
      const attrs = node.attrs || {};
      const layout = attrs.layout || {};
      const style = attrs.style || {};

      if (node.type === 'paragraph' || node.type === 'heading') {
        const text = node.content?.map((c: any) => c.text || '').join('') || '';
        const marks = extractMarks(node);
        
        if (node.type === 'paragraph') {
          blocks.push({
            ...model.createParagraph(text),
            marks,
            layout,
            style
          });
        } else {
          const level = node.attrs?.level || 1;
          blocks.push({
            ...model.createHeading(text, level),
            marks,
            layout,
            style
          });
        }
      } 
      else if (node.type === 'image') {
        const dummy = model.createParagraph('');
        blocks.push({
          id: dummy.id,
          type: 'image',
          src: attrs.src || '',
          layout: attrs.layout || {}
        });
      }
      else if (node.type === 'bulletList' || node.type === 'orderedList') {
        const items = tipTapToBlocks(node.content, model);
        const dummy = model.createParagraph('');
        blocks.push({
          ...dummy,
          type: node.type === 'bulletList' ? 'bullet_list' : 'ordered_list',
          items,
          layout
        });
      }
      else if (node.type === 'listItem') {
        const nestedContent = tipTapToBlocks(node.content, model);
        const dummy = model.createParagraph('');
        blocks.push({
          ...dummy,
          type: 'list_item',
          content: nestedContent
        });
      }
      else if (node.type === 'table') {
        const rows = tipTapToBlocks(node.content, model) as any[];
        const dummy = model.createParagraph('');
        blocks.push({ ...dummy, type: 'table', rows });
      }
      else if (node.type === 'tableRow') {
        const cells = tipTapToBlocks(node.content, model) as any[];
        const dummy = model.createParagraph('');
        blocks.push({ ...dummy, type: 'table_row', cells });
      }
      else if (node.type === 'tableCell') {
        const cellContent = tipTapToBlocks(node.content, model);
        const dummy = model.createParagraph('');
        blocks.push({ ...dummy, type: 'table_cell', content: cellContent });
      }
    } catch (err) {
      console.warn('Error parsing TipTap node:', err, node);
    }
  }

  return blocks;
}

export function tipTapToAst(json: any, model: DocumentModel): void {
  if (!json || json.type !== 'doc' || !Array.isArray(json.content)) return;
  const newBlocks = tipTapToBlocks(json.content, model);
  if (newBlocks.length === 0) return;
  model.setBlocks(newBlocks);
}
