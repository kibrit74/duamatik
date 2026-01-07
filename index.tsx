import React from 'react';
import ReactDOM from 'react-dom/client';
import AdminApp from './AdminApp';
import MobileApp from './App';
import { runSeed, checkStatus } from './services/seedData';

// Expose seed functions to window for console access
(window as any).seedDatabase = runSeed;
(window as any).checkDbStatus = checkStatus;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Route-based app selection - Admin and Mobile are completely separate
const isAdminRoute = window.location.pathname === '/admin';

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {isAdminRoute ? <AdminApp /> : <MobileApp />}
  </React.StrictMode>
);