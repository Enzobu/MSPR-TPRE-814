import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedUser, Role } from '@futurekawa/contracts';
import { RolesGuard } from './roles.guard';

const contextWith = (user?: AuthenticatedUser): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => () => undefined,
    getClass: () => class {},
  }) as unknown as ExecutionContext;

const buildUser = (role: Role): AuthenticatedUser => ({
  id: 'u1',
  email: 'admin@futurekawa.local',
  role,
  country: null,
});

describe('RolesGuard', () => {
  let reflector: jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('should allow a route that declares no roles', () => {
    // Arrange
    reflector.getAllAndOverride.mockReturnValue(undefined);

    // Act / Assert
    expect(guard.canActivate(contextWith(buildUser('VIEWER')))).toBe(true);
  });

  it('should reject when no user is attached', () => {
    // Arrange
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);

    // Act / Assert
    expect(() => guard.canActivate(contextWith(undefined))).toThrow(
      UnauthorizedException,
    );
  });

  it('should forbid a user whose role is not allowed', () => {
    // Arrange
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);

    // Act / Assert
    expect(() => guard.canActivate(contextWith(buildUser('VIEWER')))).toThrow(
      ForbiddenException,
    );
  });

  it('should allow a user whose role is in the allowed set', () => {
    // Arrange
    reflector.getAllAndOverride.mockReturnValue(['MANAGER', 'ADMIN']);

    // Act / Assert
    expect(guard.canActivate(contextWith(buildUser('ADMIN')))).toBe(true);
  });
});
