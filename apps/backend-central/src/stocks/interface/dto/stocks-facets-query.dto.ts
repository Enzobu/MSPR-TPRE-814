import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { COUNTRY_CODES } from '@futurekawa/contracts';
import type { CountryCode } from '@futurekawa/contracts';

// Query de GET /api/v1/stocks/facets. `country` optionnel : absent → facettes
// consolidées des trois pays.
export class StocksFacetsQueryDto {
  @ApiPropertyOptional({
    description: 'Filtre par pays. Absent → facettes BR + EC + CO.',
    enum: COUNTRY_CODES,
    example: 'BR',
  })
  @IsOptional()
  @IsIn(COUNTRY_CODES)
  country?: CountryCode;
}
