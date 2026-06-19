import { InvalidRefreshTokenError } from '../domain/auth.errors';
import type { TokenService } from '../domain/token.service';
import type { UserAccount } from '../domain/user-account';
import type { UserRepository } from '../domain/user.repository';
import { RefreshTokenUseCase } from './refresh-token.use-case';

const buildUser = (over: Partial<UserAccount> = {}): UserAccount => ({
  id: 'u1',
  email: 'admin@futurekawa.local',
  passwordHash: 'stored-hash',
  role: 'MANAGER',
  country: 'BR',
  ...over,
});

describe('RefreshTokenUseCase', () => {
  let users: jest.Mocked<UserRepository>;
  let tokens: jest.Mocked<TokenService>;
  let useCase: RefreshTokenUseCase;

  beforeEach(() => {
    users = { findByEmail: jest.fn(), findById: jest.fn() };
    tokens = {
      issueAccessToken: jest.fn().mockResolvedValue('new-access'),
      issueRefreshToken: jest.fn().mockResolvedValue('new-refresh'),
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    };
    useCase = new RefreshTokenUseCase(users, tokens);
  });

  it('should reject an unverifiable refresh token', async () => {
    // Arrange
    tokens.verifyRefreshToken.mockRejectedValue(new Error('bad signature'));

    // Act / Assert
    await expect(useCase.execute('tampered')).rejects.toThrow(
      InvalidRefreshTokenError,
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest mock, pas un appel
    expect(users.findById).not.toHaveBeenCalled();
  });

  it('should reject when the user no longer exists', async () => {
    // Arrange
    tokens.verifyRefreshToken.mockResolvedValue({ sub: 'u1' });
    users.findById.mockResolvedValue(null);

    // Act / Assert
    await expect(useCase.execute('valid')).rejects.toThrow(
      InvalidRefreshTokenError,
    );
  });

  it('should rotate the tokens for a valid refresh', async () => {
    // Arrange
    tokens.verifyRefreshToken.mockResolvedValue({ sub: 'u1' });
    users.findById.mockResolvedValue(buildUser());

    // Act
    const result = await useCase.execute('valid');

    // Assert
    expect(result).toEqual({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
      user: {
        id: 'u1',
        email: 'admin@futurekawa.local',
        role: 'MANAGER',
        country: 'BR',
      },
    });
  });
});
