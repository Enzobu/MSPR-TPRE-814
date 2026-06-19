import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '@futurekawa/contracts';
import { TOKEN_SERVICE } from '../../domain/token.service';
import type { TokenService } from '../../domain/token.service';

// Garde d'authentification : exige un access token valide en `Authorization:
// Bearer`. Attache l'utilisateur (forme publique) à la requête, ou 401.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Inject(TOKEN_SERVICE) private readonly tokens: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();

    const token = this.extractBearer(request);
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      const claims = await this.tokens.verifyAccessToken(token);
      request.user = {
        id: claims.sub,
        email: claims.email,
        role: claims.role,
        country: claims.country as AuthenticatedUser['country'],
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  private extractBearer(request: Request): string | null {
    const header = request.headers.authorization;
    if (!header) {
      return null;
    }
    const [scheme, value] = header.split(' ');
    return scheme === 'Bearer' && value ? value : null;
  }
}
