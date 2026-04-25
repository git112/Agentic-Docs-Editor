import { Editor } from '@tiptap/react';
import type { DocumentModel } from './documentModel';
import { astToTipTap, tipTapToAst } from './mappers';

/**
 * EditorBridge acts as the glue between the TipTap UI and the DocumentModel AST.
 * It ensures that changes in one are reflected in the other while preventing
 * infinite loops using a synchronization guard.
 */
export class EditorBridge {
  private editor: Editor;
  private model: DocumentModel;
  private isSyncing: boolean = false;

  constructor(editor: Editor, model: DocumentModel) {
    this.editor = editor;
    this.model = model;
  }

  /**
   * Initializes the bridge, loads the initial AST into the editor,
   * and attaches update listeners.
   */
  public init(): void {
    try {
      console.log('[Bridge] Init: Loading AST into Editor...');
      this.isSyncing = true;
      const json = astToTipTap(this.model);
      this.editor.commands.setContent(json);
      
      // Use setTimeout to ensure any side effects of setContent finish before releasing guard
      setTimeout(() => {
        this.isSyncing = false;
        console.log('[Bridge] Init: Done.');
        this.attachListeners();
      }, 0);
    } catch (err) {
      console.error('Failed to initialize EditorBridge:', err);
      this.isSyncing = false;
    }
  }

  /**
   * Reads from the DocumentModel and pushes the state to the TipTap UI.
   */
  public syncToEditor(): void {
    if (this.isSyncing) return;

    try {
      console.log('SYNC → EDITOR', this.model.getBlocks());
      this.isSyncing = true;
      
      const json = astToTipTap(this.model);
      this.editor.commands.setContent(json, undefined);
      
      // Release guard in next tick to prevent race conditions with TipTap internal updates
      setTimeout(() => {
        this.isSyncing = false;
        console.log('[Bridge] Sync to Editor completed.');
      }, 0);
    } catch (err) {
      console.error('Error syncing AST to Editor:', err);
      this.isSyncing = false;
    }
  }

  /**
   * Reads from the TipTap UI and pushes the state to the DocumentModel.
   */
  public syncFromEditor(): void {
    if (this.isSyncing) return;

    try {
      const json = this.editor.getJSON();
      console.log('SYNC ← EDITOR', json);
      
      this.isSyncing = true;
      tipTapToAst(json, this.model);
      console.log('AST AFTER SYNC:', this.model.getBlocks());
    } catch (err) {
      console.error('Error syncing Editor to AST:', err);
    } finally {
      this.isSyncing = false;
      // console.log('[Bridge] Sync from Editor completed.');
    }
  }

  /**
   * Attaches listeners to the TipTap editor instance.
   */
  private attachListeners(): void {
    this.editor.on('update', () => {
      // If the update was triggered by our own syncToEditor, ignore it.
      if (this.isSyncing) return;

      this.syncFromEditor();
    });
  }
}
