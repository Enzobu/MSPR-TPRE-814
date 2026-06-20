import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ExpireLotsUseCase } from '../application/expire-lots.use-case';

// Déclencheur quotidien de la péremption (ADR-0004 : 02:00 UTC, heure creuse).
// Pur déclencheur : la logique métier vit dans le use-case (testable sans cron).
@Injectable()
export class LotExpirationCron {
  constructor(
    private readonly expireLots: ExpireLotsUseCase,
    @InjectPinoLogger(LotExpirationCron.name)
    private readonly logger: PinoLogger,
  ) {}

  @Cron('0 2 * * *')
  async handleDailyExpiration(): Promise<void> {
    try {
      await this.expireLots.execute(new Date());
    } catch (error: unknown) {
      this.logger.error({ err: error }, 'Cron péremption en échec');
    }
  }
}
