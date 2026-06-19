import type {
  ConsolidatedResponse,
  CountryCode,
  Measurement,
} from '@futurekawa/contracts';
import { httpClient } from '@/lib/http-client';

const MEASUREMENTS_PATH = '/api/v1/measurements';

// Plafond de points récupérés pour une courbe. Au-delà, la lisibilité et la
// performance du rendu se dégradent : un downsampling client ou l'usage de
// l'endpoint d'agrégat (`/measurements/aggregate`) sera l'amélioration future.
export const MEASUREMENTS_CHART_PAGE_SIZE = 100;

export interface FetchMeasurementsParams {
  country: CountryCode;
  warehouse: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

// Historique brut des mesures via backend-central. `country` et `warehouse` sont
// REQUIS (le siège renvoie 400 sinon). On lit les points individuels pour pouvoir
// distinguer ceux hors tolérance, plutôt que l'agrégat moyenné. La forme n'est
// jamais re-typée localement : ConsolidatedResponse<Measurement> vient de contracts.
export async function fetchMeasurements(
  params: FetchMeasurementsParams,
): Promise<ConsolidatedResponse<Measurement>> {
  const response = await httpClient.get<ConsolidatedResponse<Measurement>>(
    MEASUREMENTS_PATH,
    {
      params: {
        country: params.country,
        warehouse: params.warehouse,
        from: params.from,
        to: params.to,
        page: params.page ?? 1,
        pageSize: params.pageSize ?? MEASUREMENTS_CHART_PAGE_SIZE,
      },
    },
  );
  return response.data;
}
