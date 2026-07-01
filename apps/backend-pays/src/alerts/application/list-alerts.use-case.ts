import { Inject, Injectable } from '@nestjs/common';
import type {
  AlertType,
  CountryCode,
  PaginatedResponse,
} from '@futurekawa/contracts';
import type { Alert } from '../domain/alert';
import { ALERT_REPOSITORY } from '../domain/alert.repository';
import type { AlertRepository } from '../domain/alert.repository';

export interface ListAlertsParams {
  type?: AlertType;
  acknowledged?: boolean;
  page: number;
  pageSize: number;
  country?: CountryCode;
}

@Injectable()
export class ListAlertsUseCase {
  constructor(
    @Inject(ALERT_REPOSITORY) private readonly alerts: AlertRepository,
  ) {}

  async execute(params: ListAlertsParams): Promise<PaginatedResponse<Alert>> {
    const { type, acknowledged, page, pageSize, country } = params;
    const { data, total } = await this.alerts.findMany({
      type,
      acknowledged,
      skip: (page - 1) * pageSize,
      take: pageSize,
      country,
    });
    return { data, total, page, pageSize };
  }
}
