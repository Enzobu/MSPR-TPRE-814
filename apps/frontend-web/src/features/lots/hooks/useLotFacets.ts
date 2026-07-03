import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { CountryCode } from '@futurekawa/contracts';
import {
  fetchLotFacets,
  type ConsolidatedFacets,
} from '@/features/lots/api/lots.api';

// Facettes (exploitations, entrepôts) pour peupler les sélecteurs de la page
// lots. Scopées par pays : changer de pays recharge les facettes correspondantes.
export function useLotFacets(
  country?: CountryCode,
): UseQueryResult<ConsolidatedFacets> {
  return useQuery({
    queryKey: ['lot-facets', country ?? 'all'],
    queryFn: () => fetchLotFacets(country),
  });
}
