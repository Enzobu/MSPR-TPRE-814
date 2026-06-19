import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import type { ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser } from '@futurekawa/contracts';
import { CurrentUser } from './current-user.decorator';

// Extrait la factory du param decorator via les métadonnées Nest : c'est le seul
// moyen d'invoquer la closure passée à createParamDecorator hors d'un vrai router.
function extractFactory(): (
  data: unknown,
  ctx: ExecutionContext,
) => AuthenticatedUser {
  class Probe {
    handler(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
      return user;
    }
  }
  const metadata = Reflect.getMetadata(
    ROUTE_ARGS_METADATA,
    Probe,
    'handler',
  ) as Record<
    string,
    { factory: (data: unknown, ctx: ExecutionContext) => AuthenticatedUser }
  >;
  const key = Object.keys(metadata)[0];
  return metadata[key].factory;
}

function contextWith(user: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('CurrentUser', () => {
  it('should extract the authenticated user attached to the request', () => {
    // Arrange
    const user: AuthenticatedUser = {
      id: 'u-1',
      email: 'admin@futurekawa.io',
      role: 'ADMIN',
      country: null,
    };
    const factory = extractFactory();

    // Act
    const result = factory(undefined, contextWith(user));

    // Assert
    expect(result).toBe(user);
  });
});
