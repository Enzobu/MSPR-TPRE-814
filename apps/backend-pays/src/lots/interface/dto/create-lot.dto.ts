import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';
import { COUNTRY_CODES } from '@futurekawa/contracts';
import type {
  CountryCode,
  CreateLotDto as CreateLotContract,
} from '@futurekawa/contracts';

// DTO d'entrée de POST /api/v1/lots. Implémente le contrat partagé `CreateLotDto`
// pour rester aligné avec le front. Le statut initial n'est pas fourni (CONFORME
// par défaut).
export class CreateLotDto implements CreateLotContract {
  @ApiProperty({
    description: 'Identifiant métier du lot (unique au sein du pays).',
    example: 'BR-2026-008',
    maxLength: 64,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  id!: string;

  @ApiProperty({
    description: 'Pays du lot. Doit correspondre au COUNTRY_CODE du backend.',
    enum: COUNTRY_CODES,
    example: 'BR',
  })
  @IsIn(COUNTRY_CODES)
  country!: CountryCode;

  @ApiProperty({
    description: "Exploitation d'origine.",
    example: 'Fazenda Aurora',
    maxLength: 120,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  farm!: string;

  @ApiProperty({
    description: 'Entrepôt de stockage.',
    example: 'Entrepôt Sul-1',
    maxLength: 120,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  warehouse!: string;

  @ApiProperty({
    description: "Date d'entreposage (ISO 8601). Clé du tri FIFO.",
    example: '2026-06-01T08:00:00.000Z',
    format: 'date-time',
  })
  @IsISO8601()
  storedAt!: string;
}
