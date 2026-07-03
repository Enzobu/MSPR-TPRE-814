import { Inject, Injectable } from '@nestjs/common';
import type { CountryCode, LotFacets } from '@futurekawa/contracts';
import { LOT_REPOSITORY } from '../domain/lot.repository';
import type { LotRepository } from '../domain/lot.repository';

export interface GetLotFacetsParams {
  country?: CountryCode;
}

// Expose les valeurs distinctes (exploitations, entrepôts) pour alimenter les
// sélecteurs du frontend (CDC §III.3). Le siège agrège ensuite les facettes des
// trois pays.
@Injectable()
export class GetLotFacetsUseCase {
  constructor(@Inject(LOT_REPOSITORY) private readonly lots: LotRepository) {}

  execute(params: GetLotFacetsParams): Promise<LotFacets> {
    return this.lots.findFacets({ country: params.country });
  }
}
