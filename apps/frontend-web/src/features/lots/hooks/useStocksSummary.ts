import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { ConsolidatedResponse, Lot } from '@futurekawa/contracts';
import { fetchStocks } from '@/features/lots/api/lots.api';
import { DEFAULT_PAGE, DEFAULT_SORT } from '@/features/lots/hooks/useLotFilters';

// Résumé des stocks pour le dashboard d'accueil : on ne lit qu'une page minimale
// (seuls `total` et `unavailable` nous intéressent), tous pays confondus.
export function useStocksSummary(): UseQueryResult<ConsolidatedResponse<Lot>> {
  return useQuery({
    queryKey: ['stocks', 'summary'],
    queryFn: () =>
      fetchStocks({ page: DEFAULT_PAGE, pageSize: 1, sort: DEFAULT_SORT }),
  });
}
