import { Inject, Injectable } from '@nestjs/common';
import type { LotStatus } from '@futurekawa/contracts';
import type { Lot } from '../domain/lot';
import { LotNotFoundError } from '../domain/lot.errors';
import { LOT_REPOSITORY } from '../domain/lot.repository';
import type { LotRepository } from '../domain/lot.repository';

@Injectable()
export class UpdateLotStatusUseCase {
  constructor(@Inject(LOT_REPOSITORY) private readonly lots: LotRepository) {}

  async execute(id: string, status: LotStatus): Promise<Lot> {
    const updated = await this.lots.updateStatus(id, status);
    if (!updated) {
      throw new LotNotFoundError(id);
    }
    return updated;
  }
}
