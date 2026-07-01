import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ConsolidatedList, Measurement } from '@futurekawa/contracts';
import type { UseQueryResult } from '@tanstack/react-query';
import MonitoringPage from '@/pages/MonitoringPage';
import { useLatestMeasurements } from '@/features/measurements/hooks/useLatestMeasurements';
import { dayBounds } from '@/features/measurements/lib/day-range';

vi.mock('@/features/measurements/hooks/useLatestMeasurements', () => ({
  useLatestMeasurements: vi.fn(),
}));

// Isole la page de la logique de courbes : on affirme la région/entrepôt ET les
// bornes de temps (filtre jour) transmises au panneau d'historique.
vi.mock('@/features/measurements/components/MeasurementsPanel', () => ({
  MeasurementsPanel: ({
    country,
    warehouse,
    from,
    to,
  }: {
    country: string;
    warehouse: string;
    from?: string;
    to?: string;
  }) => (
    <div data-testid="history-panel">
      {country}:{warehouse}:{from ?? '-'}:{to ?? '-'}
    </div>
  ),
}));

const mockedHook = vi.mocked(useLatestMeasurements);

type Result = UseQueryResult<ConsolidatedList<Measurement>>;
const asResult = (partial: Partial<Result>): Result => partial as Result;

const reading = (
  country: Measurement['country'],
  warehouse: string,
): Measurement => ({
  id: `m-${country}`,
  country,
  warehouse,
  temperatureCelsius: country === 'EC' ? 35.4 : 29,
  humidityPercent: 55,
  recordedAt: '2026-07-01T08:00:00.000Z',
});

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <MonitoringPage />
    </MemoryRouter>,
  );
}

const okData = (unavailable: Measurement['country'][] = []) =>
  asResult({
    data: {
      data: [reading('BR', 'Santos-A'), reading('EC', 'Guayaquil-1')],
      unavailable,
    },
    isPending: false,
    isError: false,
  });

describe('MonitoringPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render one card per region: reading, empty and unavailable states', () => {
    // Arrange — BR a un relevé, EC répond sans relevé (absent + non unavailable),
    // CO est injoignable.
    mockedHook.mockReturnValue(
      asResult({
        data: { data: [reading('BR', 'Santos-A')], unavailable: ['CO'] },
        isPending: false,
        isError: false,
      }),
    );

    // Act
    renderAt('/monitoring');

    // Assert — les trois états sont représentés.
    expect(screen.getByText('29.0 °C')).toBeInTheDocument(); // BR : relevé
    expect(
      screen.getByText('Aucun relevé pour le moment.'),
    ).toBeInTheDocument(); // EC : vide
    expect(screen.getByText('Région injoignable')).toBeInTheDocument(); // CO
    expect(screen.getByRole('alert')).toHaveTextContent('Colombie');
  });

  it('should open the first region with a reading by default', () => {
    // Arrange
    mockedHook.mockReturnValue(okData());

    // Act
    renderAt('/monitoring');

    // Assert — pas de filtre jour → bornes absentes.
    expect(screen.getByTestId('history-panel')).toHaveTextContent(
      'BR:Santos-A:-:-',
    );
  });

  it('should follow the global country selection from the URL', () => {
    // Arrange
    mockedHook.mockReturnValue(okData());

    // Act — ?country=EC (sélecteur pays global) ouvre l'Équateur.
    renderAt('/monitoring?country=EC');

    // Assert
    expect(screen.getByTestId('history-panel')).toHaveTextContent(
      'EC:Guayaquil-1',
    );
  });

  it('should update the selected region when a card is clicked', async () => {
    // Arrange
    mockedHook.mockReturnValue(okData());
    renderAt('/monitoring');

    // Act — clic sur la carte Équateur.
    await userEvent.click(screen.getByRole('button', { name: /Équateur/ }));

    // Assert
    expect(screen.getByTestId('history-panel')).toHaveTextContent(
      'EC:Guayaquil-1',
    );
  });

  it('should constrain the history to the selected day (UTC bounds)', () => {
    // Arrange
    mockedHook.mockReturnValue(okData());

    // Act — ?day=2026-07-01 → bornes du jour transmises au panneau.
    renderAt('/monitoring?day=2026-07-01');

    // Assert (tz-agnostique : mêmes bornes que dayBounds).
    const { from, to } = dayBounds('2026-07-01');
    expect(screen.getByTestId('history-panel')).toHaveTextContent(
      `BR:Santos-A:${from}:${to}`,
    );
  });

  it('should render an error state without crashing', () => {
    // Arrange
    mockedHook.mockReturnValue(
      asResult({ data: undefined, isPending: false, isError: true }),
    );

    // Act
    renderAt('/monitoring');

    // Assert
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Impossible de charger les relevés',
    );
  });
});
