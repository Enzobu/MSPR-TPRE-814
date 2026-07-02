import { Inject, Injectable } from '@nestjs/common';
import type { CountryCode } from '@futurekawa/contracts';
import { LOT_REPOSITORY } from '../domain/lot.repository';
import type { LotRepository } from '../domain/lot.repository';

export interface SyncWarehouseLotStatusInput {
  country: CountryCode;
  warehouse: string;
  // Verdict de la mesure : au moins une grandeur hors plage pour l'entrepôt.
  outOfRange: boolean;
}

// Reflète les conditions T°/humidité d'un entrepôt sur le statut de ses lots
// (CDC §III.1, ADR-0013) : une mesure hors plage bascule les lots CONFORME →
// EN_ALERTE ; une mesure de retour dans la plage les ramène EN_ALERTE → CONFORME.
// Les lots PERIME ne sont jamais touchés (la péremption prime, filtre `from`).
@Injectable()
export class SyncWarehouseLotStatusUseCase {
  constructor(@Inject(LOT_REPOSITORY) private readonly lots: LotRepository) {}

  async execute(input: SyncWarehouseLotStatusInput): Promise<void> {
    const { country, warehouse, outOfRange } = input;
    if (outOfRange) {
      await this.lots.setWarehouseStatus({
        country,
        warehouse,
        from: 'CONFORME',
        to: 'EN_ALERTE',
      });
      return;
    }
    await this.lots.setWarehouseStatus({
      country,
      warehouse,
      from: 'EN_ALERTE',
      to: 'CONFORME',
    });
  }
}
