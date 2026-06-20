import type { Page, Route } from '@playwright/test';
import type {
  Alert,
  ConsolidatedResponse,
  Lot,
} from '@futurekawa/contracts';

// Stratégie e2e front : on mocke le backend-central au niveau réseau (page.route)
// plutôt que de monter la stack. Le dashboard d'accueil (#37) interroge /stocks
// (KPI + banner) et /alerts (compteur + récentes) ; sans ce mock, en CI
// (VITE_API_URL absent → baseURL relatif) ces appels reçoivent l'index.html du
// serveur Vite, ce qui casse le rendu. On renvoie donc des réponses valides.

const STOCKS: ConsolidatedResponse<Lot> = {
  data: [],
  total: 0,
  page: 1,
  pageSize: 1,
  unavailable: [],
};

const ALERTS: ConsolidatedResponse<Alert> = {
  data: [],
  total: 0,
  page: 1,
  pageSize: 3,
  unavailable: [],
};

async function fulfillJson(route: Route, body: unknown): Promise<void> {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

export async function setupDashboardMock(page: Page): Promise<void> {
  await page.route('**/api/v1/stocks*', (route) => fulfillJson(route, STOCKS));
  await page.route('**/api/v1/alerts*', (route) => fulfillJson(route, ALERTS));
}
