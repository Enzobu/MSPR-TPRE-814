import { Inject, Injectable } from '@nestjs/common';
import type { AlertType, PaginatedResponse } from '@futurekawa/contracts';
import type { Alert } from '../domain/alert';
import { ALERT_REPOSITORY } from '../domain/alert.repository';
import type { AlertRepository } from '../domain/alert.repository';

export interface ListAlertsParams {
  type?: AlertType;
  acknowledged?: boolean;
  page: number;
  pageSize: number;
}

@Injectable()
export class ListAlertsUseCase {
  constructor(
    @Inject(ALERT_REPOSITORY) private readonly alerts: AlertRepository,
  ) {}

  async execute(params: ListAlertsParams): Promise<PaginatedResponse<Alert>> {
    const { type, acknowledged, page, pageSize } = params;
    const { data, total } = await this.alerts.findMany({
      type,
      acknowledged,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { data, total, page, pageSize };
  }
}
