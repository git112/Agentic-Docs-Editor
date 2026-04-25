import React, { useState, useCallback, useEffect } from 'react';
import { runAgent, checkServerHealth, type AgentResponse, type EditorState, type EditorCommands } from '../api/agentClient';

interface AgentControlPanelProps {
  editorSelection: string;
  editorContent: string;
  editorCommands: EditorCommands;
  onSelectionChange?: (selection: string) => void;
}

const SUGGESTED_PROMPTS = [
  'Make this text bold',
  'Convert this to a heading',
  'Format as bullet list',
  'Add emphasis to the key points',
];

const AgentControlPanel: React.FC<AgentControlPanelProps> = ({
  editorSelection,
  editorContent,
  editorCommands,
  onSelectionChange,
}) => {
  const [goal, setGoal] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [response, setResponse] = useState<AgentResponse | null>(null);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [confirmedSelection, setConfirmedSelection] = useState('');
  const [selectionLocked, setSelectionLocked] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const isOnline = await checkServerHealth();
      setServerStatus(isOnline ? 'online' : 'offline');
    };
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectionLocked && editorSelection) {
      setConfirmedSelection(editorSelection);
    }
  }, [editorSelection, selectionLocked]);

  const handleRunAgent = useCallback(async () => {
    if (!goal.trim()) return;
    if (!confirmedSelection.trim() && !goal.toLowerCase().includes('new')) {
      alert('Please select some text in the editor first, or click "Confirm Selection" to lock your selection.');
      return;
    }

    setIsRunning(true);
    setResponse(null);

    const editorState: EditorState = {
      selection: confirmedSelection || editorSelection,
      content: editorContent,
    };

    try {
      const result = await runAgent(goal, editorState, editorCommands);
      setResponse(result);
    } catch (error) {
      setResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsRunning(false);
    }
  }, [goal, editorSelection, editorContent, editorCommands, confirmedSelection]);

  const handleQuickPrompt = (prompt: string) => {
    setGoal(prompt);
  };

  const handleConfirmSelection = () => {
    setConfirmedSelection(editorSelection);
    setSelectionLocked(true);
    onSelectionChange?.(editorSelection);
  };

  const handleUnlockSelection = () => {
    setSelectionLocked(false);
    setConfirmedSelection('');
  };

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <h3 style={{ margin: 0 }}>AI Agent</h3>
        <span style={statusBadge(serverStatus)}>
          {serverStatus === 'checking' ? '...' : serverStatus === 'online' ? '●' : '○'}
        </span>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <label style={labelStyle}>Selected Text:</label>
          {!selectionLocked && (
            <button
              onClick={handleConfirmSelection}
              disabled={!editorSelection}
              style={confirmButtonStyle(!editorSelection)}
            >
              🔒 Confirm Selection
            </button>
          )}
          {selectionLocked && (
            <button
              onClick={handleUnlockSelection}
              style={unlockButtonStyle}
            >
              🔓 Unlock Selection
            </button>
          )}
        </div>
        <div style={selectionBoxStyle(selectionLocked)}>
          {selectionLocked ? (
            <span style={{ color: '#10b981', fontWeight: 500 }}>✓ Locked: </span>
          ) : (
            <span style={{ color: '#64748b', fontSize: '11px' }}>Live: </span>
          )}
          {confirmedSelection || editorSelection || '(No text selected)'}
        </div>
      </div>

      <div style={inputSectionStyle}>
        <label style={labelStyle}>What would you like to do?</label>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Describe what you want the agent to do..."
          style={textareaStyle}
          rows={3}
          disabled={isRunning}
        />
        
        <button
          onClick={handleRunAgent}
          disabled={isRunning || !goal.trim()}
          style={runButtonStyle(isRunning)}
        >
          {isRunning ? 'Running...' : 'Run Agent'}
        </button>
      </div>

      <div style={suggestionsStyle}>
        <label style={labelStyle}>Quick prompts:</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleQuickPrompt(prompt)}
              style={suggestionButtonStyle}
              disabled={isRunning}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {response && (
        <div style={responseSectionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <strong>Results</strong>
            <span style={{
              color: response.success ? '#10b981' : '#ef4444',
              fontSize: '12px'
            }}>
              {response.success ? 'Success' : 'Failed'}
            </span>
          </div>

          {response.plannedActions && response.plannedActions.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <strong style={{ fontSize: '11px', color: '#64748b' }}>Actions:</strong>
              <ul style={{ margin: '4px 0', paddingLeft: '16px', fontSize: '11px' }}>
                {response.plannedActions.map((action, i) => (
                  <li key={i}>
                    {action.name}: {JSON.stringify(action.args)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {response.logs && response.logs.length > 0 && (
            <div style={logsContainerStyle}>
              <strong style={{ fontSize: '11px', color: '#64748b' }}>Logs:</strong>
              <pre style={logsStyle}>
                {response.logs.map((log, i) => (
                  <span key={i} style={logLineStyle(log)}>
                    {log}
                    {'\n'}
                  </span>
                ))}
              </pre>
            </div>
          )}

          {response.error && (
            <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '8px' }}>
              Error: {response.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const panelStyle: React.CSSProperties = {
  padding: '16px',
  borderTop: '1px solid #e2e8f0',
  backgroundColor: '#f8fafc',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const statusBadge = (status: string): React.CSSProperties => ({
  fontSize: '10px',
  color: status === 'online' ? '#10b981' : status === 'offline' ? '#ef4444' : '#94a3b8',
});

const inputSectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 500,
  color: '#475569',
};

const textareaStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  fontSize: '13px',
  fontFamily: 'inherit',
  resize: 'vertical',
  minHeight: '60px',
};

const runButtonStyle = (isRunning: boolean): React.CSSProperties => ({
  padding: '8px 16px',
  borderRadius: '6px',
  border: 'none',
  backgroundColor: isRunning ? '#94a3b8' : '#3b82f6',
  color: 'white',
  fontSize: '13px',
  fontWeight: 500,
  cursor: isRunning ? 'not-allowed' : 'pointer',
  transition: 'background-color 0.2s',
});

const confirmButtonStyle = (disabled: boolean): React.CSSProperties => ({
  padding: '4px 10px',
  borderRadius: '4px',
  border: '1px solid #10b981',
  backgroundColor: disabled ? '#f1f5f9' : '#ecfdf5',
  color: disabled ? '#94a3b8' : '#10b981',
  fontSize: '11px',
  fontWeight: 500,
  cursor: disabled ? 'not-allowed' : 'pointer',
});

const unlockButtonStyle: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: '4px',
  border: '1px solid #64748b',
  backgroundColor: '#f1f5f9',
  color: '#64748b',
  fontSize: '11px',
  fontWeight: 500,
  cursor: 'pointer',
};

const selectionBoxStyle = (locked: boolean): React.CSSProperties => ({
  padding: '8px 12px',
  borderRadius: '6px',
  border: `2px solid ${locked ? '#10b981' : '#e2e8f0'}`,
  backgroundColor: locked ? '#ecfdf5' : '#ffffff',
  fontSize: '12px',
  minHeight: '40px',
  maxHeight: '80px',
  overflow: 'auto',
  wordBreak: 'break-word',
});

const suggestionsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const suggestionButtonStyle: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: '4px',
  border: '1px solid #e2e8f0',
  backgroundColor: '#ffffff',
  fontSize: '11px',
  color: '#475569',
  cursor: 'pointer',
};

const responseSectionStyle: React.CSSProperties = {
  padding: '12px',
  backgroundColor: '#ffffff',
  borderRadius: '6px',
  border: '1px solid #e2e8f0',
};

const logsContainerStyle: React.CSSProperties = {
  marginTop: '4px',
};

const logsStyle: React.CSSProperties = {
  margin: '4px 0 0 0',
  padding: '8px',
  backgroundColor: '#1e293b',
  borderRadius: '4px',
  fontSize: '11px',
  color: '#e2e8f0',
  overflow: 'auto',
  maxHeight: '120px',
};

const logLineStyle = (log: string): React.CSSProperties => ({
  display: 'block',
  color: log.includes('[Agent]') ? '#60a5fa' : 
        log.includes('[PLAN]') ? '#a78bfa' : 
        log.includes('[EXECUTE]') ? '#34d399' : 
        '#e2e8f0',
});

export default AgentControlPanel;