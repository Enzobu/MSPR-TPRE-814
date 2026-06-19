import { Inject, Injectable } from '@nestjs/common';
import { InvalidCredentialsError } from '../domain/auth.errors';
import { PASSWORD_HASHER } from '../domain/password-hasher';
import type { PasswordHasher } from '../domain/password-hasher';
import { TOKEN_SERVICE } from '../domain/token.service';
import type { TokenService } from '../domain/token.service';
import { USER_REPOSITORY } from '../domain/user.repository';
import type { UserRepository } from '../domain/user.repository';
import { issueAuth } from './issued-auth';
import type { IssuedAuth } from './issued-auth';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
  ) {}

  async execute(email: string, password: string): Promise<IssuedAuth> {
    const user = await this.users.findByEmail(email);

    // Même erreur générique que l'utilisateur existe ou non : pas d'oracle
    // d'énumération d'emails (OWASP, ADR-0006).
    if (!user || !(await this.hasher.compare(password, user.passwordHash))) {
      throw new InvalidCredentialsError();
    }

    return issueAuth(this.tokens, user);
  }
}
