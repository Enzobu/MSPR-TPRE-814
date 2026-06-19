import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import type { Role } from '@futurekawa/contracts';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from './roles.decorator';

// Protège une route : access token requis, et — si des rôles sont passés —
// restreint aux rôles donnés (RolesGuard). Documente aussi le 401 dans Swagger.
export function JwtAuth(...roles: Role[]): MethodDecorator & ClassDecorator {
  return applyDecorators(
    Roles(...roles),
    UseGuards(JwtAuthGuard, RolesGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({
      description:
        'Non authentifié — token absent, invalide ou expiré (RFC 7807).',
    }),
  );
}
