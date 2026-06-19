import { Inject, Injectable } from '@nestjs/common';
import type {
  ConsolidatedList,
  CountryCode,
  MeasurementBucket,
} from '@futurekawa/contracts';
import { COUNTRY_BACKEND_GATEWAY } from '../../country-backends/domain/country-backend.gateway';
import {
  CountryUnavailableError,
  type CountryBackendGateway,
} from '../../country-backends/domain/country-backend.gateway';

export type MeasurementBucketLabel = '1h' | '1d';

export interface AggregateCountryMeasurementsParams {
  country: CountryCode;
  warehouse: string;
  bucket: MeasurementBucketLabel;
  from?: string;
  to?: string;
  correlationId: string;
}

// Proxy mono-pays résilient (ADR-0007) : relaie les moyennes T°/humidité par
// fenêtre d'un entrepôt. Pays injoignable → liste vide + `unavailable: [country]`
// (jamais 500). Pas de cache : la donnée est dynamique (à la différence de /stocks).
@Injectable()
export class AggregateCountryMeasurementsUseCase {
  constructor(
    @Inject(COUNTRY_BACKEND_GATEWAY)
    private readonly gateway: CountryBackendGateway,
  ) {}

  async execute(
    params: AggregateCountryMeasurementsParams,
  ): Promise<ConsolidatedList<MeasurementBucket>> {
    const path = this.buildPath(params);
    try {
      const buckets = await this.gateway.get<MeasurementBucket[]>(
        params.country,
        path,
        { correlationId: params.correlationId },
      );
      return { data: buckets, unavailable: [] };
    } catch (error) {
      if (error instanceof CountryUnavailableError) {
        return { data: [], unavailable: [params.country] };
      }
      throw error;
    }
  }

  private buildPath(params: AggregateCountryMeasurementsParams): string {
    const query = new URLSearchParams({
      warehouse: params.warehouse,
      bucket: params.bucket,
    });
    if (params.from) {
      query.set('from', params.from);
    }
    if (params.to) {
      query.set('to', params.to);
    }
    return `/api/v1/measurements/aggregate?${query.toString()}`;
  }
}
