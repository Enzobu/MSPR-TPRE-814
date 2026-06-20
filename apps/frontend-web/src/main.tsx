import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import './index.css';
import { App } from '@/App';

// Suivi des erreurs front (Sentry, ADR-0011). VITE_SENTRY_DSN est PUBLIC (inliné
// dans le bundle) — fonctionnement normal d'un DSN navigateur. Sans DSN, le SDK
// reste no-op (dev). Erreurs uniquement, pas de tracing perf (free tier, #127).
const dsn = import.meta.env.VITE_SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT ?? import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE,
    tracesSampleRate: 0,
    sendDefaultPii: false,
  });
}

const rootElement = document.getElementById('root');
if (rootElement === null) {
  throw new Error('Root element #root introuvable dans le DOM.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
