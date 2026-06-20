import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { ConsolidatedResponse, CountryCode, Lot } from '@futurekawa/contracts';
import { fetchStocks } from '@/features/lots/api/lots.api';
import { DEFAULT_PAGE, DEFAULT_SORT } from '@/features/lots/hooks/useLotFilters';
import { DASHBOARD_REFETCH_INTERVAL_MS } from '@/features/dashboard/lib/constants';

// Résumé des stocks pour le dashboard d'accueil : on ne lit qu'une page minimale
// (seuls `total` et `unavailable` nous intéressent). `country` absent = agrégation
// tous pays. Auto-refresh aligné sur le dashboard.
export function useStocksSummary(
  country?: CountryCode,
): UseQueryResult<ConsolidatedResponse<Lot>> {
  return useQuery({
    queryKey: ['stocks', 'summary', country ?? 'all'],
    queryFn: () =>
      fetchStocks({
        country,
        page: DEFAULT_PAGE,
        pageSize: 1,
        sort: DEFAULT_SORT,
      }),
    refetchInterval: DASHBOARD_REFETCH_INTERVAL_MS,
  });
}
