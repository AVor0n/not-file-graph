import { useEffect, useState } from 'react';
import { HelloButton } from './HelloButton';
import React from 'react';
import {DependencyGraph} from './DependencyGraph';
import {ErrorBoundary} from './ErrorBoundary';

interface JsonData {
    [key: string]: any;
}

export const App = () => {
    const [jsonData, setJsonData] = useState<JsonData | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleClick = () => {
        // Отправляем сообщение в VS Code
        vscode.postMessage({ command: 'loadJson' });
    };

    // Обработчик сообщений от VS Code
    useEffect(() => {
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
        <ErrorBoundary>
            <div style={{ width: '100%', height: '100%' }}>
                <HelloButton onClick={handleClick} />
                {error && <div>{error}</div>}
                {jsonData && <DependencyGraph data={jsonData} />}
            </div>
        </ErrorBoundary>
    );
};
