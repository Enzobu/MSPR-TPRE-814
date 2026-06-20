import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Alert, ConsolidatedResponse } from '@futurekawa/contracts';
import { SidebarNav } from '@/components/layout/SidebarNav';
import { fetchAlerts } from '@/features/alerts/api/alerts.api';

// SidebarNav consomme useUnacknowledgedCount, qui appelle fetchAlerts : on mocke
// l'API (même pattern que RootLayout.test) plutôt que le hook, pour couvrir le
// branchement réel.
vi.mock('@/features/alerts/api/alerts.api');

function unackResponse(total: number): ConsolidatedResponse<Alert> {
  return { data: [], total, page: 1, pageSize: 1, unavailable: [] };
}

function renderNav(initialPath = '/') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <SidebarNav />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SidebarNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the unacknowledged alert badge when the count is positive', async () => {
    // Arrange
    vi.mocked(fetchAlerts).mockResolvedValue(unackResponse(4));

    // Act
    renderNav();

    // Assert
    expect(await screen.findByLabelText('4 non acquittées')).toBeInTheDocument();
    expect(await screen.findByText('4')).toBeInTheDocument();
  });

  it('should not render the alert badge when the count is zero', async () => {
    // Arrange
    vi.mocked(fetchAlerts).mockResolvedValue(unackResponse(0));

    // Act
    renderNav();
    // Laisse la query se résoudre avant d'asserter l'absence.
    await screen.findByRole('link', { name: 'Alertes' });

    // Assert
    expect(screen.queryByLabelText(/non acquittées/i)).not.toBeInTheDocument();
  });

  it('should mark the active route with aria-current', async () => {
    // Arrange
    vi.mocked(fetchAlerts).mockResolvedValue(unackResponse(0));

    // Act
    renderNav('/lots');

    // Assert
    expect(screen.getByRole('link', { name: 'Lots' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute(
      'aria-current',
    );
  });
});
