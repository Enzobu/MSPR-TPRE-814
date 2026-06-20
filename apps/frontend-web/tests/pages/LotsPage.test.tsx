import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConsolidatedResponse, Lot } from '@futurekawa/contracts';
import LotsPage from '@/pages/LotsPage';
import { fetchStocks } from '@/features/lots/api/lots.api';

vi.mock('@/features/lots/api/lots.api');

const RESPONSE: ConsolidatedResponse<Lot> = {
  data: [
    {
      id: 'LOT-BR-001',
      country: 'BR',
      farm: 'Fazenda Sol',
      warehouse: 'Santos-A',
      storedAt: '2026-01-10T08:00:00.000Z',
      status: 'CONFORME',
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
      <MemoryRouter initialEntries={['/lots']}>
        <LotsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('LotsPage', () => {
  beforeEach(() => {
    vi.mocked(fetchStocks).mockResolvedValue(RESPONSE);
  });

  it('should render the lots returned by the api', async () => {
    // Arrange / Act
    renderPage();

    // Assert
    // La table (md+) et la liste de cartes (mobile) sont toutes deux dans le DOM
    // jsdom (pas de media queries appliquées), d'où getAllByText.
    const cells = await screen.findAllByText('Fazenda Sol');
    expect(cells.length).toBeGreaterThan(0);
  });

  it('should render the country filter', async () => {
    // Arrange / Act
    renderPage();
    await screen.findAllByText('Fazenda Sol');

    // Assert
    expect(screen.getByRole('group', { name: /pays/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tous' })).toBeInTheDocument();
  });

  it('should warn about unavailable countries', async () => {
    // Arrange / Act
    renderPage();
    await screen.findAllByText('Fazenda Sol');

    // Assert
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('EC');
  });
});
