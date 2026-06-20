import { SetMetadata } from '@nestjs/common';
import type { Role } from '@futurekawa/contracts';

export const ROLES_KEY = 'roles';

// Restreint une route à un sous-ensemble de rôles (RolesGuard, ADR-0006).
export const Roles = (...roles: Role[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
