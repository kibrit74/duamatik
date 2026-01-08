import React from 'react';
import ReactDOM from 'react-dom/client';
import AdminApp from './AdminApp';
import MobileApp from './App';
import { runSeed, checkStatus } from './services/seedData';

// Expose seed functions to window for console access
(window as any).seedDatabase = runSeed;
(window as any).checkDbStatus = checkStatus;

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          backgroundColor: '#fee',
          margin: '20px',
          borderRadius: '8px',
          fontFamily: 'monospace'
        }}>
          <h1 style={{ color: '#c00' }}>⚠️ Bir Hata Oluştu</h1>
          <p>Uygulama beklenmedik bir hatayla karşılaştı.</p>
          <details style={{ marginTop: '10px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Hata Detayları</summary>
            <pre style={{
              backgroundColor: '#fff',
              padding: '10px',
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {this.state.error?.toString()}
              {'\n\n'}
              {this.state.error?.stack}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '15px',
              padding: '10px 20px',
              backgroundColor: '#0d9488',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Uygulamayı Yeniden Başlat
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Route-based app selection - Admin and Mobile are completely separate
const isAdminRoute = window.location.pathname === '/admin';

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      {isAdminRoute ? <AdminApp /> : <MobileApp />}
    </ErrorBoundary>
  </React.StrictMode>
);