import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { ConsolidatedResponse, Measurement } from '@futurekawa/contracts';
import {
  fetchMeasurements,
  type FetchMeasurementsParams,
} from '@/features/measurements/api/measurements.api';

// Historique des mesures d'un entrepôt. La requête n'est activée que si pays ET
// entrepôt sont présents (le siège renvoie 400 sinon). La clé inclut tous les
// paramètres pour un cache correct par fenêtre temporelle.
export function useMeasurements(
  params: FetchMeasurementsParams,
): UseQueryResult<ConsolidatedResponse<Measurement>> {
  return useQuery({
    queryKey: ['measurements', params],
    queryFn: () => fetchMeasurements(params),
    enabled: Boolean(params.country) && Boolean(params.warehouse),
  });
}
