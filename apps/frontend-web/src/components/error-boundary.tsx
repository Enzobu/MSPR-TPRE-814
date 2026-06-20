import { Component, type ErrorInfo, type ReactNode } from 'react';
import * as Sentry from '@sentry/react';

// Fallback UI métier (jamais de stacktrace remontée à l'utilisateur — rules front).
export function DefaultErrorFallback() {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 py-16 text-center"
    >
      <h1 className="text-xl font-semibold">Une erreur est survenue</h1>
      <p className="text-muted-foreground">
        Réessayez plus tard. Si le problème persiste, contactez le support.
      </p>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Error boundary racine (rules front : éviter le white screen).
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Remonte à Sentry avec le componentStack React (ADR-0011). No-op si le SDK
    // n'est pas initialisé (VITE_SENTRY_DSN absent).
    Sentry.captureException(error, {
      contexts: { react: { componentStack: info.componentStack } },
    });
    if (import.meta.env.DEV) {
      console.error('Unhandled UI error', error, info);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback ?? <DefaultErrorFallback />;
    }
    return this.props.children;
  }
}
