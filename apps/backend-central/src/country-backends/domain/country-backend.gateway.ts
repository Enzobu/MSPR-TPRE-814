import type { CountryCode } from '@futurekawa/contracts';

export interface CountryRequestOptions {
  // Correlation-id à propager vers le backend pays (ADR-0007 + rules/08).
  correlationId: string;
}

// Port consommé par les use-cases d'agrégation. L'unique adapter HTTP
// (HttpCountryBackendGateway) est paramétré par pays — pas un adapter par pays.
export interface CountryBackendGateway {
  get<T>(
    country: CountryCode,
    path: string,
    options: CountryRequestOptions,
  ): Promise<T>;
  // Écriture relayée vers le pays propriétaire (ex. ACK d'alerte). Body optionnel
  // (PATCH d'ACK n'en a pas). Contrairement à `get`, un 4xx du pays remonte tel
  // quel (CountryRequestError) pour qu'un 404 pays → 404 central ; seuls les
  // 5xx/réseau/breaker basculent en CountryUnavailableError (ADR-0007).
  patch<T>(
    country: CountryCode,
    path: string,
    body: unknown,
    options: CountryRequestOptions,
  ): Promise<T>;
}

export const COUNTRY_BACKEND_GATEWAY = Symbol('COUNTRY_BACKEND_GATEWAY');

// Levée quand un pays est injoignable (timeout, réseau, 5xx épuisés, breaker
// ouvert). Les use-cases la traduisent en réponse partielle `unavailable` (ADR-0007),
// jamais en 500.
export class CountryUnavailableError extends Error {
  constructor(
    readonly country: CountryCode,
    readonly reason: string,
  ) {
    super(`Country backend ${country} is unavailable: ${reason}`);
    this.name = 'CountryUnavailableError';
  }
}

// Levée quand le backend pays répond une erreur cliente (4xx) non transitoire :
// la requête est invalide/introuvable côté pays, pas une indisponibilité. Porte
// le status HTTP d'origine pour que les écritures (ex. ACK) le relaient (404
// pays → 404 central). N'enclenche ni retry ni circuit breaker.
export class CountryRequestError extends Error {
  constructor(
    readonly country: CountryCode,
    readonly status: number,
    reason: string,
  ) {
    super(`Country backend ${country} responded ${status}: ${reason}`);
    this.name = 'CountryRequestError';
  }
}
