import { ApiProperty } from '@nestjs/swagger';

// Représentation RFC 7807 (application/problem+json) renvoyée par le filtre global.
export class ProblemDetailsDto {
  @ApiProperty({
    description: 'URI identifiant le type de problème (RFC 7807).',
    example: 'about:blank',
  })
  type!: string;

  @ApiProperty({
    description: 'Résumé court et lisible du type de problème.',
    example: 'Bad Request',
  })
  title!: string;

  @ApiProperty({ description: 'Code de statut HTTP.', example: 400 })
  status!: number;

  @ApiProperty({
    description:
      "Explication lisible spécifique à cette occurrence de l'erreur.",
    example: 'temperature must not be greater than 60',
  })
  detail!: string;

  @ApiProperty({
    description: "URI de la requête ayant produit l'erreur.",
    example: '/api/v1/measurements',
  })
  instance!: string;

  @ApiProperty({
    description:
      'Détail des erreurs de validation, le cas échéant (un message par contrainte).',
    example: ['temperature must be a number'],
    required: false,
    type: [String],
  })
  errors?: string[];
}
