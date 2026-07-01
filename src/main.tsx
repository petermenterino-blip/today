import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import '../index.css';
import { QueryProvider } from './utils/queryClient';
import { AuthProvider } from './context/AuthContext';
import { seedDatabase } from './utils/seedData';
import { initSentry } from './lib/sentry';
import ErrorBoundary from './components/shared/ErrorBoundary';

initSentry();
if (import.meta.env.DEV) {
  seedDatabase().catch(() => {});
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
