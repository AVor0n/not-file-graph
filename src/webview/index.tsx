import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { HelloButton } from './components/HelloButton';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <HelloButton />
  </React.StrictMode>
);
