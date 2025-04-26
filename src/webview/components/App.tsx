import { useEffect, useState } from 'react';
import React from 'react';
import {DependencyGraph, GraphData} from './DependencyGraph';
import {ErrorBoundary} from './ErrorBoundary';
import { validateDependencies } from '../../utils/validateDependencies';
import { getFileDependencies } from '../../utils/getFileDependencies';


export const App = () => {
    const [rawData, setRawData] = useState<GraphData | null>(null);
    const [data, setData] = useState<GraphData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            switch (message.type) {
                case 'jsonData':
                    validateDependencies(message.data);
                    setRawData(message.data);
                    setError(null);
                    break;
                case 'buildGraph':
                    if (message.path && rawData) {
                        const deps = getFileDependencies(rawData, message.path);
                        setData(deps);
                    } else {
                        setData(rawData);
                    }
                    break;
                case 'error':
                    setError(message.message);
                    setRawData(null);
                    break;
            }
        };

        window.addEventListener('message', handleMessage);

        if(!rawData) {
            vscode.postMessage({ command: 'loadJson' });
        }

        return () => window.removeEventListener('message', handleMessage);
    }, [rawData]);

    return (
        <ErrorBoundary>
            <div style={{ width: '100%', height: '100%' }}>
                {error && <div>{error}</div>}
                {data && <DependencyGraph data={data} />}
            </div>
        </ErrorBoundary>
    );
};
