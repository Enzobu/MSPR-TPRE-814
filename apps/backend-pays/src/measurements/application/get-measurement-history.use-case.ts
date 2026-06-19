import { Inject, Injectable } from '@nestjs/common';
import type { PaginatedResponse } from '@futurekawa/contracts';
import type { Measurement } from '../domain/measurement';
import { MEASUREMENT_REPOSITORY } from '../domain/measurement.repository';
import type { MeasurementRepository } from '../domain/measurement.repository';

export interface GetMeasurementHistoryParams {
  warehouse: string;
  from?: Date;
  to?: Date;
  page: number;
  pageSize: number;
}

@Injectable()
export class GetMeasurementHistoryUseCase {
  constructor(
    @Inject(MEASUREMENT_REPOSITORY)
    private readonly measurements: MeasurementRepository,
  ) {}

  async execute(
    params: GetMeasurementHistoryParams,
  ): Promise<PaginatedResponse<Measurement>> {
    const { warehouse, from, to, page, pageSize } = params;
    const { data, total } = await this.measurements.findHistory({
      warehouse,
      from,
      to,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { data, total, page, pageSize };
  }
}
