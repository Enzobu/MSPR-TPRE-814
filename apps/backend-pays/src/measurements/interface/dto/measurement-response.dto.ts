import { ApiProperty } from '@nestjs/swagger';
import { COUNTRY_CODES } from '@futurekawa/contracts';
import type { CountryCode, Measurement } from '@futurekawa/contracts';

// DTO de sortie : forme figée alignée sur le contrat `Measurement`, indépendante
// de la table Prisma (createdAt non exposé).
export class MeasurementResponseDto implements Measurement {
  @ApiProperty({
    description: 'Identifiant du relevé (cuid).',
    example: 'clz9k2p3q0000abcd1234efgh',
  })
  id!: string;

  @ApiProperty({
    description: 'Pays du relevé.',
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
    description: 'Température en degrés Celsius.',
    example: 22.5,
  })
  temperatureCelsius!: number;

  @ApiProperty({
    description: 'Humidité relative en pourcentage.',
    example: 55.2,
  })
  humidityPercent!: number;

  @ApiProperty({
    description: 'Instant du relevé (ISO 8601).',
    example: '2026-06-01T08:00:00.000Z',
  })
  recordedAt!: string;
}
