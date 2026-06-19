import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import type { Env } from '../../config/env.validation';
import { LoginUseCase } from '../application/login.use-case';
import { RefreshTokenUseCase } from '../application/refresh-token.use-case';
import type { IssuedAuth } from '../application/issued-auth';
import {
  InvalidCredentialsError,
  InvalidRefreshTokenError,
} from '../domain/auth.errors';
import { AuthController } from './auth.controller';
import type { AuthenticatedUserDto } from './dto/auth-response.dto';
import type { LoginDto } from './dto/login.dto';
import { REFRESH_COOKIE_NAME } from './refresh-cookie';

const buildIssued = (over: Partial<IssuedAuth> = {}): IssuedAuth => ({
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  user: {
    id: 'u1',
    email: 'admin@futurekawa.local',
    role: 'ADMIN',
    country: null,
  },
  ...over,
});

const buildResponse = (): jest.Mocked<
  Pick<Response, 'cookie' | 'clearCookie'>
> => ({
  cookie: jest.fn(),
  clearCookie: jest.fn(),
});

const buildConfig = (
  values: Partial<Record<keyof Env, unknown>> = {},
): ConfigService<Env, true> => {
  const defaults: Record<string, unknown> = {
    NODE_ENV: 'test',
    JWT_REFRESH_TTL: '7d',
    ...values,
  };
  return {
    get: jest.fn((key: string) => defaults[key]),
  } as unknown as ConfigService<Env, true>;
};

describe('AuthController', () => {
  let loginUseCase: jest.Mocked<Pick<LoginUseCase, 'execute'>>;
  let refreshUseCase: jest.Mocked<Pick<RefreshTokenUseCase, 'execute'>>;

  beforeEach(() => {
    loginUseCase = { execute: jest.fn() };
    refreshUseCase = { execute: jest.fn() };
  });

  const buildController = (
    config: ConfigService<Env, true> = buildConfig(),
  ): AuthController =>
    new AuthController(
      loginUseCase as unknown as LoginUseCase,
      refreshUseCase as unknown as RefreshTokenUseCase,
      config,
    );

  describe('login', () => {
    it('should set the refresh cookie and return access token and user', async () => {
      // Arrange
      const issued = buildIssued();
      loginUseCase.execute.mockResolvedValue(issued);
      const controller = buildController(
        buildConfig({ NODE_ENV: 'production', JWT_REFRESH_TTL: '7d' }),
      );
      const res = buildResponse();
      const dto: LoginDto = {
        email: 'admin@futurekawa.local',
        password: 'good-password',
      };

      // Act
      const result = await controller.login(dto, res as unknown as Response);

      // Assert
      expect(loginUseCase.execute).toHaveBeenCalledWith(
        'admin@futurekawa.local',
        'good-password',
      );
      expect(res.cookie).toHaveBeenCalledWith(
        REFRESH_COOKIE_NAME,
        'refresh-token',
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
        }),
      );
      expect(result).toEqual({
        accessToken: 'access-token',
        user: issued.user,
      });
    });

    it('should translate InvalidCredentialsError into a 401', async () => {
      // Arrange
      loginUseCase.execute.mockRejectedValue(new InvalidCredentialsError());
      const controller = buildController();
      const res = buildResponse();
      const dto: LoginDto = {
        email: 'admin@futurekawa.local',
        password: 'bad',
      };

      // Act / Assert
      await expect(
        controller.login(dto, res as unknown as Response),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(res.cookie).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should throw 401 with "Missing refresh token" when no cookie is present', async () => {
      // Arrange
      const controller = buildController();
      const req = { cookies: undefined } as unknown as Request;
      const res = buildResponse();

      // Act / Assert
      await expect(
        controller.refresh(req, res as unknown as Response),
      ).rejects.toThrow('Missing refresh token');
      expect(refreshUseCase.execute).not.toHaveBeenCalled();
    });

    it('should rotate the refresh token read from the cookie and respond', async () => {
      // Arrange
      const issued = buildIssued({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });
      refreshUseCase.execute.mockResolvedValue(issued);
      const controller = buildController();
      const req = {
        cookies: { [REFRESH_COOKIE_NAME]: 'old-refresh' },
      } as unknown as Request;
      const res = buildResponse();

      // Act
      const result = await controller.refresh(req, res as unknown as Response);

      // Assert
      expect(refreshUseCase.execute).toHaveBeenCalledWith('old-refresh');
      expect(res.cookie).toHaveBeenCalledWith(
        REFRESH_COOKIE_NAME,
        'new-refresh',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(result).toEqual({ accessToken: 'new-access', user: issued.user });
    });

    it('should translate InvalidRefreshTokenError into a 401', async () => {
      // Arrange
      refreshUseCase.execute.mockRejectedValue(new InvalidRefreshTokenError());
      const controller = buildController();
      const req = {
        cookies: { [REFRESH_COOKIE_NAME]: 'old-refresh' },
      } as unknown as Request;
      const res = buildResponse();

      // Act / Assert
      await expect(
        controller.refresh(req, res as unknown as Response),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should rethrow unknown errors as-is without masking them as 401', async () => {
      // Arrange
      const unknownError = new Error('database is down');
      refreshUseCase.execute.mockRejectedValue(unknownError);
      const controller = buildController();
      const req = {
        cookies: { [REFRESH_COOKIE_NAME]: 'old-refresh' },
      } as unknown as Request;
      const res = buildResponse();

      // Act / Assert
      await expect(
        controller.refresh(req, res as unknown as Response),
      ).rejects.toBe(unknownError);
    });
  });

  describe('logout', () => {
    it('should clear the refresh cookie', () => {
      // Arrange
      const controller = buildController();
      const res = buildResponse();

      // Act
      controller.logout(res as unknown as Response);

      // Assert
      expect(res.clearCookie).toHaveBeenCalledWith(
        REFRESH_COOKIE_NAME,
        expect.objectContaining({ httpOnly: true, sameSite: 'strict' }),
      );
    });
  });

  describe('me', () => {
    it('should return the current user as provided by the guard', () => {
      // Arrange
      const controller = buildController();
      const user: AuthenticatedUserDto = {
        id: 'u1',
        email: 'admin@futurekawa.local',
        role: 'ADMIN',
        country: null,
      };

      // Act
      const result = controller.me(user);

      // Assert
      expect(result).toBe(user);
    });
  });
});
