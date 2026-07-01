import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { ConsolidatedList, Measurement } from '@futurekawa/contracts';
import { fetchLatestMeasurements } from '@/features/measurements/api/measurements.api';

// Rafraîchissement du dernier relevé par région : les mesures arrivent en continu
// côté pays, on repolle pour que le siège voie les dérives sans recharger.
export const LATEST_MEASUREMENTS_REFETCH_INTERVAL_MS = 30_000;

// Dernier relevé consolidé par région (une carte par pays). La clé est stable
// (endpoint sans paramètre) ; le polling maintient la fraîcheur.
export function useLatestMeasurements(): UseQueryResult<
  ConsolidatedList<Measurement>
> {
  return useQuery({
    queryKey: ['measurements', 'latest'],
    queryFn: fetchLatestMeasurements,
    refetchInterval: LATEST_MEASUREMENTS_REFETCH_INTERVAL_MS,
  });
}
