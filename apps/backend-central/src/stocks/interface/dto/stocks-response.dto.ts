import { ApiProperty } from '@nestjs/swagger';
import {
  COUNTRY_CODES,
  LOT_STATUSES,
  type ConsolidatedResponse,
  type CountryCode,
  type Lot,
  type LotStatus,
} from '@futurekawa/contracts';

// Vue siège d'un lot (forme figée, alignée sur le contrat `Lot`). Le siège
// re-expose la donnée pays via un DTO pour découpler (rules backend-central).
export class StockLotDto implements Lot {
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

// Réponse consolidée de GET /api/v1/stocks : page de lots fusionnés FIFO +
// pays injoignables. Jamais 500 si un pays est down (ADR-0007).
export class StocksResponseDto implements ConsolidatedResponse<StockLotDto> {
  @ApiProperty({ type: [StockLotDto], description: 'Lots de la page (FIFO).' })
  data!: StockLotDto[];

  @ApiProperty({
    description: 'Total des lots consolidés disponibles.',
    example: 20,
  })
  total!: number;

  @ApiProperty({ description: 'Page courante (1-based).', example: 1 })
  page!: number;

  @ApiProperty({ description: 'Taille de page.', example: 20 })
  pageSize!: number;

  @ApiProperty({
    description: 'Pays injoignables (exclus du résultat). Vide si tout est OK.',
    enum: COUNTRY_CODES,
    isArray: true,
    example: ['EC'],
  })
  unavailable!: CountryCode[];
}
