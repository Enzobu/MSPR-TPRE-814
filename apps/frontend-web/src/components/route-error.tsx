import { useRouteError } from 'react-router';
import { DefaultErrorFallback } from '@/components/error-boundary';

// errorElement des routes (react-router) : capture les erreurs de loader/render
// et affiche le fallback métier.
export function RouteError() {
  const error = useRouteError();
  console.error('Route error', error);
  return <DefaultErrorFallback />;
}
