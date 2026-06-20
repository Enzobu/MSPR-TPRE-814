import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import type { Role } from '@futurekawa/contracts';
import type { Env } from '../../config/env.validation';
import type {
  AccessTokenClaims,
  RefreshTokenClaims,
  TokenService,
} from '../domain/token.service';
import type { UserAccount } from '../domain/user-account';

type TokenKind = 'access' | 'refresh';

// HS256 via @nestjs/jwt (secret partagé, émetteur unique central — ADR-0006).
// Le claim `type` distingue access et refresh : un refresh ne peut pas être
// présenté comme un access et inversement.
type ExpiresIn = JwtSignOptions['expiresIn'];

@Injectable()
export class JwtTokenService implements TokenService {
  // WHY: expiresIn attend le type StringValue de `ms` (template littéral), pas un
  // string brut ; les TTL viennent de l'env validé ('15m'/'7d'), donc cast sûr.
  private readonly accessTtl: ExpiresIn;
  private readonly refreshTtl: ExpiresIn;

  constructor(
    private readonly jwt: JwtService,
    config: ConfigService<Env, true>,
  ) {
    this.accessTtl = config.get('JWT_ACCESS_TTL');
    this.refreshTtl = config.get('JWT_REFRESH_TTL');
  }

  issueAccessToken(user: UserAccount): Promise<string> {
    return this.jwt.signAsync(
      {
        type: 'access',
        email: user.email,
        role: user.role,
        country: user.country,
      },
      { subject: user.id, expiresIn: this.accessTtl },
    );
  }

  issueRefreshToken(user: UserAccount): Promise<string> {
    return this.jwt.signAsync(
      { type: 'refresh' },
      { subject: user.id, expiresIn: this.refreshTtl },
    );
  }

  async verifyAccessToken(token: string): Promise<AccessTokenClaims> {
    const payload = await this.verify(token, 'access');
    return {
      sub: payload.sub,
      email: payload.email as string,
      role: payload.role as Role,
      country: (payload.country as string | null) ?? null,
    };
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenClaims> {
    const payload = await this.verify(token, 'refresh');
    return { sub: payload.sub };
  }

  private async verify(
    token: string,
    expected: TokenKind,
  ): Promise<{ sub: string } & Record<string, unknown>> {
    const payload = await this.jwt.verifyAsync<
      { sub?: string; type?: string } & Record<string, unknown>
    >(token);
    if (payload.type !== expected || typeof payload.sub !== 'string') {
      throw new Error(`Expected a ${expected} token`);
    }
    return payload as { sub: string } & Record<string, unknown>;
  }
}
