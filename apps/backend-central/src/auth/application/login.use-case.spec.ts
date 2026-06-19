import { InvalidCredentialsError } from '../domain/auth.errors';
import type { PasswordHasher } from '../domain/password-hasher';
import type { TokenService } from '../domain/token.service';
import type { UserAccount } from '../domain/user-account';
import type { UserRepository } from '../domain/user.repository';
import { LoginUseCase } from './login.use-case';

const buildUser = (over: Partial<UserAccount> = {}): UserAccount => ({
  id: 'u1',
  email: 'admin@futurekawa.local',
  passwordHash: 'stored-hash',
  role: 'ADMIN',
  country: null,
  ...over,
});

describe('LoginUseCase', () => {
  let users: jest.Mocked<UserRepository>;
  let hasher: jest.Mocked<PasswordHasher>;
  let tokens: jest.Mocked<TokenService>;
  let useCase: LoginUseCase;

  beforeEach(() => {
    users = { findByEmail: jest.fn(), findById: jest.fn() };
    hasher = { hash: jest.fn(), compare: jest.fn() };
    tokens = {
      issueAccessToken: jest.fn().mockResolvedValue('access-token'),
      issueRefreshToken: jest.fn().mockResolvedValue('refresh-token'),
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    };
    useCase = new LoginUseCase(users, hasher, tokens);
  });

  it('should reject login when the user does not exist', async () => {
    // Arrange
    users.findByEmail.mockResolvedValue(null);

    // Act / Assert
    await expect(useCase.execute('ghost@x.io', 'whatever')).rejects.toThrow(
      InvalidCredentialsError,
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest mock, pas un appel
    expect(hasher.compare).not.toHaveBeenCalled();
  });

  it('should reject login when the password does not match', async () => {
    // Arrange
    users.findByEmail.mockResolvedValue(buildUser());
    hasher.compare.mockResolvedValue(false);

    // Act / Assert
    await expect(
      useCase.execute('admin@futurekawa.local', 'bad'),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('should issue an access and refresh token on valid credentials', async () => {
    // Arrange
    users.findByEmail.mockResolvedValue(buildUser());
    hasher.compare.mockResolvedValue(true);

    // Act
    const result = await useCase.execute(
      'admin@futurekawa.local',
      'good-password',
    );

    // Assert
    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 'u1',
        email: 'admin@futurekawa.local',
        role: 'ADMIN',
        country: null,
      },
    });
  });

  it('should never expose the password hash in the issued user', async () => {
    // Arrange
    users.findByEmail.mockResolvedValue(buildUser());
    hasher.compare.mockResolvedValue(true);

    // Act
    const result = await useCase.execute(
      'admin@futurekawa.local',
      'good-password',
    );

    // Assert
    expect(result.user).not.toHaveProperty('passwordHash');
  });
});
