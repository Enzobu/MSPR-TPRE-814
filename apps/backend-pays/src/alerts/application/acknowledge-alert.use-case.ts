import { Inject, Injectable } from '@nestjs/common';
import type { Alert } from '../domain/alert';
import { AlertNotFoundError } from '../domain/alert.errors';
import { ALERT_REPOSITORY } from '../domain/alert.repository';
import type { AlertRepository } from '../domain/alert.repository';

@Injectable()
export class AcknowledgeAlertUseCase {
  constructor(
    @Inject(ALERT_REPOSITORY) private readonly alerts: AlertRepository,
  ) {}

  async execute(id: string): Promise<Alert> {
    const acknowledged = await this.alerts.acknowledge(id);
    if (!acknowledged) {
      throw new AlertNotFoundError(id);
    }
    return acknowledged;
  }
}
