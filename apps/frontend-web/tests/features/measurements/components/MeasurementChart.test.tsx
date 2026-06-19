import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Measurement } from '@futurekawa/contracts';
import { MeasurementChart } from '@/features/measurements/components/MeasurementChart';

// recharts ResponsiveContainer mesure son parent via ResizeObserver : en jsdom la
// taille est 0 et rien ne se dessine. On force une taille fixe en remplaçant le
// conteneur par une div dimensionnée, ce qui suffit à recharts pour rendre le SVG.
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

const MEASUREMENTS: Measurement[] = [
  {
    id: 'M1',
    country: 'BR',
    warehouse: 'W1',
    temperatureCelsius: 29,
    humidityPercent: 55,
    recordedAt: '2026-06-01T08:00:00.000Z',
  },
  {
    id: 'M2',
    country: 'BR',
    warehouse: 'W1',
    temperatureCelsius: 35,
    humidityPercent: 56,
    recordedAt: '2026-06-01T09:00:00.000Z',
  },
];

describe('MeasurementChart', () => {
  it('should render a labelled figure describing the curve', () => {
    // Arrange / Act
    const { getByRole } = render(
      <MeasurementChart
        measurements={MEASUREMENTS}
        country="BR"
        metric="temperature"
      />,
    );

    // Assert
    const figure = getByRole('figure', { name: /Courbe température/i });
    expect(figure).toBeInTheDocument();
  });

  it('should render the chart svg with the data line', () => {
    // Arrange / Act
    const { container } = render(
      <MeasurementChart
        measurements={MEASUREMENTS}
        country="BR"
        metric="temperature"
      />,
    );

    // Assert : recharts rend un <svg> contenant la courbe (path recharts-line-curve)
    const svg = container.querySelector('svg.recharts-surface');
    expect(svg).not.toBeNull();
    expect(
      container.querySelector('.recharts-line-curve'),
    ).not.toBeNull();
  });

  it('should render reference lines for the tolerance bounds', () => {
    // Arrange / Act
    const { container } = render(
      <MeasurementChart
        measurements={MEASUREMENTS}
        country="BR"
        metric="humidity"
      />,
    );

    // Assert : idéal + bornes haute/basse = au moins 3 lignes de référence
    const refLines = container.querySelectorAll('.recharts-reference-line');
    expect(refLines.length).toBeGreaterThanOrEqual(3);
  });
});
