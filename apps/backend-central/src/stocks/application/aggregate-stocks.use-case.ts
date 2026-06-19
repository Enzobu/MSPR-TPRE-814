import { Inject, Injectable } from '@nestjs/common';
import type {
  ConsolidatedResponse,
  CountryCode,
  Lot,
  PaginatedResponse,
} from '@futurekawa/contracts';
import { COUNTRY_BACKEND_GATEWAY } from '../../country-backends/domain/country-backend.gateway';
import type { CountryBackendGateway } from '../../country-backends/domain/country-backend.gateway';
import { StocksCache } from './stocks-cache';

export interface AggregateStocksParams {
  countries: CountryCode[];
  page: number;
  pageSize: number;
  direction: 'asc' | 'desc';
  correlationId: string;
}

// Le siège récupère TOUS les lots de chaque pays (en paginant le backend pays),
// fusionne les flux déjà triés (k-way merge), puis pagine l'ensemble. Les offsets
// par pays n'étant pas alignables, la pagination ne peut se faire qu'après fusion.
const PAGE_SIZE = 100;
// Garde-fou anti-boucle si un pays renvoie un `total` incohérent (≤ 5000 lots/pays).
const MAX_PAGES_PER_COUNTRY = 50;

@Injectable()
export class AggregateStocksUseCase {
  constructor(
    @Inject(COUNTRY_BACKEND_GATEWAY)
    private readonly gateway: CountryBackendGateway,
    private readonly cache: StocksCache,
  ) {}

  async execute(
    params: AggregateStocksParams,
  ): Promise<ConsolidatedResponse<Lot>> {
    const key = this.cacheKey(params);
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    const { lots, unavailable } = await this.collect(params);
    this.sortFifo(lots, params.direction);

    const start = (params.page - 1) * params.pageSize;
    const result: ConsolidatedResponse<Lot> = {
      data: lots.slice(start, start + params.pageSize),
      total: lots.length,
      page: params.page,
      pageSize: params.pageSize,
      unavailable,
    };

    // Ne cache qu'une réponse complète : sinon un pays temporairement down
    // resterait "absent" pendant tout le TTL même après son rétablissement.
    if (unavailable.length === 0) {
      this.cache.set(key, result);
    }
    return result;
  }

  private async collect(
    params: AggregateStocksParams,
  ): Promise<{ lots: Lot[]; unavailable: CountryCode[] }> {
    const settled = await Promise.allSettled(
      params.countries.map((country) =>
        this.fetchAllLots(country, params.direction, params.correlationId),
      ),
    );

    const lots: Lot[] = [];
    const unavailable: CountryCode[] = [];
    settled.forEach((outcome, index) => {
      if (outcome.status === 'fulfilled') {
        lots.push(...outcome.value);
      } else {
        unavailable.push(params.countries[index]);
      }
    });
    return { lots, unavailable };
  }

  // Récupère tous les lots d'un pays en paginant son backend (100/page). Toute
  // erreur (même en page 2+) propage → le pays bascule en `unavailable`.
  private async fetchAllLots(
    country: CountryCode,
    direction: 'asc' | 'desc',
    correlationId: string,
  ): Promise<Lot[]> {
    const all: Lot[] = [];
    for (let page = 1; page <= MAX_PAGES_PER_COUNTRY; page += 1) {
      const path = `/api/v1/lots?page=${page}&pageSize=${PAGE_SIZE}&sort=storedAt:${direction}`;
      const res = await this.gateway.get<PaginatedResponse<Lot>>(
        country,
        path,
        {
          correlationId,
        },
      );
      all.push(...res.data);
      if (res.data.length < PAGE_SIZE || all.length >= res.total) {
        break;
      }
    }
    return all;
  }

  // Fusion (k-way merge) des flux déjà triés par chaque pays : ce n'est PAS une
  // redéfinition du FIFO (le pays décide), juste l'entrelacement multi-pays.
  // storedAt est ISO 8601 → ordre lexicographique == chronologique ; `id` en clé
  // secondaire pour un ordre stable et strictement réversible en desc.
  private sortFifo(lots: Lot[], direction: 'asc' | 'desc'): void {
    const sign = direction === 'asc' ? 1 : -1;
    lots.sort((a, b) => {
      const byDate = a.storedAt.localeCompare(b.storedAt);
      return sign * (byDate !== 0 ? byDate : a.id.localeCompare(b.id));
    });
  }

  private cacheKey(params: AggregateStocksParams): string {
    return [
      [...params.countries].sort().join(','),
      params.page,
      params.pageSize,
      params.direction,
    ].join('|');
  }
}
