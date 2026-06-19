import { ApiProperty } from '@nestjs/swagger';
import { COUNTRY_CODES, LOT_STATUSES } from '@futurekawa/contracts';
import type { CountryCode, Lot, LotStatus } from '@futurekawa/contracts';

// DTO de sortie : forme figée alignée sur le contrat `Lot`, indépendante de la
// table Prisma (timestamps et champs internes non exposés).
export class LotResponseDto implements Lot {
  @ApiProperty({
    description: 'Identifiant métier du lot.',
    example: 'BR-2026-008',
  })
  id!: string;

  @ApiProperty({
    description: 'Pays du lot.',
    enum: COUNTRY_CODES,
    example: 'BR',
  })
  country!: CountryCode;

  @ApiProperty({
    description: "Exploitation d'origine.",
    example: 'Fazenda Aurora',
  })
  farm!: string;

  @ApiProperty({
    description: 'Entrepôt de stockage.',
    example: 'Entrepôt Sul-1',
  })
  warehouse!: string;

  @ApiProperty({
    description: "Date d'entreposage (ISO 8601).",
    example: '2026-06-01T08:00:00.000Z',
  })
  storedAt!: string;

  @ApiProperty({
    description: 'Statut courant.',
    enum: LOT_STATUSES,
    example: 'CONFORME',
  })
  status!: LotStatus;
}
