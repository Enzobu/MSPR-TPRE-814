import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { fetchAlerts } from '@/features/alerts/api/alerts.api';
import { ALERTS_REFETCH_INTERVAL_MS } from '@/features/alerts/hooks/useAlerts';

// Compteur d'alertes non acquittées pour le badge du header. On ne récupère
// qu'une page minimale (`pageSize: 1`) : seule `total` nous intéresse. Polling
// aligné sur la liste pour détecter rapidement une nouvelle alerte.
export function useUnacknowledgedCount(): UseQueryResult<number> {
  return useQuery({
    queryKey: ['alerts', 'unack-count'],
    queryFn: () =>
      fetchAlerts({ acknowledged: false, page: 1, pageSize: 1 }).then(
        (response) => response.total,
      ),
    refetchInterval: ALERTS_REFETCH_INTERVAL_MS,
  });
}
