import * as React from 'react';

interface JsonData {
  [key: string]: any;
}

export const HelloButton: React.FC = () => {
  const [jsonData, setJsonData] = React.useState<JsonData | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleClick = () => {
    // Отправляем сообщение в VS Code
    vscode.postMessage({ command: 'loadJson' });
  };

  // Обработчик сообщений от VS Code
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === 'jsonData') {
        setJsonData(message.data);
        setError(null);
      } else if (message.type === 'error') {
        setError(message.message);
        setJsonData(null);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

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
          borderRadius: '4px',
          marginBottom: '20px'
        }}
      >
        Load JSON
      </button>

      {error && (
        <div style={{
          color: 'var(--vscode-errorForeground)',
          padding: '10px',
          backgroundColor: 'var(--vscode-inputValidation-errorBackground)',
          borderRadius: '4px',
          marginTop: '10px'
        }}>
          {error}
        </div>
      )}

      {jsonData && (
        <pre style={{
          backgroundColor: 'var(--vscode-editor-background)',
          padding: '10px',
          borderRadius: '4px',
          overflow: 'auto',
          maxHeight: '400px'
        }}>
          {JSON.stringify(jsonData, null, 2)}
        </pre>
      )}
    </div>
  );
};
