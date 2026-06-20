import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Measurement } from '@futurekawa/contracts';
import { MeasurementStats } from '@/features/measurements/components/MeasurementStats';

// BR : T° 29±3 (26/32), humidité 55±2 (53/57).
// Dernière mesure (M3) : T°=28 (dans la tolérance), humidité=60 (hors tolérance).
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

// La refonte remplace la <Card> shadcn (data-slot="card") par une carte stylée
// `rounded-xl border`. On localise la carte par son titre.
function cardFor(title: string): HTMLElement {
  const heading = screen.getByText(title);
  const card = heading.closest('div.rounded-xl');
  if (card === null) {
    throw new Error(`card for ${title} not found`);
  }
  return card as HTMLElement;
}

// Récupère la valeur (<dd>) associée à un libellé de cellule (<dt>).
function cellValue(card: HTMLElement, label: string): HTMLElement {
  const dt = within(card).getByText(label).closest('dt');
  const dd = dt?.parentElement?.querySelector('dd');
  if (!dd) {
    throw new Error(`value cell for ${label} not found`);
  }
  return dd as HTMLElement;
}

describe('MeasurementStats', () => {
  it('should render min, max and average for temperature', () => {
    // Arrange / Act
    render(<MeasurementStats measurements={MEASUREMENTS} country="BR" />);

    // Assert : T° = [29, 35, 28] → min 28.0, max 35.0, avg 30.7
    const card = cardFor('Température');
    expect(cellValue(card, 'Min')).toHaveTextContent('28.0 °C');
    expect(cellValue(card, 'Max')).toHaveTextContent('35.0 °C');
    expect(cellValue(card, 'Moy.')).toHaveTextContent('30.7 °C');
  });

  it('should flag the last temperature reading as in tolerance', () => {
    // Arrange / Act
    render(<MeasurementStats measurements={MEASUREMENTS} country="BR" />);

    // Assert : dernière T°=28 est dans la tolérance BR (26/32) → couleur conforme.
    // La refonte exprime le hors-tolérance sur la « Dernière » mesure, pas via
    // un compteur dédié.
    const last = cellValue(cardFor('Température'), 'Dernière');
    expect(last).toHaveTextContent('28.0 °C');
    expect(last.className).toContain('text-status-conforme-foreground');
  });

  it('should flag the last humidity reading as out of tolerance', () => {
    // Arrange / Act
    render(<MeasurementStats measurements={MEASUREMENTS} country="BR" />);

    // Assert : dernière humidité=60 dépasse 57 (BR 55±2) → couleur hors-tolérance.
    const last = cellValue(cardFor('Humidité'), 'Dernière');
    expect(last).toHaveTextContent('60.0 %');
    expect(last.className).toContain('text-status-perime-foreground');
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
