import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ALERT_TYPES,
  COUNTRY_CODES,
  type Alert,
  type AlertType,
  type ConsolidatedResponse,
  type CountryCode,
} from '@futurekawa/contracts';

// Vue siège d'une alerte (forme figée, alignée sur le contrat `Alert`). Le siège
// re-expose la donnée pays via un DTO pour découpler (rules backend-central).
export class AlertDto implements Alert {
  @ApiProperty({
    description: "Identifiant de l'alerte.",
    example: 'clz9x2k4p0000abcd1234efgh',
  })
  id!: string;

  @ApiProperty({
    description: "Pays propriétaire de l'alerte.",
    enum: COUNTRY_CODES,
    example: 'BR',
  })
  country!: CountryCode;

  @ApiProperty({
    description: "Type d'alerte.",
    enum: ALERT_TYPES,
    example: 'TEMPERATURE_OUT_OF_RANGE',
  })
  type!: AlertType;

  @ApiProperty({
    description: 'Message explicatif (FR), valeur et plage.',
    example: 'Température 35°C hors plage [26;32]',
  })
  message!: string;

  @ApiPropertyOptional({
    description: 'Lot concerné (alertes de péremption).',
    example: 'BR-2026-008',
  })
  lotId?: string;

  @ApiPropertyOptional({
    description: 'Entrepôt concerné (alertes T°/humidité).',
    example: 'W1',
  })
  warehouse?: string;

  @ApiProperty({
    description: 'Instant de déclenchement (ISO 8601).',
    example: '2026-06-19T08:00:00.000Z',
  })
  triggeredAt!: string;

  @ApiProperty({
    description: "État d'acquittement.",
    example: false,
  })
  acknowledged!: boolean;
}

// Réponse consolidée de GET /api/v1/alerts : page d'alertes fusionnées (récentes
// d'abord) + pays injoignables. Jamais 500 si un pays est down (ADR-0007).
export class ConsolidatedAlertsResponseDto implements ConsolidatedResponse<AlertDto> {
  @ApiProperty({
    type: [AlertDto],
    description: 'Alertes de la page (triggeredAt décroissant).',
  })
  data!: AlertDto[];

  @ApiProperty({
    description: 'Total des alertes consolidées disponibles.',
    example: 12,
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
