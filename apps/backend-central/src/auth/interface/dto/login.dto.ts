import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import type { LoginRequest } from '@futurekawa/contracts';

// DTO d'entrée de POST /auth/login. La politique de complexité du mot de passe
// (ADR-0006) s'applique à la *création* d'un compte (ticket ultérieur), pas au
// login : on évite de divulguer la politique et de rejeter un mot de passe
// légitime. Ici on borne seulement la taille.
export class LoginDto implements LoginRequest {
  @ApiProperty({
    description: "Email de l'utilisateur.",
    example: 'admin@futurekawa.local',
    format: 'email',
  })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({
    description: 'Mot de passe en clair (HTTPS obligatoire en prod).',
    example: 'Adm1n-FutureKawa',
    minLength: 12,
    maxLength: 128,
  })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;
}
