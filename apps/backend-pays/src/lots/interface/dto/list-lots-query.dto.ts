import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Matches, Max, Min } from 'class-validator';
import { COUNTRY_CODES, type CountryCode } from '@futurekawa/contracts';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
// Seul `storedAt` est triable : c'est la clé FIFO (CDC §III.1).
const SORT_PATTERN = /^storedAt:(asc|desc)$/;

// DTO de query de GET /api/v1/lots. Pagination + tri FIFO. `transform: true`
// (ValidationPipe global) applique les valeurs par défaut et coerce les nombres.
export class ListLotsQueryDto {
  @ApiPropertyOptional({
    description: 'Numéro de page (1-based).',
    example: 1,
    minimum: 1,
    default: DEFAULT_PAGE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = DEFAULT_PAGE;

  @ApiPropertyOptional({
    description: 'Taille de page.',
    example: 20,
    minimum: 1,
    maximum: MAX_PAGE_SIZE,
    default: DEFAULT_PAGE_SIZE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  pageSize: number = DEFAULT_PAGE_SIZE;

  @ApiPropertyOptional({
    description: 'Tri sur la date de stockage (FIFO par défaut, croissant).',
    example: 'storedAt:asc',
    default: 'storedAt:asc',
    pattern: 'storedAt:(asc|desc)',
  })
  @IsOptional()
  @Matches(SORT_PATTERN, {
    message: 'sort must be storedAt:asc or storedAt:desc',
  })
  sort: string = 'storedAt:asc';

  @ApiPropertyOptional({
    description:
      'Filtre par pays. Omis = tous les lots du backend. Utilisé par le ' +
      'siège pour scoper chaque appel à une instance pays (évite les doublons ' +
      'en démo mono-instance).',
    example: 'BR',
    enum: COUNTRY_CODES,
  })
  @IsOptional()
  @IsIn(COUNTRY_CODES, { message: 'country must be one of BR, EC, CO' })
  country?: CountryCode;
}
