import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { Lot } from '@futurekawa/contracts';
import { LotsTable } from '@/features/lots/components/LotsTable';

const LOTS: Lot[] = [
  {
    id: 'LOT-BR-001',
    country: 'BR',
    farm: 'Fazenda Sol',
    warehouse: 'Santos-A',
    storedAt: '2026-01-10T08:00:00.000Z',
    status: 'CONFORME',
  },
  {
    id: 'LOT-CO-002',
    country: 'CO',
    farm: 'Finca Andes',
    warehouse: 'Bogota-B',
    storedAt: '2026-02-15T08:00:00.000Z',
    status: 'EN_ALERTE',
  },
];

describe('LotsTable', () => {
  it('should render one row per lot', () => {
    // Arrange / Act
    render(
      <MemoryRouter>
        <LotsTable lots={LOTS} />
      </MemoryRouter>,
    );

    // Assert
    expect(screen.getByText('Fazenda Sol')).toBeInTheDocument();
    expect(screen.getByText('Finca Andes')).toBeInTheDocument();
  });

  it('should link each lot id to its detail route', () => {
    // Arrange / Act
    render(
      <MemoryRouter>
        <LotsTable lots={LOTS} />
      </MemoryRouter>,
    );

    // Assert
    const link = screen.getByRole('link', { name: 'LOT-BR-001' });
    expect(link).toHaveAttribute('href', '/lots/LOT-BR-001');
  });

  it('should render the status badge inside each row', () => {
    // Arrange / Act
    render(
      <MemoryRouter>
        <LotsTable lots={LOTS} />
      </MemoryRouter>,
    );

    // Assert
    const alertingRow = screen.getByText('Finca Andes').closest('tr');
    expect(alertingRow).not.toBeNull();
    expect(within(alertingRow as HTMLElement).getByText('En alerte')).toBeInTheDocument();
  });
});
