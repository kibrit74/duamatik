import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { runSeed, checkStatus } from './services/seedData';

// Expose seed functions to window for console access
(window as any).seedDatabase = runSeed;
(window as any).checkDbStatus = checkStatus;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);