import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  HUMIDITY_PERCENT_MAX,
  HUMIDITY_PERCENT_MIN,
  TEMPERATURE_CELSIUS_MAX,
  TEMPERATURE_CELSIUS_MIN,
} from '@futurekawa/contracts';
import type { IngestMeasurementDto as IngestMeasurementContract } from '@futurekawa/contracts';

// DTO d'entrée du fallback REST POST /api/v1/measurements (ADR-0003). Aligné sur
// `IngestMeasurementDto` de @futurekawa/contracts. Le `country` n'est PAS dans le
// body : il vient du token COUNTRY_CODE de l'instance. Bornes identiques au
// parsing MQTT (mêmes constantes contracts), never trust the client.
export class IngestMeasurementDto implements IngestMeasurementContract {
  @ApiProperty({
    description: "Entrepôt à l'origine du relevé.",
    example: 'W1',
  })
  @IsString()
  @IsNotEmpty()
  warehouse!: string;

  @ApiProperty({
    description: 'Température en degrés Celsius.',
    minimum: TEMPERATURE_CELSIUS_MIN,
    maximum: TEMPERATURE_CELSIUS_MAX,
    example: 22.5,
  })
  @Min(TEMPERATURE_CELSIUS_MIN)
  @Max(TEMPERATURE_CELSIUS_MAX)
  temperatureCelsius!: number;

  @ApiProperty({
    description: 'Humidité relative en pourcentage.',
    minimum: HUMIDITY_PERCENT_MIN,
    maximum: HUMIDITY_PERCENT_MAX,
    example: 55.2,
  })
  @Min(HUMIDITY_PERCENT_MIN)
  @Max(HUMIDITY_PERCENT_MAX)
  humidityPercent!: number;

  @ApiPropertyOptional({
    description:
      'Instant du relevé (ISO 8601). Optionnel : omis → horodaté à la réception.',
    example: '2026-06-01T08:00:00.000Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsISO8601()
  recordedAt?: string;
}
