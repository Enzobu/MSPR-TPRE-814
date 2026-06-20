import { Inject, Injectable } from '@nestjs/common';
import type { PaginatedResponse } from '@futurekawa/contracts';
import type { Lot } from '../domain/lot';
import { LOT_REPOSITORY } from '../domain/lot.repository';
import type { LotRepository, SortDirection } from '../domain/lot.repository';

export interface ListLotsParams {
  page: number;
  pageSize: number;
  direction: SortDirection;
}

@Injectable()
export class ListLotsUseCase {
  constructor(@Inject(LOT_REPOSITORY) private readonly lots: LotRepository) {}

  async execute(params: ListLotsParams): Promise<PaginatedResponse<Lot>> {
    const { page, pageSize, direction } = params;
    const { data, total } = await this.lots.findManyByStoredAt({
      skip: (page - 1) * pageSize,
      take: pageSize,
      direction,
    });
    return { data, total, page, pageSize };
  }
}
