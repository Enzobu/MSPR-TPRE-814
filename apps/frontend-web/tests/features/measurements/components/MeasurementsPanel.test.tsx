import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConsolidatedResponse, Measurement } from '@futurekawa/contracts';
import { MeasurementsPanel } from '@/features/measurements/components/MeasurementsPanel';
import { fetchMeasurements } from '@/features/measurements/api/measurements.api';

vi.mock('@/features/measurements/api/measurements.api');

// recharts ne se dessine pas en jsdom (taille 0) ; on force une taille fixe pour
// que le rendu n'échoue pas. Le test du chart lui-même vit ailleurs.
vi.mock('recharts', async () => {
  const actual =
    await vi.importActual<typeof import('recharts')>('recharts');
  const { ResponsiveContainer } = actual;
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactElement }) => (
      <ResponsiveContainer width={600} height={300}>
        {children}
      </ResponsiveContainer>
    ),
  };
});

function buildResponse(
  overrides: Partial<ConsolidatedResponse<Measurement>> = {},
): ConsolidatedResponse<Measurement> {
  return {
    data: [
      {
        id: 'M1',
        country: 'BR',
        warehouse: 'W1',
        temperatureCelsius: 29,
        humidityPercent: 55,
        recordedAt: '2026-06-01T08:00:00.000Z',
      },
    ],
    total: 1,
    page: 1,
    pageSize: 100,
    unavailable: [],
    ...overrides,
  };
}

function renderPanel(): void {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <MeasurementsPanel country="BR" warehouse="W1" from="2026-05-01T00:00:00.000Z" />
    </QueryClientProvider>,
  );
}

describe('MeasurementsPanel', () => {
  beforeEach(() => {
    vi.mocked(fetchMeasurements).mockReset();
  });

  it('should render the measurement charts when data is available', async () => {
    // Arrange
    vi.mocked(fetchMeasurements).mockResolvedValue(buildResponse());

    // Act
    renderPanel();

    // Assert
    expect(
      await screen.findByRole('figure', { name: /Courbe température/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('figure', { name: /Courbe humidité/i }),
    ).toBeInTheDocument();
  });

  it('should render an empty state when there is no measurement', async () => {
    // Arrange
    vi.mocked(fetchMeasurements).mockResolvedValue(
      buildResponse({ data: [], total: 0 }),
    );

    // Act
    renderPanel();

    // Assert
    expect(
      await screen.findByText('Aucune mesure sur la période.'),
    ).toBeInTheDocument();
  });

  it('should warn about unavailable countries', async () => {
    // Arrange
    vi.mocked(fetchMeasurements).mockResolvedValue(
      buildResponse({ unavailable: ['EC'] }),
    );

    // Act
    renderPanel();

    // Assert
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('EC');
  });

  it('should render a business error message when the request fails', async () => {
    // Arrange
    vi.mocked(fetchMeasurements).mockRejectedValue(new Error('network'));

    // Act
    renderPanel();

    // Assert
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/Impossible de charger les mesures/i);
  });
});
