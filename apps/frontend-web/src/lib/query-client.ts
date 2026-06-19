import { QueryClient } from '@tanstack/react-query';

// QueryClient partagé (ADR-0005). staleTime 30s aligné sur le cache du siège (ADR-0007).
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
