import { Inject, Injectable } from '@nestjs/common';
import {
  COUNTRY_CODES,
  type ConsolidatedList,
  type CountryCode,
  type Measurement,
} from '@futurekawa/contracts';
import { COUNTRY_BACKEND_GATEWAY } from '../../country-backends/domain/country-backend.gateway';
import type { CountryBackendGateway } from '../../country-backends/domain/country-backend.gateway';

export interface GetLatestMeasurementsParams {
  correlationId: string;
}

// Forme renvoyée par chaque backend pays sur /measurements/latest.
interface LatestMeasurementResponse {
  measurement: Measurement | null;
}

// `country` scope l'appel à ce pays : en démo mono-instance (3 URLs → 1 backend,
// 1 DB multi-pays), évite que chaque région renvoie le même relevé global. No-op
// en déploiement réel (1 instance/pays). Miroir du fix #144.
const latestPath = (country: CountryCode): string =>
  `/api/v1/measurements/latest?country=${country}`;

// Vue « dernier relevé par région » (#143, ADR-0007). Fan-out `Promise.allSettled`
// sur les trois pays : chacun renvoie son dernier relevé (ou null). On agrège les
// relevés existants et on liste les pays injoignables dans `unavailable` (jamais
// 500). Un pays sans relevé est simplement absent de `data` (ni erreur, ni null).
@Injectable()
export class GetLatestMeasurementsUseCase {
  constructor(
    @Inject(COUNTRY_BACKEND_GATEWAY)
    private readonly gateway: CountryBackendGateway,
  ) {}

  async execute(
    params: GetLatestMeasurementsParams,
  ): Promise<ConsolidatedList<Measurement>> {
    const countries = [...COUNTRY_CODES];
    const settled = await Promise.allSettled(
      countries.map((country) =>
        this.gateway.get<LatestMeasurementResponse>(
          country,
          latestPath(country),
          { correlationId: params.correlationId },
        ),
      ),
    );

    const data: Measurement[] = [];
    const unavailable: CountryCode[] = [];
    settled.forEach((outcome, index) => {
      if (outcome.status === 'rejected') {
        unavailable.push(countries[index]);
        return;
      }
      if (outcome.value.measurement) {
        data.push(outcome.value.measurement);
      }
    });
    return { data, unavailable };
  }
}
