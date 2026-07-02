import { ApiProperty } from '@nestjs/swagger';
import { COUNTRY_CODES } from '@futurekawa/contracts';
import type { CountryCode } from '@futurekawa/contracts';
import type { ConsolidatedFacets } from '../../application/aggregate-facets.use-case';

// Réponse de GET /api/v1/stocks/facets : union dédupliquée des facettes des
// pays + pays injoignables (ADR-0007). Alimente les sélecteurs du frontend.
export class StocksFacetsResponseDto implements ConsolidatedFacets {
  @ApiProperty({
    description: 'Exploitations distinctes (tous pays consolidés), triées.',
    example: ['Fazenda Aurora', 'Hacienda El Roble'],
    type: [String],
  })
  farms!: string[];

  @ApiProperty({
    description: 'Entrepôts distincts (tous pays consolidés), triés.',
    example: ['Entrepôt Santos', 'Entrepôt Guayaquil'],
    type: [String],
  })
  warehouses!: string[];

  @ApiProperty({
    description: 'Pays injoignables (facettes partielles). Vide si tout est OK.',
    enum: COUNTRY_CODES,
    isArray: true,
    example: [],
  })
  unavailable!: CountryCode[];
}
