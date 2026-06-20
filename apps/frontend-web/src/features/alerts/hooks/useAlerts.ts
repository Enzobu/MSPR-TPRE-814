import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { Alert, ConsolidatedResponse } from '@futurekawa/contracts';
import { fetchAlerts } from '@/features/alerts/api/alerts.api';
import {
  DEFAULT_PAGE_SIZE,
  type AlertFilters,
} from '@/features/alerts/hooks/useAlertFilters';

// Polling : les alertes arrivent en continu côté pays, on rafraîchit la liste
// périodiquement pour que le siège voie les nouvelles sans rechargement manuel.
export const ALERTS_REFETCH_INTERVAL_MS = 30_000;

// Liste consolidée des alertes. La clé inclut tous les filtres pour un cache
// correct par combinaison type/acquittement/page.
export function useAlerts(
  filters: AlertFilters,
): UseQueryResult<ConsolidatedResponse<Alert>> {
  return useQuery({
    queryKey: ['alerts', filters],
    queryFn: () =>
      fetchAlerts({
        country: filters.country,
        type: filters.type,
        acknowledged: filters.acknowledged,
        page: filters.page,
        pageSize: DEFAULT_PAGE_SIZE,
      }),
    refetchInterval: ALERTS_REFETCH_INTERVAL_MS,
  });
}
