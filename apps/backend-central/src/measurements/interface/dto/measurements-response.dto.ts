import { ApiProperty } from '@nestjs/swagger';
import {
  COUNTRY_CODES,
  type ConsolidatedResponse,
  type CountryCode,
  type Measurement,
} from '@futurekawa/contracts';

// Vue siège d'une mesure (forme figée, alignée sur le contrat `Measurement`). Le
// siège re-expose la donnée pays via un DTO pour découpler (rules backend-central).
export class MeasurementDto implements Measurement {
  @ApiProperty({
    description: 'Identifiant du relevé.',
    example: 'clz3k9x0a0001qz8h2f4g7d2e',
  })
  id!: string;

  @ApiProperty({
    description: 'Pays propriétaire du relevé.',
    enum: COUNTRY_CODES,
    example: 'BR',
  })
  country!: CountryCode;

  @ApiProperty({
    description: "Entrepôt à l'origine du relevé.",
    example: 'W1',
  })
  warehouse!: string;

  @ApiProperty({
    description: 'Température mesurée (°C).',
    example: 22.5,
  })
  temperatureCelsius!: number;

  @ApiProperty({
    description: 'Humidité relative mesurée (%).',
    example: 55.2,
  })
  humidityPercent!: number;

  @ApiProperty({
    description: 'Instant du relevé (ISO 8601).',
    example: '2026-06-01T08:00:00.000Z',
  })
  recordedAt!: string;
}

// Réponse consolidée de GET /api/v1/measurements : page de relevés d'un entrepôt
// + `unavailable` si le pays est injoignable. Jamais 500 (ADR-0007).
export class ConsolidatedMeasurementsResponseDto implements ConsolidatedResponse<MeasurementDto> {
  @ApiProperty({
    type: [MeasurementDto],
    description: 'Relevés de la page (tri recordedAt décroissant côté pays).',
  })
  data!: MeasurementDto[];

  @ApiProperty({ description: 'Total des relevés disponibles.', example: 240 })
  total!: number;

  @ApiProperty({ description: 'Page courante (1-based).', example: 1 })
  page!: number;

  @ApiProperty({ description: 'Taille de page.', example: 20 })
  pageSize!: number;

  @ApiProperty({
    description: 'Pays injoignable (vide si le pays a répondu).',
    enum: COUNTRY_CODES,
    isArray: true,
    example: [],
  })
  unavailable!: CountryCode[];
}
