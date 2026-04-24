/**
 * Discriminated union for document blocks with layout and styling support.
 */

export type Length = string; // "1in", "16px", "2cm"

export interface Mark {
  type: 'bold' | 'italic' | 'underline';
}

export interface PageConfig {
  size?: 'A4' | 'Letter';
  margin?: {
    top: Length;
    right: Length;
    bottom: Length;
    left: Length;
  };
}

export interface ParagraphLayout {
  align?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  spacingBefore?: Length;
  spacingAfter?: Length;
}

export interface BlockStyle {
  border?: {
    width: Length;
    style: 'solid' | 'dashed' | 'none';
    color: string;
  };
  padding?: {
    top: Length;
    right: Length;
    bottom: Length;
    left: Length;
  };
}

export interface ImageLayout {
  width?: Length;
  height?: Length;
  align?: 'left' | 'center' | 'right';
}

export interface ParagraphBlock {
  id: string;
  type: 'paragraph';
  text: string;
  marks?: Mark[];
  layout?: ParagraphLayout;
  style?: BlockStyle;
}

export interface HeadingBlock {
  id: string;
  type: 'heading';
  text: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  marks?: Mark[];
  layout?: ParagraphLayout;
  style?: BlockStyle;
}

export interface ImageBlock {
  id: string;
  type: 'image';
  src: string;
  layout?: ImageLayout;
}

export interface BulletListBlock {
  id: string;
  type: 'bullet_list';
  items: Block[];
  layout?: ParagraphLayout;
}

export interface OrderedListBlock {
  id: string;
  type: 'ordered_list';
  items: Block[];
  layout?: ParagraphLayout;
}

export interface ListItemBlock {
  id: string;
  type: 'list_item';
  content: Block[];
}

export interface TableCellBlock {
  id: string;
  type: 'table_cell';
  content: Block[];
}

export interface TableRowBlock {
  id: string;
  type: 'table_row';
  cells: TableCellBlock[];
}

export interface TableBlock {
  id: string;
  type: 'table';
  rows: TableRowBlock[];
}

export type Block = 
  | ParagraphBlock 
  | HeadingBlock 
  | ImageBlock
  | BulletListBlock 
  | OrderedListBlock 
  | ListItemBlock
  | TableBlock
  | TableRowBlock
  | TableCellBlock;

export interface DocumentStructure {
  page?: PageConfig;
  blocks: Block[];
}
