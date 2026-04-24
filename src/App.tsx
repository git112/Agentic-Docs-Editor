import React from 'react';
import EditorView from './editor/EditorView'

function App() {
  return (
    <div className="app-shell" style={{
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem'
    }}>
      <header style={{
        marginBottom: '2rem',
        borderBottom: '1px solid #eee',
        paddingBottom: '1rem'
      }}>
        <h1 style={{ margin: 0, color: '#333' }}>AI Document Editor</h1>
      </header>

      <main>
        <EditorView />
      </main>
    </div>
  );
}

export default App;
