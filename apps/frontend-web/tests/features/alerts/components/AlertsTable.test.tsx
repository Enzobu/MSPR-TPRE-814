import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { Alert } from '@futurekawa/contracts';
import { AlertsTable } from '@/features/alerts/components/AlertsTable';

const ALERTS: Alert[] = [
  {
    id: 'AL-BR-001',
    country: 'BR',
    type: 'TEMPERATURE_OUT_OF_RANGE',
    message: 'Température trop élevée à Santos-A',
    lotId: 'LOT-BR-001',
    warehouse: 'Santos-A',
    triggeredAt: '2026-06-18T10:30:00.000Z',
    acknowledged: false,
  },
  {
    id: 'AL-CO-002',
    country: 'CO',
    type: 'LOT_EXPIRED',
    message: 'Lot périmé à Bogota-B',
    warehouse: 'Bogota-B',
    triggeredAt: '2026-06-17T09:00:00.000Z',
    acknowledged: true,
  },
];

function renderTable() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/alerts']}>
        <Routes>
          <Route path="/alerts" element={<AlertsTable alerts={ALERTS} />} />
          <Route path="/alerts/:id" element={<p>Détail alerte</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AlertsTable', () => {
  it('should render one row per alert', () => {
    // Arrange / Act
    renderTable();

    // Assert
    expect(
      screen.getByText('Température trop élevée à Santos-A'),
    ).toBeInTheDocument();
    expect(screen.getByText('Lot périmé à Bogota-B')).toBeInTheDocument();
  });

  it('should navigate to the alert detail when a row is clicked', async () => {
    // Arrange
    renderTable();

    // Act
    await userEvent.click(
      screen.getByText('Température trop élevée à Santos-A'),
    );

    // Assert
    expect(screen.getByText('Détail alerte')).toBeInTheDocument();
  });

  it('should mark acknowledged alerts', () => {
    // Arrange / Act
    renderTable();

    // Assert
    const row = screen.getByText('Lot périmé à Bogota-B').closest('tr');
    expect(row).not.toBeNull();
    expect(within(row as HTMLElement).getByText('Acquittée')).toBeInTheDocument();
  });

  it('should not navigate when the acknowledge button is clicked', async () => {
    // Arrange
    renderTable();

    // Act
    await userEvent.click(screen.getByRole('button', { name: 'Acquitter' }));

    // Assert : on reste sur la liste, le détail n'est pas monté.
    expect(screen.queryByText('Détail alerte')).not.toBeInTheDocument();
  });
});
