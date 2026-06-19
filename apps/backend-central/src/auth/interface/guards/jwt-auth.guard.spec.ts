import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { TokenService } from '../../domain/token.service';
import { JwtAuthGuard } from './jwt-auth.guard';

const contextWith = (
  headers: Record<string, string>,
): {
  ctx: ExecutionContext;
  request: { headers: Record<string, string>; user?: unknown };
} => {
  const request = { headers };
  const ctx = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { ctx, request };
};

describe('JwtAuthGuard', () => {
  let tokens: jest.Mocked<TokenService>;
  let guard: JwtAuthGuard;

  beforeEach(() => {
    tokens = {
      issueAccessToken: jest.fn(),
      issueRefreshToken: jest.fn(),
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    };
    guard = new JwtAuthGuard(tokens);
  });

  it('should reject a request without an Authorization header', async () => {
    // Arrange
    const { ctx } = contextWith({});

    // Act / Assert
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('should reject a non-bearer Authorization header', async () => {
    // Arrange
    const { ctx } = contextWith({ authorization: 'Basic abc' });

    // Act / Assert
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('should reject an invalid token', async () => {
    // Arrange
    tokens.verifyAccessToken.mockRejectedValue(new Error('expired'));
    const { ctx } = contextWith({ authorization: 'Bearer dead.beef' });

    // Act / Assert
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('should attach the authenticated user and allow a valid token', async () => {
    // Arrange
    tokens.verifyAccessToken.mockResolvedValue({
      sub: 'u1',
      email: 'admin@futurekawa.local',
      role: 'ADMIN',
      country: null,
    });
    const { ctx, request } = contextWith({
      authorization: 'Bearer good.token',
    });

    // Act
    const allowed = await guard.canActivate(ctx);

    // Assert
    expect(allowed).toBe(true);
    expect(request.user).toEqual({
      id: 'u1',
      email: 'admin@futurekawa.local',
      role: 'ADMIN',
      country: null,
    });
  });
});
