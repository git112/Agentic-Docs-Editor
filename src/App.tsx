import EditorView from './editor/EditorView'

function App() {
  return (
    <div className="app-shell" style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <header style={{
        padding: '1rem 2rem',
        borderBottom: '1px solid #e2e8f0',
        backgroundColor: '#fff'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a' }}>AI Document Editor</h1>
      </header>

      <main style={{ flex: 1, overflow: 'hidden' }}>
        <EditorView />
      </main>
    </div>
  );
}

export default App;
