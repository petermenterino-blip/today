import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import '../index.css';
import { QueryProvider } from './utils/queryClient';
import { AuthProvider } from './context/AuthContext';
import { seedDatabase } from './utils/seedData';

seedDatabase().catch(() => {});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <QueryProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryProvider>
  </React.StrictMode>
);
