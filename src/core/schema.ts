import type { Block, DocumentStructure } from '../types/document';

/**
 * Validates an individual block's structure and constraints.
 */
export function validateBlock(block: Block): void {
  if (!block || !block.id || typeof block.id !== 'string') {
    throw new Error(`Invalid block ID: ${block?.id}`);
  }

  switch (block.type) {
    case 'paragraph':
    case 'heading':
      if (typeof block.text !== 'string') {
        throw new Error(`${block.type} block ${block.id} must have string text.`);
      }
      if (block.type === 'heading') {
        if (typeof block.level !== 'number' || block.level < 1 || block.level > 6) {
          throw new Error(`Heading block ${block.id} must have a level between 1 and 6.`);
        }
      }
      break;

    case 'image':
      if (typeof block.src !== 'string') {
        throw new Error(`Image block ${block.id} must have a valid src string.`);
      }
      break;

    case 'bullet_list':
    case 'ordered_list':
      if (!Array.isArray(block.items)) {
        throw new Error(`${block.type} block ${block.id} must have an items array.`);
      }
      block.items.forEach(validateBlock);
      break;

    case 'list_item':
      if (!Array.isArray(block.content)) {
        throw new Error(`list_item block ${block.id} must have a content array.`);
      }
      block.content.forEach(validateBlock);
      break;

    case 'table':
      if (!Array.isArray(block.rows)) {
        throw new Error(`table block ${block.id} must have a rows array.`);
      }
      block.rows.forEach(validateBlock);
      break;

    case 'table_row':
      if (!Array.isArray(block.cells)) {
        throw new Error(`table_row block ${block.id} must have a cells array.`);
      }
      block.cells.forEach(validateBlock);
      break;

    case 'table_cell':
      if (!Array.isArray(block.content)) {
        throw new Error(`table_cell block ${block.id} must have a content array.`);
      }
      block.content.forEach(validateBlock);
      break;

    default:
      throw new Error(`Unsupported block type: ${(block as any).type}`);
  }
}

/**
 * Validates the entire document structure.
 */
export function validateDocument(doc: DocumentStructure): void {
  const seenIds = new Set<string>();

  if (!Array.isArray(doc.blocks)) {
    throw new Error('Document must contain an array of blocks.');
  }

  function checkIds(blocks: Block[]) {
    for (const block of blocks) {
      validateBlock(block);
      if (seenIds.has(block.id)) {
        throw new Error(`Duplicate block ID found: ${block.id}`);
      }
      seenIds.add(block.id);

      if (block.type === 'bullet_list' || block.type === 'ordered_list') {
        checkIds(block.items);
      } else if (block.type === 'list_item') {
        checkIds(block.content);
      } else if (block.type === 'table') {
        checkIds(block.rows);
      } else if (block.type === 'table_row') {
        checkIds(block.cells);
      } else if (block.type === 'table_cell') {
        checkIds(block.content);
      }
    }
  }

  checkIds(doc.blocks);
}
