import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Alert, ConsolidatedResponse } from '@futurekawa/contracts';
import AlertsPage from '@/pages/AlertsPage';
import { fetchAlerts } from '@/features/alerts/api/alerts.api';

vi.mock('@/features/alerts/api/alerts.api');

const RESPONSE: ConsolidatedResponse<Alert> = {
  data: [
    {
      id: 'AL-BR-001',
      country: 'BR',
      type: 'TEMPERATURE_OUT_OF_RANGE',
      message: 'Température trop élevée à Santos-A',
      lotId: 'LOT-BR-001',
      warehouse: 'Santos-A',
      triggeredAt: '2026-06-18T10:30:00.000Z',
      acknowledged: true,
    },
  ],
  total: 1,
  page: 1,
  pageSize: 20,
  unavailable: ['EC'],
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/alerts']}>
        <AlertsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AlertsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchAlerts).mockResolvedValue(RESPONSE);
  });

  it('should render the alerts returned by the api', async () => {
    // Arrange / Act
    renderPage();

    // Assert
    const messages = await screen.findAllByText(
      'Température trop élevée à Santos-A',
    );
    expect(messages.length).toBeGreaterThan(0);
  });

  it('should render the type filter', async () => {
    // Arrange / Act
    renderPage();
    await screen.findAllByText('Température trop élevée à Santos-A');

    // Assert
    expect(screen.getByRole('group', { name: /type/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Température' }),
    ).toBeInTheDocument();
  });

  it('should request only unacknowledged alerts when filtered', async () => {
    // Arrange
    renderPage();
    await screen.findAllByText('Température trop élevée à Santos-A');

    // Act
    await userEvent.click(
      screen.getByRole('button', { name: 'Non acquittées' }),
    );

    // Assert
    expect(fetchAlerts).toHaveBeenCalledWith(
      expect.objectContaining({ acknowledged: false }),
    );
  });

  it('should warn about unavailable countries', async () => {
    // Arrange / Act
    renderPage();
    await screen.findAllByText('Température trop élevée à Santos-A');

    // Assert
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('EC');
  });

  it('should mark acknowledged alerts in the table', async () => {
    // Arrange / Act
    renderPage();
    await screen.findAllByText('Température trop élevée à Santos-A');

    // Assert
    expect(screen.getAllByText('Acquittée').length).toBeGreaterThan(0);
  });
});
