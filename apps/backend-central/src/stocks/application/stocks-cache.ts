import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Lot, ConsolidatedResponse } from '@futurekawa/contracts';
import type { Env } from '../../config/env.validation';

interface Entry {
  value: ConsolidatedResponse<Lot>;
  expiresAt: number;
}

// Cache mémoire à TTL court pour /stocks (ADR-0007). TTL = 0 → cache désactivé.
@Injectable()
export class StocksCache {
  private readonly ttlMs: number;
  private readonly store = new Map<string, Entry>();

  constructor(config: ConfigService<Env, true>) {
    this.ttlMs = config.get('STOCKS_CACHE_TTL_MS', { infer: true });
  }

  // Encapsulé pour être contrôlable en test (spy sur Date.now).
  private now(): number {
    return Date.now();
  }

  get(key: string): ConsolidatedResponse<Lot> | undefined {
    if (this.ttlMs === 0) {
      return undefined;
    }
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }
    if (this.now() >= entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: ConsolidatedResponse<Lot>): void {
    if (this.ttlMs === 0) {
      return;
    }
    this.store.set(key, { value, expiresAt: this.now() + this.ttlMs });
  }
}
