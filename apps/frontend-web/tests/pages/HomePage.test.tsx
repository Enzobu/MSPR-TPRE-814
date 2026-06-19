import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  Alert,
  ConsolidatedResponse,
  Lot,
} from '@futurekawa/contracts';
import HomePage from '@/pages/HomePage';
import { fetchStocks } from '@/features/lots/api/lots.api';
import { fetchAlerts } from '@/features/alerts/api/alerts.api';

vi.mock('@/features/lots/api/lots.api');
vi.mock('@/features/alerts/api/alerts.api');

const STOCKS_RESPONSE: ConsolidatedResponse<Lot> = {
  data: [],
  total: 42,
  page: 1,
  pageSize: 1,
  unavailable: ['EC'],
};

const RECENT_ALERT: Alert = {
  id: 'AL-BR-001',
  country: 'BR',
  type: 'LOT_EXPIRED',
  message: 'Lot LOT-BR-001 périmé',
  lotId: 'LOT-BR-001',
  warehouse: 'Santos-A',
  triggeredAt: '2026-06-18T10:30:00.000Z',
  acknowledged: false,
};

function recentResponse(): ConsolidatedResponse<Alert> {
  return {
    data: [RECENT_ALERT],
    total: 1,
    page: 1,
    pageSize: 3,
    unavailable: [],
  };
}

function unackResponse(total: number): ConsolidatedResponse<Alert> {
  return { data: [], total, page: 1, pageSize: 1, unavailable: [] };
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/']}>
        <HomePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchStocks).mockResolvedValue(STOCKS_RESPONSE);
    // useUnacknowledgedCount -> pageSize 1 ; useRecentAlerts -> pageSize 3.
    vi.mocked(fetchAlerts).mockImplementation((params) =>
      Promise.resolve(
        params.pageSize === 1 ? unackResponse(5) : recentResponse(),
      ),
    );
  });

  it('should render the dashboard hero and KPI labels', () => {
    // Arrange / Act
    renderPage();

    // Assert
    expect(
      screen.getByRole('heading', { name: 'FutureKawa', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText('Lots en stock')).toBeInTheDocument();
    expect(screen.getByText('Alertes non acquittées')).toBeInTheDocument();
    expect(screen.getByText('Pays indisponibles')).toBeInTheDocument();
  });

  it('should render real KPI values from the consolidated APIs', async () => {
    // Arrange / Act
    renderPage();

    // Assert
    expect(await screen.findByText('42')).toBeInTheDocument();
    expect(await screen.findByText('EC')).toBeInTheDocument();
    // `5` apparaît dans le KPI alertes ET dans le badge d'accès rapide.
    expect((await screen.findAllByText('5')).length).toBeGreaterThan(0);
  });

  it('should render quick-access links to lots and alerts', () => {
    // Arrange / Act
    renderPage();

    // Assert
    expect(
      screen.getByRole('link', { name: /consulter les lots/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /voir les alertes/i }),
    ).toBeInTheDocument();
  });

  it('should render the most recent alert', async () => {
    // Arrange / Act
    renderPage();

    // Assert
    expect(
      await screen.findByText('Lot LOT-BR-001 périmé'),
    ).toBeInTheDocument();
  });

  it('should not render the removed demo toast button', () => {
    // Arrange / Act
    renderPage();

    // Assert
    expect(
      screen.queryByRole('button', { name: /afficher un toast/i }),
    ).not.toBeInTheDocument();
  });
});
