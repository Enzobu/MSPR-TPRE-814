import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Alert, ConsolidatedResponse } from '@futurekawa/contracts';
import { AlertsBadge } from '@/features/alerts/components/AlertsBadge';
import { fetchAlerts } from '@/features/alerts/api/alerts.api';

vi.mock('@/features/alerts/api/alerts.api');

function buildResponse(total: number): ConsolidatedResponse<Alert> {
  return { data: [], total, page: 1, pageSize: 1, unavailable: [] };
}

function renderBadge() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AlertsBadge />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AlertsBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display the unacknowledged count', async () => {
    // Arrange
    vi.mocked(fetchAlerts).mockResolvedValue(buildResponse(3));

    // Act
    renderBadge();

    // Assert
    expect(await screen.findByText('3')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /3 non acquittées/i }),
    ).toBeInTheDocument();
  });

  it('should not render a count badge when there is no alert', async () => {
    // Arrange
    vi.mocked(fetchAlerts).mockResolvedValue(buildResponse(0));

    // Act
    renderBadge();

    // Assert
    const link = await screen.findByRole('link', { name: 'Alertes' });
    expect(link).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});
