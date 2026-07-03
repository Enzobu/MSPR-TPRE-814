import type {
  ConsolidatedResponse,
  CountryCode,
  Lot,
  LotFacets,
} from '@futurekawa/contracts';
import { httpClient } from '@/lib/http-client';

const STOCKS_PATH = '/api/v1/stocks';
const STOCKS_FACETS_PATH = '/api/v1/stocks/facets';

// Facettes consolidées (exploitations, entrepôts) + pays injoignables.
export interface ConsolidatedFacets extends LotFacets {
  unavailable: CountryCode[];
}

export interface FetchStocksParams {
  country?: CountryCode;
  farm?: string;
  warehouse?: string;
  page: number;
  pageSize: number;
  sort: string;
}

// Lecture consolidée des lots via backend-central (ADR-0007). `country` absent =
// agrégation BR+EC+CO. `unavailable` liste les pays injoignables sans faire échouer
// la requête. La forme n'est jamais re-typée localement : ConsolidatedResponse<Lot>
// vient de @futurekawa/contracts.
export async function fetchStocks(
  params: FetchStocksParams,
): Promise<ConsolidatedResponse<Lot>> {
  const response = await httpClient.get<ConsolidatedResponse<Lot>>(
    STOCKS_PATH,
    { params },
  );
  return response.data;
}

// Facettes de filtrage (CDC §III.3), scopables par pays. Alimente les sélecteurs
// exploitation/entrepôt de la page lots.
export async function fetchLotFacets(
  country?: CountryCode,
): Promise<ConsolidatedFacets> {
  const response = await httpClient.get<ConsolidatedFacets>(
    STOCKS_FACETS_PATH,
    { params: country ? { country } : {} },
  );
  return response.data;
}
