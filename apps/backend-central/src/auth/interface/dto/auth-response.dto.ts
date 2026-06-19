import { ApiProperty } from '@nestjs/swagger';
import type {
  AuthResponse,
  AuthenticatedUser,
  CountryCode,
  Role,
} from '@futurekawa/contracts';

// Vue publique de l'utilisateur (jamais de passwordHash).
export class AuthenticatedUserDto implements AuthenticatedUser {
  @ApiProperty({
    description: 'Identifiant interne.',
    example: 'clx9f0a2b0000abcd1234efgh',
  })
  id!: string;

  @ApiProperty({ description: 'Email.', example: 'admin@futurekawa.local' })
  email!: string;

  @ApiProperty({
    description: 'Rôle applicatif (matrice de permissions ADR-0006).',
    enum: ['ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER'],
    example: 'ADMIN',
  })
  role!: Role;

  @ApiProperty({
    description: 'Pays de rattachement, ou null pour un compte siège.',
    enum: ['BR', 'EC', 'CO'],
    nullable: true,
    example: null,
  })
  country!: CountryCode | null;
}

// Réponse de login / refresh : access token dans le body (mémoire front), le
// refresh est posé en cookie httpOnly côté serveur (ADR-0006).
export class AuthResponseDto implements AuthResponse {
  @ApiProperty({
    description:
      'JWT access (HS256, TTL 15 min). À stocker en mémoire, jamais en localStorage.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI...',
  })
  accessToken!: string;

  @ApiProperty({ type: AuthenticatedUserDto })
  user!: AuthenticatedUserDto;
}
