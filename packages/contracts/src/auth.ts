import type { CountryCode } from './country';

// Rôles applicatifs (ADR-0006). Miroir TypeScript de l'enum Prisma `Role`
// (backend-central) — à garder synchronisé à la main (pas de génération croisée).
export type Role = 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'VIEWER';

export const ROLES: readonly Role[] = ['ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER'];

// Utilisateur tel qu'exposé au client après authentification. Jamais de
// passwordHash : c'est la forme publique, partagée front ↔ central.
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  // null pour un utilisateur siège non rattaché à un pays.
  country: CountryCode | null;
}

// Corps de POST /api/v1/auth/login.
export interface LoginRequest {
  email: string;
  password: string;
}

// Réponse de login / refresh. L'access token voyage dans le body (stocké en
// mémoire côté front) ; le refresh token n'apparaît jamais ici — il est posé
// en cookie httpOnly par le serveur (ADR-0006).
export interface AuthResponse {
  accessToken: string;
  user: AuthenticatedUser;
}
