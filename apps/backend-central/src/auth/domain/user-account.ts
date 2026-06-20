import type {
  AuthenticatedUser,
  CountryCode,
  Role,
} from '@futurekawa/contracts';

// Représentation domaine d'un utilisateur, hash de mot de passe inclus.
// Distincte de `AuthenticatedUser` (contrat public, sans secret).
export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  country: string | null;
}

// Projette un UserAccount vers sa forme publique (sans passwordHash).
export function toAuthenticatedUser(user: UserAccount): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    // country n'est qu'un code pays validé en amont (seed / référentiel).
    country: user.country as CountryCode | null,
  };
}
