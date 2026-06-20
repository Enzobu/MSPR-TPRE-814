import { ApiProperty } from '@nestjs/swagger';

// Représentation RFC 7807 (application/problem+json) renvoyée par le filtre global.
// Partagée par les deux backends (@futurekawa/nest-common) : les exemples Swagger
// sont génériques, chaque backend documente ses cas concrets dans ses contrôleurs.
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
    example: 'Validation failed',
  })
  detail!: string;

  @ApiProperty({
    description: "URI de la requête ayant produit l'erreur.",
    example: '/api/v1/resource',
  })
  instance!: string;

  @ApiProperty({
    description:
      'Détail des erreurs de validation, le cas échéant (un message par contrainte).',
    example: ['field must not be empty'],
    required: false,
    type: [String],
  })
  errors?: string[];
}
