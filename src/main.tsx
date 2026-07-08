import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import '../index.css';
import { QueryProvider } from './utils/queryClient';
import { AuthProvider } from './context/AuthContext';
import { ConnectionProvider } from './context/ConnectionContext';
import { initSentry } from './lib/sentry';
import ErrorBoundary from './components/shared/ErrorBoundary';
import OfflineBanner from './components/shared/OfflineBanner';
import { idleRecovery } from './lib/idleRecovery';
import { logger } from './lib/logger';
import { performStartupValidation, shouldBlockStartup } from './lib/productionGuard';

initSentry();

const startup = performStartupValidation();

if (shouldBlockStartup(startup)) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui,sans-serif;background:#0a0a0a;color:#fff;padding:2rem;">
        <div style="max-width:600px;text-align:center;">
          <div style="font-size:3rem;margin-bottom:1rem;">⚠️</div>
          <h1 style="font-size:1.5rem;font-weight:700;margin-bottom:0.5rem;">Startup Blocked</h1>
          <p style="color:#a0a0a0;margin-bottom:1.5rem;">The application cannot start because required environment variables are missing or invalid.</p>
          <div style="text-align:left;background:#1a1a1a;padding:1rem;border-radius:8px;font-size:0.875rem;overflow:auto;">
            <strong style="color:#f87171;">Errors:</strong>
            <ul style="margin:0.5rem 0;padding-left:1.5rem;">
              ${startup.errors.map(e => `<li style="color:#f87171;margin:0.25rem 0;">${e}</li>`).join('')}
            </ul>
            ${startup.warnings.length > 0 ? `
              <strong style="color:#fbbf24;margin-top:0.5rem;display:block;">Warnings:</strong>
              <ul style="margin:0.5rem 0;padding-left:1.5rem;">
                ${startup.warnings.map(w => `<li style="color:#fbbf24;margin:0.25rem 0;">${w}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }
  throw new Error('Startup blocked: missing required environment variables');
}

idleRecovery.mount();
logger.info('App', 'Application starting', { env: import.meta.env.MODE });

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryProvider>
        <ConnectionProvider>
          <AuthProvider>
            <OfflineBanner />
            <App />
          </AuthProvider>
        </ConnectionProvider>
      </QueryProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
