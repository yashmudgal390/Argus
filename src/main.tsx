// ═══════════════════════════════════════════════════
// Main entry point with ErrorBoundary
// ═══════════════════════════════════════════════════

import { Component, StrictMode } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: '#f87171', background: '#0a0a0a', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Application Error</h1>
          <p style={{ marginTop: '1rem', color: '#e5e7eb' }}>{this.state.error?.toString()}</p>
          <pre style={{ marginTop: '1rem', background: '#171717', padding: '1rem', overflow: 'auto', fontSize: '0.875rem' }}>
            {this.state.errorInfo?.componentStack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
