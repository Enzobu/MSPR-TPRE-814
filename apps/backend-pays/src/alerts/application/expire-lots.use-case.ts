import { Inject, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { LOT_MAX_AGE_DAYS, type AlertType } from '@futurekawa/contracts';
import {
  LOT_REPOSITORY,
  type LotRepository,
} from '../../lots/domain/lot.repository';
import type { Lot } from '../../lots/domain/lot';
import { startOfDayUtc } from '../domain/day';
import { expirationCutoff } from '../domain/lot-expiration';
import { ALERT_NOTIFIER } from '../domain/alert-notifier';
import type { AlertNotifier } from '../domain/alert-notifier';
import { ALERT_REPOSITORY } from '../domain/alert.repository';
import type { AlertRepository } from '../domain/alert.repository';

const LOT_EXPIRED: AlertType = 'LOT_EXPIRED';

const expiredMessage = (lotId: string): string =>
  `Lot ${lotId} périmé : stocké depuis plus de ${LOT_MAX_AGE_DAYS} jours`;

// Marque les lots > LOT_MAX_AGE_DAYS jours en PERIME et lève une alerte
// LOT_EXPIRED dédupliquée par (pays, lot, jour UTC) (ADR-0004). Idempotent : un 2e
// passage le même jour ne crée pas de doublon et ne « re-périme » pas un lot.
// Best-effort par lot : une erreur sur un lot n'interrompt pas le scan.
@Injectable()
export class ExpireLotsUseCase {
  constructor(
    @Inject(LOT_REPOSITORY) private readonly lots: LotRepository,
    @Inject(ALERT_REPOSITORY) private readonly alerts: AlertRepository,
    @Inject(ALERT_NOTIFIER) private readonly notifier: AlertNotifier,
    @InjectPinoLogger(ExpireLotsUseCase.name)
    private readonly logger: PinoLogger,
  ) {}

  async execute(now: Date): Promise<void> {
    const cutoff = expirationCutoff(now);
    const expirable = await this.lots.findExpirable(cutoff);
    const dayUtc = startOfDayUtc(now);

    let expiredCount = 0;
    let raisedCount = 0;
    for (const lot of expirable) {
      const raised = await this.expireOne(lot, now, dayUtc);
      expiredCount += 1;
      if (raised) {
        raisedCount += 1;
      }
    }

    this.logger.info(
      { scanned: expirable.length, expired: expiredCount, raised: raisedCount },
      'Cron péremption terminé',
    );
  }

  private async expireOne(lot: Lot, now: Date, dayUtc: Date): Promise<boolean> {
    try {
      await this.lots.updateStatus(lot.id, 'PERIME');
      return await this.raiseIfNew(lot, now, dayUtc);
    } catch (error: unknown) {
      // Best-effort : un lot en échec ne doit pas stopper le scan des autres.
      this.logger.warn({ err: error, lotId: lot.id }, 'Péremption lot échouée');
      return false;
    }
  }

  private async raiseIfNew(
    lot: Lot,
    now: Date,
    dayUtc: Date,
  ): Promise<boolean> {
    const alreadyRaised = await this.alerts.existsForLotOnDay(
      lot.country,
      LOT_EXPIRED,
      lot.id,
      dayUtc,
    );
    if (alreadyRaised) {
      return false;
    }

    const alert = await this.alerts.save({
      country: lot.country,
      type: LOT_EXPIRED,
      message: expiredMessage(lot.id),
      lotId: lot.id,
      warehouse: lot.warehouse,
      triggeredAt: now,
    });
    // Notification best-effort (ADR-0004) : déjà dans un try/catch côté scan.
    await this.notifier.notify(alert);
    return true;
  }
}
