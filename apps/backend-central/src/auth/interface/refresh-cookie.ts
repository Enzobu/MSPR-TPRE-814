import type { CookieOptions } from 'express';

// Le refresh token vit dans ce cookie httpOnly (ADR-0006). Path scopé aux
// routes auth : le navigateur ne l'envoie qu'à /api/v1/auth/* (refresh, logout).
export const REFRESH_COOKIE_NAME = 'fk_refresh';
export const REFRESH_COOKIE_PATH = '/api/v1/auth';

const TTL_UNIT_MS: Record<string, number> = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

// Convertit une TTL type '7d' / '15m' / '3600s' (ou un nombre de secondes) en
// millisecondes pour le maxAge du cookie. Renvoie undefined si non parsable
// (cookie de session, dégradation gracieuse).
export function ttlToMs(ttl: string): number | undefined {
  const match = /^(\d+)([smhd])?$/.exec(ttl.trim());
  if (!match) {
    return undefined;
  }
  const value = Number(match[1]);
  const unit = match[2] ?? 's';
  return value * TTL_UNIT_MS[unit];
}

// httpOnly + Secure (prod) + SameSite=Strict : non lisible par JS (anti-XSS),
// non envoyé cross-site (anti-CSRF). Secure désactivé hors prod pour http local.
export function buildRefreshCookieOptions(params: {
  isProduction: boolean;
  refreshTtl: string;
}): CookieOptions {
  return {
    httpOnly: true,
    secure: params.isProduction,
    sameSite: 'strict',
    path: REFRESH_COOKIE_PATH,
    maxAge: ttlToMs(params.refreshTtl),
  };
}
