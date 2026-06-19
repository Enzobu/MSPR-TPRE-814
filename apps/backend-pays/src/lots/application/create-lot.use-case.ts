import { Inject, Injectable } from '@nestjs/common';
import type { CountryCode } from '@futurekawa/contracts';
import type { Lot, NewLot } from '../domain/lot';
import {
  LotAlreadyExistsError,
  LotCountryMismatchError,
} from '../domain/lot.errors';
import { LOT_REPOSITORY } from '../domain/lot.repository';
import type { LotRepository } from '../domain/lot.repository';
import { COUNTRY_CODE } from './country.token';

@Injectable()
export class CreateLotUseCase {
  constructor(
    @Inject(LOT_REPOSITORY) private readonly lots: LotRepository,
    @Inject(COUNTRY_CODE) private readonly countryCode: CountryCode,
  ) {}

  async execute(input: NewLot): Promise<Lot> {
    // Un backend pays ne gère que les lots de SON pays (CDC §III.5).
    if (input.country !== this.countryCode) {
      throw new LotCountryMismatchError(this.countryCode, input.country);
    }
    // id unique par pays : ce backend ne porte qu'un pays, donc unicité de l'id.
    if (await this.lots.existsById(input.id)) {
      throw new LotAlreadyExistsError(input.id);
    }
    return this.lots.create(input);
  }
}
