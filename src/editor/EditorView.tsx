import React from 'react';

const EditorView: React.FC = () => {
    return (
        <div className="editor-container" style={{
            border: '2px solid #ccc',
            borderRadius: '8px',
            padding: '20px',
            minHeight: '400px',
            backgroundColor: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            fontSize: '1.2rem'
        }}>
            Editor will be here
        </div>
    );
};

export default EditorView;