import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import type { Env } from '../../config/env.validation';
import { LoginUseCase } from '../application/login.use-case';
import { RefreshTokenUseCase } from '../application/refresh-token.use-case';
import type { IssuedAuth } from '../application/issued-auth';
import {
  InvalidCredentialsError,
  InvalidRefreshTokenError,
} from '../domain/auth.errors';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuth } from './decorators/jwt-auth.decorator';
import { AuthenticatedUserDto, AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import {
  buildRefreshCookieOptions,
  REFRESH_COOKIE_NAME,
} from './refresh-cookie';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  private readonly isProduction: boolean;
  private readonly refreshTtl: string;

  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshUseCase: RefreshTokenUseCase,
    config: ConfigService<Env, true>,
  ) {
    this.isProduction = config.get('NODE_ENV') === 'production';
    this.refreshTtl = config.get('JWT_REFRESH_TTL');
  }

  @Post('login')
  @HttpCode(200)
  // Rate limit serré sur le login (anti brute-force, OWASP / ADR-0006).
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Authentifie un utilisateur',
    description:
      'Vérifie email/mot de passe, renvoie un access token (body) et pose le refresh token en cookie httpOnly.',
  })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Identifiants invalides (RFC 7807).',
  })
  @ApiTooManyRequestsResponse({ description: 'Trop de tentatives.' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const issued = await this.guard(() =>
      this.loginUseCase.execute(dto.email, dto.password),
    );
    return this.respondWithAuth(res, issued);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Rafraîchit la session',
    description:
      'Lit le refresh token dans le cookie, le fait tourner (rotation) et renvoie un nouvel access token.',
  })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Refresh token absent, invalide ou expiré (RFC 7807).',
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const cookies = req.cookies as Record<string, string> | undefined;
    const token = cookies?.[REFRESH_COOKIE_NAME];
    if (!token) {
      throw new UnauthorizedException('Missing refresh token');
    }
    const issued = await this.guard(() => this.refreshUseCase.execute(token));
    return this.respondWithAuth(res, issued);
  }

  @Post('logout')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Déconnecte',
    description: 'Efface le cookie de refresh token. Idempotent.',
  })
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie(REFRESH_COOKIE_NAME, this.cookieOptions());
  }

  @Get('me')
  @JwtAuth()
  @ApiOperation({
    summary: "Profil de l'utilisateur courant",
    description: "Renvoie l'utilisateur déduit de l'access token.",
  })
  @ApiOkResponse({ type: AuthenticatedUserDto })
  me(@CurrentUser() user: AuthenticatedUserDto): AuthenticatedUserDto {
    return user;
  }

  private respondWithAuth(res: Response, issued: IssuedAuth): AuthResponseDto {
    res.cookie(REFRESH_COOKIE_NAME, issued.refreshToken, this.cookieOptions());
    return { accessToken: issued.accessToken, user: issued.user };
  }

  private cookieOptions() {
    return buildRefreshCookieOptions({
      isProduction: this.isProduction,
      refreshTtl: this.refreshTtl,
    });
  }

  // Traduit les erreurs métier d'auth en 401 générique (pas d'oracle).
  private async guard(action: () => Promise<IssuedAuth>): Promise<IssuedAuth> {
    try {
      return await action();
    } catch (error) {
      if (
        error instanceof InvalidCredentialsError ||
        error instanceof InvalidRefreshTokenError
      ) {
        throw new UnauthorizedException(error.message);
      }
      throw error;
    }
  }
}
