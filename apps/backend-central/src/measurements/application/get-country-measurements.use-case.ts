import { Inject, Injectable } from '@nestjs/common';
import type {
  ConsolidatedResponse,
  CountryCode,
  Measurement,
  PaginatedResponse,
} from '@futurekawa/contracts';
import { COUNTRY_BACKEND_GATEWAY } from '../../country-backends/domain/country-backend.gateway';
import {
  CountryUnavailableError,
  type CountryBackendGateway,
} from '../../country-backends/domain/country-backend.gateway';

export interface GetCountryMeasurementsParams {
  country: CountryCode;
  warehouse: string;
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
  correlationId: string;
}

// Proxy mono-pays résilient (ADR-0007) : une mesure appartient à UN pays. Le
// siège relaie l'historique paginé du backend pays ; si le pays est injoignable
// il renvoie une page vide + `unavailable: [country]` (jamais 500).
@Injectable()
export class GetCountryMeasurementsUseCase {
  constructor(
    @Inject(COUNTRY_BACKEND_GATEWAY)
    private readonly gateway: CountryBackendGateway,
  ) {}

  async execute(
    params: GetCountryMeasurementsParams,
  ): Promise<ConsolidatedResponse<Measurement>> {
    const path = this.buildPath(params);
    try {
      const res = await this.gateway.get<PaginatedResponse<Measurement>>(
        params.country,
        path,
        { correlationId: params.correlationId },
      );
      return { ...res, unavailable: [] };
    } catch (error) {
      if (error instanceof CountryUnavailableError) {
        return {
          data: [],
          total: 0,
          page: params.page,
          pageSize: params.pageSize,
          unavailable: [params.country],
        };
      }
      throw error;
    }
  }

  private buildPath(params: GetCountryMeasurementsParams): string {
    const query = new URLSearchParams({
      warehouse: params.warehouse,
      page: String(params.page),
      pageSize: String(params.pageSize),
    });
    if (params.from) {
      query.set('from', params.from);
    }
    if (params.to) {
      query.set('to', params.to);
    }
    return `/api/v1/measurements?${query.toString()}`;
  }
}
