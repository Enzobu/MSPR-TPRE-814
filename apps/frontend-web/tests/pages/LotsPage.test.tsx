import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
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
    // La refonte a retiré la colonne « Exploitation » : les lots sont identifiés
    // par leur référence. La table (md+) et la liste de cartes (mobile) sont
    // toutes deux dans le DOM jsdom (pas de media queries appliquées), d'où
    // getAllByText.
    const cells = await screen.findAllByText('LOT-BR-001');
    expect(cells.length).toBeGreaterThan(0);
  });

  it('should render the country filter', async () => {
    // Arrange / Act
    renderPage();
    await screen.findAllByText('LOT-BR-001');

    // Assert
    // La refonte ajoute un filtre statut qui possède aussi un chip « Tous » :
    // on scope l'assertion au groupe pays pour lever l'ambiguïté.
    const countryGroup = screen.getByRole('group', { name: /pays/i });
    expect(countryGroup).toBeInTheDocument();
    expect(
      within(countryGroup).getByRole('button', { name: 'Tous' }),
    ).toBeInTheDocument();
  });

  it('should warn about unavailable countries', async () => {
    // Arrange / Act
    renderPage();
    await screen.findAllByText('LOT-BR-001');

    // Assert
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('EC');
  });
});
