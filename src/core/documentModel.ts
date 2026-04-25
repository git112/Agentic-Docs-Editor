import type { Block, DocumentStructure, ParagraphBlock, HeadingBlock } from '../types/document';
import { validateBlock, validateDocument } from './schema';

/**
 * Deep clones an object to prevent external mutations from leaking into 
 * or out of the internal state.
 */
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export class DocumentModel {
  private state: DocumentStructure;
  private idCounter: number = 0;

  constructor(initialData?: DocumentStructure) {
    if (initialData) {
      validateDocument(initialData);
      this.state = deepClone(initialData);
      
      // Sync counter with existing IDs if loading data
      this.state.blocks.forEach(block => {
        const match = block.id.match(/^block_(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > this.idCounter) this.idCounter = num;
        }
      });
    } else {
      this.state = {
        blocks: [],
        page: {
          margin: {
            top: '1in',
            right: '1in',
            bottom: '1in',
            left: '1in'
          }
        }
      };
    }
  }

  // --- Factory Methods ---

  /**
   * Generates a unique block ID.
   */
  private generateId(): string {
    this.idCounter++;
    return `block_${this.idCounter}`;
  }

  createParagraph(text: string): ParagraphBlock {
    const block: ParagraphBlock = {
      id: this.generateId(),
      type: 'paragraph',
      text
    };
    validateBlock(block);
    return block;
  }

  createHeading(text: string, level: 1 | 2 | 3 | 4 | 5 | 6): HeadingBlock {
    const block: HeadingBlock = {
      id: this.generateId(),
      type: 'heading',
      text,
      level
    };
    validateBlock(block);
    return block;
  }

  // --- Accessors ---

  /**
   * Returns a deep copy of all blocks to preserve encapsulation.
   */
  getBlocks(): Block[] {
    return deepClone(this.state.blocks);
  }

  /**
   * Returns a deep copy of a specific block. Throws if not found.
   */
  getBlock(id: string): Block {
    const block = this.state.blocks.find(b => b.id === id);
    if (!block) {
      throw new Error(`Block with ID ${id} not found.`);
    }
    return deepClone(block);
  }

  // --- Mutations ---

  /**
   * Replaces an existing block while preserving its original ID.
   */
  replaceBlock(id: string, newBlock: Block): void {
    const index = this.state.blocks.findIndex(b => b.id === id);
    if (index === -1) {
      throw new Error(`Cannot replace: Block ${id} not found.`);
    }

    // Ensure the new block uses the target ID to prevent ID drift/overwrites
    const blockToInsert = { ...newBlock, id };
    validateBlock(blockToInsert);

    const newState = deepClone(this.state);
    newState.blocks[index] = blockToInsert;
    
    validateDocument(newState);
    this.state = newState;
  }

  /**
   * Inserts a new block immediately after a reference block.
   */
  insertAfter(id: string, newBlock: Block): void {
    const index = this.state.blocks.findIndex(b => b.id === id);
    if (index === -1) {
      throw new Error(`Cannot insert: Reference block ${id} not found.`);
    }

    validateBlock(newBlock);

    const newState = deepClone(this.state);
    newState.blocks.splice(index + 1, 0, newBlock);
    
    validateDocument(newState);
    this.state = newState;
  }

  /**
   * Deletes a block from the document.
   */
  deleteBlock(id: string): void {
    const index = this.state.blocks.findIndex(b => b.id === id);
    if (index === -1) {
      throw new Error(`Cannot delete: Block ${id} not found.`);
    }

    const newState = deepClone(this.state);
    newState.blocks.splice(index, 1);
    
    validateDocument(newState);
    this.state = newState;
  }

  /**
   * Replaces all blocks in the document with a new set.
   * Validates the resulting document to ensure integrity.
   */
  setBlocks(blocks: Block[]): void {
    const newState = deepClone({
      ...this.state,
      blocks: deepClone(blocks)
    });
    
    validateDocument(newState);
    this.state = newState;
  }
}
