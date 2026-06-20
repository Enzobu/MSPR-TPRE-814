import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type {
  Alert,
  ConsolidatedResponse,
  CountryCode,
} from '@futurekawa/contracts';
import { fetchAlerts } from '@/features/alerts/api/alerts.api';
import { ALERTS_REFETCH_INTERVAL_MS } from '@/features/alerts/hooks/useAlerts';

export const RECENT_ALERTS_COUNT = 3;

// Dernières alertes pour le dashboard d'accueil : page 1, triées par date de
// déclenchement (desc) côté backend-central. `country` absent = agrégation tous
// pays. Polling aligné sur la liste.
export function useRecentAlerts(
  country?: CountryCode,
): UseQueryResult<ConsolidatedResponse<Alert>> {
  return useQuery({
    queryKey: ['alerts', 'recent', RECENT_ALERTS_COUNT, country ?? 'all'],
    queryFn: () =>
      fetchAlerts({ country, page: 1, pageSize: RECENT_ALERTS_COUNT }),
    refetchInterval: ALERTS_REFETCH_INTERVAL_MS,
  });
}
