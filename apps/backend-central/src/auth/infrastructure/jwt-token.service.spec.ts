import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Env } from '../../config/env.validation';
import type { UserAccount } from '../domain/user-account';
import { JwtTokenService } from './jwt-token.service';

const buildUser = (over: Partial<UserAccount> = {}): UserAccount => ({
  id: 'u1',
  email: 'admin@futurekawa.local',
  passwordHash: 'stored-hash',
  role: 'OPERATOR',
  country: 'EC',
  ...over,
});

const configWith = (values: Partial<Env>): ConfigService<Env, true> =>
  ({
    get: (key: keyof Env) => values[key],
  }) as unknown as ConfigService<Env, true>;

describe('JwtTokenService', () => {
  const secret = 'test-secret-at-least-32-characters-long';
  const jwt = new JwtService({ secret, signOptions: { algorithm: 'HS256' } });
  const service = new JwtTokenService(
    jwt,
    configWith({ JWT_ACCESS_TTL: '15m', JWT_REFRESH_TTL: '7d' }),
  );

  it('should issue an access token carrying sub, email, role and country', async () => {
    // Act
    const token = await service.issueAccessToken(buildUser());
    const claims = await service.verifyAccessToken(token);

    // Assert
    expect(claims).toMatchObject({
      sub: 'u1',
      email: 'admin@futurekawa.local',
      role: 'OPERATOR',
      country: 'EC',
    });
  });

  it('should reject a refresh token presented as an access token', async () => {
    // Arrange
    const refresh = await service.issueRefreshToken(buildUser());

    // Act / Assert
    await expect(service.verifyAccessToken(refresh)).rejects.toThrow();
  });

  it('should reject an access token presented as a refresh token', async () => {
    // Arrange
    const access = await service.issueAccessToken(buildUser());

    // Act / Assert
    await expect(service.verifyRefreshToken(access)).rejects.toThrow();
  });

  it('should reject a token signed with another secret', async () => {
    // Arrange
    const foreign = new JwtService({
      secret: 'another-secret-at-least-32-characters!!',
    });
    const token = await foreign.signAsync({ type: 'access', sub: 'u1' });

    // Act / Assert
    await expect(service.verifyAccessToken(token)).rejects.toThrow();
  });

  it('should only expose the subject on a refresh token', async () => {
    // Act
    const token = await service.issueRefreshToken(buildUser());
    const claims = await service.verifyRefreshToken(token);

    // Assert
    expect(claims).toEqual({ sub: 'u1' });
  });
});
