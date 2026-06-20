import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { ConsolidatedResponse, Lot } from '@futurekawa/contracts';
import { fetchStocks } from '@/features/lots/api/lots.api';
import {
  DEFAULT_PAGE_SIZE,
  type LotFilters,
} from '@/features/lots/hooks/useLotFilters';

// Liste consolidée des lots. La clé inclut tous les filtres pour un cache correct
// par combinaison pays/page/tri.
export function useLots(
  filters: LotFilters,
): UseQueryResult<ConsolidatedResponse<Lot>> {
  return useQuery({
    queryKey: ['stocks', filters],
    queryFn: () =>
      fetchStocks({
        country: filters.country,
        page: filters.page,
        pageSize: DEFAULT_PAGE_SIZE,
        sort: filters.sort,
      }),
  });
}
