import { Inject, Injectable } from '@nestjs/common';
import type { MeasurementBucket } from '../domain/measurement';
import { MEASUREMENT_REPOSITORY } from '../domain/measurement.repository';
import type { MeasurementRepository } from '../domain/measurement.repository';

// Tailles de fenêtre supportées (CDC §III.2). Source unique : l'application
// traduit le label métier en secondes, l'infra ne connaît que les secondes.
export type BucketSize = '1h' | '1d';

const SECONDS_PER_BUCKET: Record<BucketSize, number> = {
  '1h': 3600,
  '1d': 86_400,
};

export interface AggregateMeasurementsParams {
  warehouse: string;
  bucket: BucketSize;
  from?: Date;
  to?: Date;
}

@Injectable()
export class AggregateMeasurementsUseCase {
  constructor(
    @Inject(MEASUREMENT_REPOSITORY)
    private readonly measurements: MeasurementRepository,
  ) {}

  execute(params: AggregateMeasurementsParams): Promise<MeasurementBucket[]> {
    const { warehouse, bucket, from, to } = params;
    return this.measurements.aggregate({
      warehouse,
      bucketSeconds: SECONDS_PER_BUCKET[bucket],
      from,
      to,
    });
  }
}
