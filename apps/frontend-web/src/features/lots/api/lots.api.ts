import type {
  ConsolidatedResponse,
  CountryCode,
  Lot,
} from '@futurekawa/contracts';
import { httpClient } from '@/lib/http-client';

const STOCKS_PATH = '/api/v1/stocks';

export interface FetchStocksParams {
  country?: CountryCode;
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
