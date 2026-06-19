import { Inject, Injectable } from '@nestjs/common';
import type {
  Alert,
  AlertType,
  ConsolidatedResponse,
  CountryCode,
  PaginatedResponse,
} from '@futurekawa/contracts';
import { COUNTRY_BACKEND_GATEWAY } from '../../country-backends/domain/country-backend.gateway';
import type { CountryBackendGateway } from '../../country-backends/domain/country-backend.gateway';

export interface ListAlertsParams {
  countries: CountryCode[];
  type?: AlertType;
  acknowledged?: boolean;
  page: number;
  pageSize: number;
  correlationId: string;
}

// Chaque pays est interrogé avec un large pageSize : les alertes sont peu
// nombreuses (1/jour/entrepôt max après dédup), un seul fetch suffit en pratique.
const COUNTRY_FETCH_SIZE = 100;

// Agrégation consolidée des alertes multi-pays (#36, ADR-0007). Fan-out
// `Promise.allSettled`, relais des filtres `type`/`acknowledged`, fusion + tri
// `triggeredAt` desc, pagination de l'ensemble fusionné. Un pays en échec tombe
// dans `unavailable` (jamais 500). Pas de cache (alertes dynamiques + ACK).
@Injectable()
export class ListAlertsUseCase {
  constructor(
    @Inject(COUNTRY_BACKEND_GATEWAY)
    private readonly gateway: CountryBackendGateway,
  ) {}

  async execute(
    params: ListAlertsParams,
  ): Promise<ConsolidatedResponse<Alert>> {
    const { alerts, unavailable } = await this.collect(params);
    this.sortRecentFirst(alerts);

    const start = (params.page - 1) * params.pageSize;
    return {
      data: alerts.slice(start, start + params.pageSize),
      total: alerts.length,
      page: params.page,
      pageSize: params.pageSize,
      unavailable,
    };
  }

  private async collect(
    params: ListAlertsParams,
  ): Promise<{ alerts: Alert[]; unavailable: CountryCode[] }> {
    const path = this.buildPath(params);
    const settled = await Promise.allSettled(
      params.countries.map((country) =>
        this.gateway.get<PaginatedResponse<Alert>>(country, path, {
          correlationId: params.correlationId,
        }),
      ),
    );

    const alerts: Alert[] = [];
    const unavailable: CountryCode[] = [];
    settled.forEach((outcome, index) => {
      if (outcome.status === 'fulfilled') {
        alerts.push(...outcome.value.data);
      } else {
        unavailable.push(params.countries[index]);
      }
    });
    return { alerts, unavailable };
  }

  // Récentes d'abord : triggeredAt ISO 8601 → ordre lexicographique ==
  // chronologique. `id` en clé secondaire pour un ordre stable et déterministe.
  private sortRecentFirst(alerts: Alert[]): void {
    alerts.sort((a, b) => {
      const byDate = b.triggeredAt.localeCompare(a.triggeredAt);
      return byDate !== 0 ? byDate : b.id.localeCompare(a.id);
    });
  }

  private buildPath(params: ListAlertsParams): string {
    const query = new URLSearchParams({
      page: '1',
      pageSize: String(COUNTRY_FETCH_SIZE),
    });
    if (params.type) {
      query.set('type', params.type);
    }
    if (params.acknowledged !== undefined) {
      query.set('acknowledged', String(params.acknowledged));
    }
    return `/api/v1/alerts?${query.toString()}`;
  }
}
