import React from 'react';
import { Editor } from '@tiptap/react';
import { DocumentModel } from '../core/documentModel';
import { EditorBridge } from '../core/editorBridge';
import { parseDocx } from '../features/docx/uploadDocx';

interface DebugPanelProps {
  editor: Editor;
  model: DocumentModel;
  bridge: EditorBridge;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ editor, model, bridge }) => {
  // We use a simple force update mechanism for the debug view 
  // since DocumentModel is not a React state.
  const [, setTick] = React.useState(0);
  const forceUpdate = () => setTick(t => t + 1);

  // Sync is usually handled by bridge listeners, but buttons need to trigger UI refreshes
  const handleInsert = () => {
    const blocks = model.getBlocks();
    const p = model.createParagraph('New block inserted via AST');
    if (blocks.length > 0) {
      model.insertAfter(blocks[0].id, p);
    } else {
      // If empty, we can't insertAfter. This highlights the DocumentModel limitation.
      console.warn('Cannot insertAfter: Document is empty.');
    }
    bridge.syncToEditor();
    forceUpdate();
  };

  const handleReplace = () => {
    const blocks = model.getBlocks();
    if (blocks.length > 0) {
      const first = blocks[0];
      const updated = { ...first, text: 'Replaced via AST' };
      model.replaceBlock(first.id, updated);
      bridge.syncToEditor();
    }
    forceUpdate();
  };

  const handleDelete = () => {
    const blocks = model.getBlocks();
    if (blocks.length > 0) {
      model.deleteBlock(blocks[0].id);
      bridge.syncToEditor();
    }
    forceUpdate();
  };

  const handleRoundTrip = () => {
    const before = JSON.stringify(model.getBlocks());
    
    // Perform full round trip
    bridge.syncToEditor();
    bridge.syncFromEditor();
    
    const after = JSON.stringify(model.getBlocks());
    console.log('--- ROUND TRIP TEST ---');
    console.log('Matched:', before === after);
    if (before !== after) {
      console.log('Before:', before);
      console.log('After: ', after);
    }
    forceUpdate();
  };

  const handleForceFromEditor = () => {
    bridge.syncFromEditor();
    forceUpdate();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      console.log('[Debug] Uploading DOCX:', file.name);
      const blocks = await parseDocx(file);
      
      // Bulk update the model
      model.setBlocks(blocks);
      
      // Push changes to the editor UI
      bridge.syncToEditor();
      
      forceUpdate();
    } catch (err) {
      console.error('Failed to upload/parse DOCX:', err);
    }
  };

  return (
    <div className="debug-panel" style={{
      height: '100%',
      padding: '1.5rem',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      backgroundColor: '#ffffff',
      fontFamily: 'monospace',
      fontSize: '0.8rem',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    }}>
      <h3 style={{ marginTop: 0 }}>Debug Panel</h3>
      
      <div className="controls" style={{ marginBottom: '1rem', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button onClick={handleInsert}>Insert Para (AST)</button>
        <button onClick={handleReplace}>Replace First (AST)</button>
        <button onClick={handleDelete}>Delete First (AST)</button>
        <button onClick={handleRoundTrip}>Round Trip Test</button>
        <button onClick={handleForceFromEditor}>Sync From Editor</button>
        <button onClick={forceUpdate}>Refresh View</button>
        
        <div style={{ marginLeft: '1rem', display: 'inline-flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid #cbd5e1', paddingLeft: '1rem' }}>
          <label htmlFor="docx-upload" style={{ fontWeight: 'bold', cursor: 'pointer' }}>📁 Upload DOCX:</label>
          <input 
            id="docx-upload"
            type="file" 
            accept=".docx" 
            onChange={handleFileUpload}
            style={{ fontSize: '0.7rem' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <strong style={{ marginBottom: '4px' }}>AST (DocumentModel)</strong>
          <pre style={{ ...preStyle, flex: 1 }}>
            {JSON.stringify(model.getBlocks(), null, 2)}
          </pre>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <strong style={{ marginBottom: '4px' }}>TipTap JSON</strong>
          <pre style={{ ...preStyle, flex: 1 }}>
            {JSON.stringify(editor.getJSON(), null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

const preStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  padding: '12px',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  overflow: 'auto', // Handle both X and Y
  margin: 0,
  fontSize: '0.75rem',
  lineHeight: '1.4',
  color: '#334155'
};

export default DebugPanel;
