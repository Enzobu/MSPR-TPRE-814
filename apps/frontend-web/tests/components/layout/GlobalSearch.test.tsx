import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConsolidatedResponse, Lot } from '@futurekawa/contracts';
import { GlobalSearch } from '@/components/layout/GlobalSearch';
import { fetchStocks } from '@/features/lots/api/lots.api';

// GlobalSearch consomme useLots -> fetchStocks : on mocke l'API data (piège CI
// connu : mocker TOUS les endpoints utilisés). useNavigate est mocké pour
// asserter la navigation au lieu de monter un vrai routeur de cibles.
vi.mock('@/features/lots/api/lots.api');

const navigateMock = vi.fn();
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return { ...actual, useNavigate: () => navigateMock };
});

function emptyStocks(): ConsolidatedResponse<Lot> {
  return { data: [], total: 0, page: 1, pageSize: 50, unavailable: [] };
}

function renderSearch() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <GlobalSearch />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('GlobalSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchStocks).mockResolvedValue(emptyStocks());
  });

  it('should open the command dialog with the Ctrl+K shortcut', async () => {
    // Arrange
    renderSearch();

    // Act
    await userEvent.keyboard('{Control>}k{/Control}');

    // Assert
    expect(
      await screen.findByPlaceholderText(
        'Rechercher un lot, un entrepôt, une page…',
      ),
    ).toBeInTheDocument();
  });

  it('should render the navigation items inside the dialog', async () => {
    // Arrange
    renderSearch();

    // Act
    await userEvent.keyboard('{Control>}k{/Control}');

    // Assert
    expect(
      await screen.findByRole('option', { name: 'Dashboard' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Lots' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Alertes' })).toBeInTheDocument();
  });

  it('should navigate when a navigation item is selected', async () => {
    // Arrange
    const user = userEvent.setup();
    renderSearch();
    await user.keyboard('{Control>}k{/Control}');

    // Act
    await user.click(await screen.findByRole('option', { name: 'Lots' }));

    // Assert
    expect(navigateMock).toHaveBeenCalledWith('/lots');
  });
});
