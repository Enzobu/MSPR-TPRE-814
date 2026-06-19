import { randomInt } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { isAxiosError } from 'axios';
import type { CountryCode } from '@futurekawa/contracts';
import { CORRELATION_ID_HEADER } from '@futurekawa/nest-common';
import type { Env } from '../../config/env.validation';
import {
  CountryBackendGateway,
  CountryRequestError,
  CountryRequestOptions,
  CountryUnavailableError,
} from '../domain/country-backend.gateway';
import { CircuitBreaker } from './circuit-breaker';

// Adapter HTTP unique paramétré par pays (ADR-0007) : timeout, retry+backoff sur
// erreurs transitoires, circuit breaker par pays, propagation du correlation-id.
@Injectable()
export class HttpCountryBackendGateway implements CountryBackendGateway {
  private readonly logger = new Logger(HttpCountryBackendGateway.name);
  private readonly breakers = new Map<CountryCode, CircuitBreaker>();

  private readonly timeoutMs: number;
  private readonly retries: number;
  private readonly retryBaseMs: number;
  private readonly breakerThreshold: number;
  private readonly breakerCooldownMs: number;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService<Env, true>,
  ) {
    this.timeoutMs = config.get('PAYS_REQUEST_TIMEOUT_MS', { infer: true });
    this.retries = config.get('PAYS_REQUEST_RETRIES', { infer: true });
    this.retryBaseMs = config.get('PAYS_RETRY_BASE_MS', { infer: true });
    this.breakerThreshold = config.get('PAYS_BREAKER_FAILURE_THRESHOLD', {
      infer: true,
    });
    this.breakerCooldownMs = config.get('PAYS_BREAKER_COOLDOWN_MS', {
      infer: true,
    });
  }

  async get<T>(
    country: CountryCode,
    path: string,
    options: CountryRequestOptions,
  ): Promise<T> {
    return this.send<T>(country, path, options, (correlationId) =>
      this.requestWithRetry<T>('get', country, path, correlationId),
    );
  }

  async patch<T>(
    country: CountryCode,
    path: string,
    body: unknown,
    options: CountryRequestOptions,
  ): Promise<T> {
    return this.send<T>(country, path, options, (correlationId) =>
      this.requestWithRetry<T>('patch', country, path, correlationId, body),
    );
  }

  // Garde du breaker + retry/backoff + comptage succès/échec, partagés par get
  // et patch. Un 4xx (CountryRequestError) remonte tel quel sans compter d'échec
  // breaker ni se transformer en indisponibilité (404 pays → 404 central).
  private async send<T>(
    country: CountryCode,
    path: string,
    options: CountryRequestOptions,
    run: (correlationId: string) => Promise<T>,
  ): Promise<T> {
    const breaker = this.breakerFor(country);
    if (!breaker.canRequest()) {
      throw new CountryUnavailableError(country, 'circuit breaker open');
    }

    try {
      const data = await run(options.correlationId);
      breaker.recordSuccess();
      return data;
    } catch (error) {
      if (error instanceof CountryRequestError) {
        throw error;
      }
      breaker.recordFailure();
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Country ${country} request to ${path} failed: ${reason}`,
      );
      throw new CountryUnavailableError(country, reason);
    }
  }

  private breakerFor(country: CountryCode): CircuitBreaker {
    let breaker = this.breakers.get(country);
    if (!breaker) {
      breaker = new CircuitBreaker(
        this.breakerThreshold,
        this.breakerCooldownMs,
      );
      this.breakers.set(country, breaker);
    }
    return breaker;
  }

  private async requestWithRetry<T>(
    method: 'get' | 'patch',
    country: CountryCode,
    path: string,
    correlationId: string,
    body?: unknown,
  ): Promise<T> {
    const attempts = this.retries + 1;
    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        return await this.dispatch<T>(
          method,
          country,
          path,
          correlationId,
          body,
        );
      } catch (error) {
        lastError = error;
        // Un 4xx est définitif (jamais de retry). Pour une écriture (patch) on le
        // remonte typé (status préservé) → un 404 pays devient un 404 central.
        // Pour un get on conserve le comportement historique (→ CountryUnavailableError).
        const clientStatus = this.clientErrorStatus(error);
        if (clientStatus !== undefined && method === 'patch') {
          throw new CountryRequestError(
            country,
            clientStatus,
            error instanceof Error ? error.message : String(error),
          );
        }
        if (!this.isTransient(error) || attempt === attempts) {
          break;
        }
        await this.delay(this.backoffMs(attempt));
      }
    }

    throw lastError;
  }

  private async dispatch<T>(
    method: 'get' | 'patch',
    country: CountryCode,
    path: string,
    correlationId: string,
    body?: unknown,
  ): Promise<T> {
    const config = {
      baseURL: this.baseUrl(country),
      timeout: this.timeoutMs,
      headers: { [CORRELATION_ID_HEADER]: correlationId },
    };
    const response =
      method === 'get'
        ? await this.http.axiosRef.get<T>(path, config)
        : await this.http.axiosRef.patch<T>(path, body, config);
    return response.data;
  }

  // Retry uniquement sur erreurs transitoires : timeout, réseau, 5xx. Jamais sur 4xx.
  private isTransient(error: unknown): boolean {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      return status === undefined || status >= 500;
    }
    return true;
  }

  // Status d'une erreur cliente (4xx) si c'en est une, sinon undefined.
  private clientErrorStatus(error: unknown): number | undefined {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      if (status !== undefined && status >= 400 && status < 500) {
        return status;
      }
    }
    return undefined;
  }

  private backoffMs(attempt: number): number {
    const exponential = this.retryBaseMs * 2 ** (attempt - 1);
    // PRNG cryptographique (crypto.randomInt) plutôt que Math.random pour le jitter :
    // pas de propriété de sécurité requise ici, mais ça lève le hotspot Sonar.
    const jitter = randomInt(this.retryBaseMs + 1);
    return Math.round(exponential + jitter);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private baseUrl(country: CountryCode): string {
    switch (country) {
      case 'BR':
        return this.config.get('BACKEND_PAYS_BR_URL', { infer: true });
      case 'EC':
        return this.config.get('BACKEND_PAYS_EC_URL', { infer: true });
      case 'CO':
        return this.config.get('BACKEND_PAYS_CO_URL', { infer: true });
    }
  }
}
