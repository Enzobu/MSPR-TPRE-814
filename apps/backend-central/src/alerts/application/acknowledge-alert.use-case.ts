import { Inject, Injectable } from '@nestjs/common';
import type { Alert, CountryCode } from '@futurekawa/contracts';
import { COUNTRY_BACKEND_GATEWAY } from '../../country-backends/domain/country-backend.gateway';
import type { CountryBackendGateway } from '../../country-backends/domain/country-backend.gateway';

export interface AcknowledgeAlertParams {
  country: CountryCode;
  id: string;
  correlationId: string;
}

// Proxy d'ACK vers le pays propriétaire (#36, ADR-0007). L'ACK est une écriture :
// le pays cible est requis. Erreurs relayées par le gateway → traduites en HTTP
// par le controller : `CountryRequestError(404)` → 404, `CountryUnavailableError`
// → 503. Pas de cache (mutation).
@Injectable()
export class AcknowledgeAlertUseCase {
  constructor(
    @Inject(COUNTRY_BACKEND_GATEWAY)
    private readonly gateway: CountryBackendGateway,
  ) {}

  execute(params: AcknowledgeAlertParams): Promise<Alert> {
    const path = `/api/v1/alerts/${encodeURIComponent(params.id)}/acknowledge`;
    return this.gateway.patch<Alert>(params.country, path, undefined, {
      correlationId: params.correlationId,
    });
  }
}
