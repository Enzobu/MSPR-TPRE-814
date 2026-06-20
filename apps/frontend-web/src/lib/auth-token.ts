// Source de vérité du JWT d'accès, EN MÉMOIRE uniquement (ADR-0006 : jamais
// localStorage/sessionStorage). Ce module hors-React permet à l'intercepteur
// axios (`http-client.ts`) de lire/écrire le token sans dépendre de React, et au
// `AuthProvider` de le synchroniser. Le refresh token reste un cookie httpOnly
// jamais lisible par JS.

let accessToken: string | null = null;
let forcedLogoutHandler: (() => void) | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

// Enregistré par le AuthProvider : déclenché quand le refresh échoue côté
// intercepteur (session morte) pour vider l'état React + rediriger.
export function registerForcedLogoutHandler(handler: (() => void) | null): void {
  forcedLogoutHandler = handler;
}

export function triggerForcedLogout(): void {
  accessToken = null;
  forcedLogoutHandler?.();
}
