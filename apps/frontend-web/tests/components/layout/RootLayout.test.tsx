import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Alert, ConsolidatedResponse } from '@futurekawa/contracts';
import { RootLayout } from '@/components/layout/RootLayout';
import { fetchAlerts } from '@/features/alerts/api/alerts.api';

vi.mock('@/features/alerts/api/alerts.api');
vi.mock('@/features/auth/hooks/use-auth', () => ({
  useAuth: () => ({ user: null, logout: vi.fn() }),
}));
vi.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() }),
}));

function unackResponse(total: number): ConsolidatedResponse<Alert> {
  return { data: [], total, page: 1, pageSize: 1, unavailable: [] };
}

function renderLayout(initialPath = '/') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route element={<RootLayout />}>
            <Route index element={<div>home</div>} />
            <Route path="lots" element={<div>lots</div>} />
            <Route path="alerts" element={<div>alerts</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('RootLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the sidebar navigation links', () => {
    // Arrange
    vi.mocked(fetchAlerts).mockResolvedValue(unackResponse(0));

    // Act
    renderLayout();

    // Assert
    expect(
      screen.getByRole('link', { name: 'Dashboard' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Lots' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Alertes' })).toBeInTheDocument();
  });

  it('should mark the active route with aria-current', () => {
    // Arrange
    vi.mocked(fetchAlerts).mockResolvedValue(unackResponse(0));

    // Act
    renderLayout('/lots');

    // Assert
    expect(screen.getByRole('link', { name: 'Lots' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen.getByRole('link', { name: 'Dashboard' }),
    ).not.toHaveAttribute('aria-current');
  });

  it('should display the unacknowledged alert counter', async () => {
    // Arrange
    vi.mocked(fetchAlerts).mockResolvedValue(unackResponse(7));

    // Act
    renderLayout();

    // Assert
    expect(
      await screen.findByLabelText('7 non acquittées'),
    ).toBeInTheDocument();
    expect(await screen.findByText('7')).toBeInTheDocument();
  });
});
