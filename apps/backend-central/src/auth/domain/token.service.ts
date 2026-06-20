import type { Role } from '@futurekawa/contracts';
import type { UserAccount } from './user-account';

// Port d'émission / vérification des JWT (HS256, ADR-0006). Implémenté via
// @nestjs/jwt côté infra. Les claims access portent l'identité ; le refresh
// ne porte que le sujet (rotation à chaque rafraîchissement).
export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

export interface AccessTokenClaims {
  sub: string;
  email: string;
  role: Role;
  country: string | null;
}

export interface RefreshTokenClaims {
  sub: string;
}

export interface TokenService {
  issueAccessToken(user: UserAccount): Promise<string>;
  issueRefreshToken(user: UserAccount): Promise<string>;
  verifyAccessToken(token: string): Promise<AccessTokenClaims>;
  verifyRefreshToken(token: string): Promise<RefreshTokenClaims>;
}
