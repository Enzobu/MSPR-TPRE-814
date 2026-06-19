import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { Lot } from '@futurekawa/contracts';
import { fetchStocks } from '@/features/lots/api/lots.api';
import { DEFAULT_SORT } from '@/features/lots/hooks/useLotFilters';

// Taille de page maximale acceptée par le siège : on récupère la première page la
// plus large possible pour y retrouver le lot.
const MAX_PAGE_SIZE = 100;

// LIMITE CONNUE : backend-central n'expose PAS de route single-lot (`/stocks/:id`).
// On récupère donc la première page consolidée (jusqu'à 100 lots) et on retrouve
// le lot par id côté client. Si l'id n'est pas dans cette page, on renvoie null
// (faux négatif possible au-delà de 100 lots). Amélioration future : un endpoint
// central `GET /api/v1/stocks/:id` dédié.
export function useLot(id: string): UseQueryResult<Lot | null> {
  return useQuery({
    queryKey: ['stock-lot', id],
    queryFn: async (): Promise<Lot | null> => {
      const response = await fetchStocks({
        page: 1,
        pageSize: MAX_PAGE_SIZE,
        sort: DEFAULT_SORT,
      });
      return response.data.find((lot) => lot.id === id) ?? null;
    },
  });
}
