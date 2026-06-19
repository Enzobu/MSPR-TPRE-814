import { Inject, Injectable } from '@nestjs/common';
import type { Alert } from '../domain/alert';
import { AlertNotFoundError } from '../domain/alert.errors';
import { ALERT_REPOSITORY } from '../domain/alert.repository';
import type { AlertRepository } from '../domain/alert.repository';

@Injectable()
export class GetAlertUseCase {
  constructor(
    @Inject(ALERT_REPOSITORY) private readonly alerts: AlertRepository,
  ) {}

  async execute(id: string): Promise<Alert> {
    const alert = await this.alerts.findById(id);
    if (!alert) {
      throw new AlertNotFoundError(id);
    }
    return alert;
  }
}
