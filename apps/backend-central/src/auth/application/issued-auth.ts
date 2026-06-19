import type { AuthenticatedUser } from '@futurekawa/contracts';
import { toAuthenticatedUser } from '../domain/user-account';
import type { UserAccount } from '../domain/user-account';
import type { TokenService } from '../domain/token.service';

// Résultat d'une authentification réussie : la paire de tokens + la vue
// publique de l'utilisateur. Le refresh est posé en cookie par l'interface,
// l'access renvoyé dans le body.
export interface IssuedAuth {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
}

export async function issueAuth(
  tokens: TokenService,
  user: UserAccount,
): Promise<IssuedAuth> {
  const [accessToken, refreshToken] = await Promise.all([
    tokens.issueAccessToken(user),
    tokens.issueRefreshToken(user),
  ]);
  return { accessToken, refreshToken, user: toAuthenticatedUser(user) };
}
