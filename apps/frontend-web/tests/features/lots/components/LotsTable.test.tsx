import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router';
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

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

describe('LotsTable', () => {
  it('should render one data row per lot', () => {
    // Arrange / Act
    render(
      <MemoryRouter>
        <LotsTable lots={LOTS} />
      </MemoryRouter>,
    );

    // Assert
    // La refonte a supprimé la colonne « Exploitation » : chaque lot est
    // identifié par sa référence (id). On vérifie une ligne par lot.
    expect(screen.getByText('LOT-BR-001')).toBeInTheDocument();
    expect(screen.getByText('LOT-CO-002')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(LOTS.length + 1); // +header
  });

  it('should navigate to the lot detail route when a row is clicked', async () => {
    // Arrange
    render(
      <MemoryRouter initialEntries={['/lots']}>
        <Routes>
          <Route path="/lots" element={<LotsTable lots={LOTS} />} />
        </Routes>
        <LocationProbe />
      </MemoryRouter>,
    );

    // Act
    // La refonte remplace le <Link> par une navigation via useNavigate au clic
    // sur la ligne entière.
    await userEvent.click(screen.getByText('LOT-BR-001').closest('tr')!);

    // Assert
    expect(screen.getByTestId('location')).toHaveTextContent('/lots/LOT-BR-001');
  });

  it('should render the status badge inside each row', () => {
    // Arrange / Act
    render(
      <MemoryRouter>
        <LotsTable lots={LOTS} />
      </MemoryRouter>,
    );

    // Assert
    const alertingRow = screen.getByText('LOT-CO-002').closest('tr');
    expect(alertingRow).not.toBeNull();
    expect(
      within(alertingRow as HTMLElement).getByText('En alerte'),
    ).toBeInTheDocument();
  });
});
