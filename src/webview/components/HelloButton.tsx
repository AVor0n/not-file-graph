import * as React from 'react';

export const HelloButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <div style={{ padding: '20px' }}>
      <button
        onClick={onClick}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: 'pointer',
          backgroundColor: 'var(--vscode-button-background)',
          color: 'var(--vscode-button-foreground)',
          border: 'none',
          borderRadius: '4px',
          marginBottom: '20px'
        }}
      >
        Load JSON
      </button>
    </div>
  );
};
