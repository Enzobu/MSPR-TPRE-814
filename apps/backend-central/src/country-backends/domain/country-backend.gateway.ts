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
