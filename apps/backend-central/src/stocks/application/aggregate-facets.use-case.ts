import { Inject, Injectable } from '@nestjs/common';
import type { CountryCode, LotFacets } from '@futurekawa/contracts';
import { COUNTRY_BACKEND_GATEWAY } from '../../country-backends/domain/country-backend.gateway';
import type { CountryBackendGateway } from '../../country-backends/domain/country-backend.gateway';

export interface AggregateFacetsParams {
  countries: CountryCode[];
  correlationId: string;
}

export interface ConsolidatedFacets extends LotFacets {
  unavailable: CountryCode[];
}

// Consolide les facettes (exploitations, entrepôts) des backends pays pour
// alimenter les sélecteurs du frontend (CDC §III.3). Même résilience que
// l'agrégation des stocks (ADR-0007) : un pays down → `unavailable`, jamais 500.
@Injectable()
export class AggregateFacetsUseCase {
  constructor(
    @Inject(COUNTRY_BACKEND_GATEWAY)
    private readonly gateway: CountryBackendGateway,
  ) {}

  async execute(params: AggregateFacetsParams): Promise<ConsolidatedFacets> {
    const settled = await Promise.allSettled(
      params.countries.map((country) =>
        this.gateway.get<LotFacets>(
          country,
          `/api/v1/lots/facets?country=${country}`,
          { correlationId: params.correlationId },
        ),
      ),
    );

    const farms = new Set<string>();
    const warehouses = new Set<string>();
    const unavailable: CountryCode[] = [];
    settled.forEach((outcome, index) => {
      if (outcome.status === 'fulfilled') {
        outcome.value.farms.forEach((f) => farms.add(f));
        outcome.value.warehouses.forEach((w) => warehouses.add(w));
      } else {
        unavailable.push(params.countries[index]);
      }
    });

    return {
      farms: [...farms].sort((a, b) => a.localeCompare(b)),
      warehouses: [...warehouses].sort((a, b) => a.localeCompare(b)),
      unavailable,
    };
  }
}
