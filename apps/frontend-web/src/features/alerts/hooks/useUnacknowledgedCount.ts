import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { CountryCode } from '@futurekawa/contracts';
import { fetchAlerts } from '@/features/alerts/api/alerts.api';
import { ALERTS_REFETCH_INTERVAL_MS } from '@/features/alerts/hooks/useAlerts';

// Compteur d'alertes non acquittées. On ne récupère qu'une page minimale
// (`pageSize: 1`) : seule `total` nous intéresse. `country` absent = agrégation
// tous pays (cas du badge header). Polling aligné sur la liste pour détecter
// rapidement une nouvelle alerte.
export function useUnacknowledgedCount(
  country?: CountryCode,
): UseQueryResult<number> {
  return useQuery({
    queryKey: ['alerts', 'unack-count', country ?? 'all'],
    queryFn: () =>
      fetchAlerts({ country, acknowledged: false, page: 1, pageSize: 1 }).then(
        (response) => response.total,
      ),
    refetchInterval: ALERTS_REFETCH_INTERVAL_MS,
  });
}
