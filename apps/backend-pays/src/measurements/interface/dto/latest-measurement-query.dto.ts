import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { COUNTRY_CODES } from '@futurekawa/contracts';
import type { CountryCode } from '@futurekawa/contracts';

// Query de GET /api/v1/measurements/latest. `country` optionnel : omis = dernier
// relevé du backend (tous pays). Utilisé par le siège pour scoper chaque appel à
// un pays et éviter, en démo mono-instance, que chaque région renvoie le même
// relevé global (cf. #144).
export class LatestMeasurementQueryDto {
  @ApiPropertyOptional({
    description: 'Filtre par pays. Omis = dernier relevé tous pays confondus.',
    example: 'BR',
    enum: COUNTRY_CODES,
  })
  @IsOptional()
  @IsIn(COUNTRY_CODES, { message: 'country must be one of BR, EC, CO' })
  country?: CountryCode;
}
