import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { COUNTRY_CODES, type CountryCode } from '@futurekawa/contracts';

// Query de GET /api/v1/lots/facets. `country` scope les facettes (dédup démo
// mono-instance, comme la liste des lots).
export class LotFacetsQueryDto {
  @ApiPropertyOptional({
    description:
      'Filtre par pays. Omis = facettes de tous les lots du backend.',
    example: 'BR',
    enum: COUNTRY_CODES,
  })
  @IsOptional()
  @IsIn(COUNTRY_CODES, { message: 'country must be one of BR, EC, CO' })
  country?: CountryCode;
}
