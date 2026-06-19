import type {
  Alert,
  AlertType,
  ConsolidatedResponse,
  CountryCode,
} from '@futurekawa/contracts';
import { httpClient } from '@/lib/http-client';

const ALERTS_PATH = '/api/v1/alerts';

export interface FetchAlertsParams {
  country?: CountryCode;
  type?: AlertType;
  acknowledged?: boolean;
  page: number;
  pageSize: number;
}

// Lecture consolidée des alertes via backend-central (ADR-0007). `country` absent =
// agrégation BR+EC+CO, tri `triggeredAt desc`. `unavailable` liste les pays
// injoignables sans faire échouer la requête. La forme n'est jamais re-typée
// localement : ConsolidatedResponse<Alert> vient de @futurekawa/contracts.
export async function fetchAlerts(
  params: FetchAlertsParams,
): Promise<ConsolidatedResponse<Alert>> {
  const response = await httpClient.get<ConsolidatedResponse<Alert>>(
    ALERTS_PATH,
    { params },
  );
  return response.data;
}

// Acquittement d'une alerte. `country` est REQUIS en query : le siège route la
// requête vers le backend pays propriétaire de l'alerte (404 alerte inconnue,
// 503 si le pays est injoignable).
export async function acknowledgeAlert(
  id: string,
  country: CountryCode,
): Promise<Alert> {
  const response = await httpClient.patch<Alert>(
    `${ALERTS_PATH}/${id}/acknowledge`,
    undefined,
    { params: { country } },
  );
  return response.data;
}
