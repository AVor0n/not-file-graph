import * as React from 'react';

export const HelloButton: React.FC = () => {
  const handleClick = () => {
    // Отправляем сообщение в VS Code
    vscode.postMessage({ command: 'hello' });
  };

  return (
    <div style={{ padding: '20px' }}>
      <button
        onClick={handleClick}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: 'pointer',
          backgroundColor: 'var(--vscode-button-background)',
          color: 'var(--vscode-button-foreground)',
          border: 'none',
          borderRadius: '4px'
        }}
      >
        Hello
      </button>
    </div>
  );
};
