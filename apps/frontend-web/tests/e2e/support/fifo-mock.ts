import type { Page, Route } from '@playwright/test';
import type {
  Alert,
  ConsolidatedResponse,
  Lot,
  Measurement,
} from '@futurekawa/contracts';

// Stratégie e2e front : on mocke le backend-central au niveau réseau (page.route)
// plutôt que de monter la stack + une DB seedée. Le parcours FIFO (#38) devient
// déterministe ; l'intégration HTTP réelle est couverte par les e2e backend.

// Lots déterministes triés par storedAt ASCENDANT (FIFO : le plus ancien d'abord).
// Le backend trie côté serveur → le mock renvoie déjà l'ordre attendu.
export const FIFO_LOTS: Lot[] = [
  {
    id: 'L-2023-001',
    country: 'BR',
    farm: 'Fazenda Aurora',
    warehouse: 'SP-01',
    storedAt: '2023-03-12T08:00:00.000Z',
    status: 'CONFORME',
  },
  {
    id: 'L-2023-045',
    country: 'BR',
    farm: 'Fazenda Aurora',
    warehouse: 'SP-01',
    storedAt: '2023-09-28T08:00:00.000Z',
    status: 'EN_ALERTE',
  },
  {
    id: 'L-2024-008',
    country: 'BR',
    farm: 'Fazenda Aurora',
    warehouse: 'SP-01',
    storedAt: '2024-05-04T08:00:00.000Z',
    status: 'CONFORME',
  },
];

// Ordre FIFO attendu dans l'UI (du plus ancien au plus récent).
export const FIFO_LOT_IDS = FIFO_LOTS.map((lot) => lot.id);

const MEASUREMENTS: Measurement[] = [
  {
    id: 'm-1',
    country: 'BR',
    warehouse: 'SP-01',
    temperatureCelsius: 28.5,
    humidityPercent: 54,
    recordedAt: '2024-05-04T09:00:00.000Z',
  },
  {
    id: 'm-2',
    country: 'BR',
    warehouse: 'SP-01',
    temperatureCelsius: 30.1,
    humidityPercent: 56,
    recordedAt: '2024-05-04T10:00:00.000Z',
  },
  {
    id: 'm-3',
    country: 'BR',
    warehouse: 'SP-01',
    temperatureCelsius: 29.2,
    humidityPercent: 55,
    recordedAt: '2024-05-04T11:00:00.000Z',
  },
];

async function fulfillJson(route: Route, body: unknown): Promise<void> {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

export async function setupFifoMock(page: Page): Promise<void> {
  const stocks: ConsolidatedResponse<Lot> = {
    data: FIFO_LOTS,
    total: FIFO_LOTS.length,
    page: 1,
    pageSize: 20,
    unavailable: [],
  };
  const measurements: ConsolidatedResponse<Measurement> = {
    data: MEASUREMENTS,
    total: MEASUREMENTS.length,
    page: 1,
    pageSize: 100,
    unavailable: [],
  };
  // Le badge d'alertes du header interroge /alerts sur chaque page : on le mocke
  // vide pour éviter une requête réseau pendante (pas de backend en e2e front).
  const noAlerts: ConsolidatedResponse<Alert> = {
    data: [],
    total: 0,
    page: 1,
    pageSize: 1,
    unavailable: [],
  };

  await page.route('**/api/v1/stocks*', (route) => fulfillJson(route, stocks));
  await page.route('**/api/v1/measurements*', (route) =>
    fulfillJson(route, measurements),
  );
  await page.route('**/api/v1/alerts*', (route) => fulfillJson(route, noAlerts));
}
