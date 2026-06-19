import { Inject, Injectable } from '@nestjs/common';
import { InvalidRefreshTokenError } from '../domain/auth.errors';
import { TOKEN_SERVICE } from '../domain/token.service';
import type { TokenService } from '../domain/token.service';
import { USER_REPOSITORY } from '../domain/user.repository';
import type { UserRepository } from '../domain/user.repository';
import { issueAuth } from './issued-auth';
import type { IssuedAuth } from './issued-auth';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
  ) {}

  // Rotation (ADR-0006) : un refresh consommé est ré-émis avec un access neuf.
  async execute(refreshToken: string): Promise<IssuedAuth> {
    let claims: { sub: string };
    try {
      claims = await this.tokens.verifyRefreshToken(refreshToken);
    } catch {
      throw new InvalidRefreshTokenError();
    }

    // L'utilisateur peut avoir été supprimé depuis l'émission du token.
    const user = await this.users.findById(claims.sub);
    if (!user) {
      throw new InvalidRefreshTokenError();
    }

    return issueAuth(this.tokens, user);
  }
}
