import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Measurement } from '@futurekawa/contracts';
import { MeasurementStats } from '@/features/measurements/components/MeasurementStats';

// BR : T° 29±3 (26/32), humidité 55±2 (53/57).
// Point 2 (T°=35) hors tolérance T° ; point 3 (humidité=60) hors tolérance humidité.
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
  {
    id: 'M3',
    country: 'BR',
    warehouse: 'W1',
    temperatureCelsius: 28,
    humidityPercent: 60,
    recordedAt: '2026-06-01T10:00:00.000Z',
  },
];

function cardFor(title: string): HTMLElement {
  const heading = screen.getByText(title);
  const card = heading.closest('[data-slot="card"]');
  if (card === null) {
    throw new Error(`card for ${title} not found`);
  }
  return card as HTMLElement;
}

describe('MeasurementStats', () => {
  it('should render min, max and average for temperature', () => {
    // Arrange / Act
    render(<MeasurementStats measurements={MEASUREMENTS} country="BR" />);

    // Assert : T° = [29, 35, 28] → min 28.0, max 35.0, avg 30.7
    const card = within(cardFor('Température'));
    expect(card.getByText('28.0 °C')).toBeInTheDocument();
    expect(card.getByText('35.0 °C')).toBeInTheDocument();
    expect(card.getByText('30.7 °C')).toBeInTheDocument();
  });

  it('should count temperature points out of tolerance', () => {
    // Arrange / Act
    render(<MeasurementStats measurements={MEASUREMENTS} country="BR" />);

    // Assert : seul T°=35 dépasse 32 → 1 point hors tolérance
    const card = within(cardFor('Température'));
    const outRow = card.getByText('Hors tolérance').closest('dt');
    expect(outRow?.nextElementSibling).toHaveTextContent('1');
  });

  it('should count humidity points out of tolerance', () => {
    // Arrange / Act
    render(<MeasurementStats measurements={MEASUREMENTS} country="BR" />);

    // Assert : seul humidité=60 dépasse 57 → 1 point hors tolérance
    const card = within(cardFor('Humidité'));
    const outRow = card.getByText('Hors tolérance').closest('dt');
    expect(outRow?.nextElementSibling).toHaveTextContent('1');
  });

  it('should render nothing when there is no measurement', () => {
    // Arrange / Act
    const { container } = render(
      <MeasurementStats measurements={[]} country="BR" />,
    );

    // Assert
    expect(container).toBeEmptyDOMElement();
  });
});
