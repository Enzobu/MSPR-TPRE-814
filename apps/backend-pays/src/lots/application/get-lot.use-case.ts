import { Inject, Injectable } from '@nestjs/common';
import type { Lot } from '../domain/lot';
import { LotNotFoundError } from '../domain/lot.errors';
import { LOT_REPOSITORY } from '../domain/lot.repository';
import type { LotRepository } from '../domain/lot.repository';

@Injectable()
export class GetLotUseCase {
  constructor(@Inject(LOT_REPOSITORY) private readonly lots: LotRepository) {}

  async execute(id: string): Promise<Lot> {
    const lot = await this.lots.findById(id);
    if (!lot) {
      throw new LotNotFoundError(id);
    }
    return lot;
  }
}
