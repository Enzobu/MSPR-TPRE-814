import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
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

describe('AlertsTable', () => {
  it('should render one row per alert', () => {
    // Arrange / Act
    render(
      <MemoryRouter>
        <AlertsTable alerts={ALERTS} />
      </MemoryRouter>,
    );

    // Assert
    expect(
      screen.getByText('Température trop élevée à Santos-A'),
    ).toBeInTheDocument();
    expect(screen.getByText('Lot périmé à Bogota-B')).toBeInTheDocument();
  });

  it('should link each alert to its detail route', () => {
    // Arrange / Act
    render(
      <MemoryRouter>
        <AlertsTable alerts={ALERTS} />
      </MemoryRouter>,
    );

    // Assert
    const row = screen
      .getByText('Température trop élevée à Santos-A')
      .closest('tr');
    expect(row).not.toBeNull();
    const link = within(row as HTMLElement).getByRole('link');
    expect(link).toHaveAttribute('href', '/alerts/AL-BR-001');
  });

  it('should mark acknowledged alerts', () => {
    // Arrange / Act
    render(
      <MemoryRouter>
        <AlertsTable alerts={ALERTS} />
      </MemoryRouter>,
    );

    // Assert
    const row = screen.getByText('Lot périmé à Bogota-B').closest('tr');
    expect(row).not.toBeNull();
    expect(
      within(row as HTMLElement).getByLabelText('Acquittée'),
    ).toBeInTheDocument();
  });
});
