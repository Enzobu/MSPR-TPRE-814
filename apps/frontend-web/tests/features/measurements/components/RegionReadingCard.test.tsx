import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Measurement } from '@futurekawa/contracts';
import { RegionReadingCard } from '@/features/measurements/components/RegionReadingCard';

// BR : T° 29±3 (26–32), humidité 55±2 (53–57).
const inTolerance: Measurement = {
  id: 'm-br',
  country: 'BR',
  warehouse: 'Santos-A',
  temperatureCelsius: 29,
  humidityPercent: 55,
  recordedAt: '2026-06-01T08:00:00.000Z',
};

describe('RegionReadingCard', () => {
  it('should show the region label and its latest readings', () => {
    // Arrange / Act
    render(
      <RegionReadingCard
        country="BR"
        measurement={inTolerance}
        unavailable={false}
        selected={false}
        onSelect={vi.fn()}
      />,
    );

    // Assert
    expect(screen.getByText('Brésil')).toBeInTheDocument();
    expect(screen.getByText('29.0 °C')).toBeInTheDocument();
    expect(screen.getByText('55.0 %')).toBeInTheDocument();
    expect(screen.queryByText('Hors seuil')).not.toBeInTheDocument();
  });

  it('should display the reading timestamp', () => {
    // Arrange / Act
    render(
      <RegionReadingCard
        country="BR"
        measurement={inTolerance}
        unavailable={false}
        selected={false}
        onSelect={vi.fn()}
      />,
    );

    // Assert — un horodatage (HH:MM) est rendu (tz-agnostique).
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();
  });

  it('should flag a temperature out of the country tolerance', () => {
    // Arrange — BR : 29±3 (26–32) ; 35 est hors seuil.
    render(
      <RegionReadingCard
        country="BR"
        measurement={{ ...inTolerance, temperatureCelsius: 35 }}
        unavailable={false}
        selected={false}
        onSelect={vi.fn()}
      />,
    );

    // Assert
    expect(screen.getByText('Hors seuil')).toBeInTheDocument();
  });

  it('should flag a humidity out of the country tolerance', () => {
    // Arrange — BR : 55±2 (53–57) ; 60 est hors seuil.
    render(
      <RegionReadingCard
        country="BR"
        measurement={{ ...inTolerance, humidityPercent: 60 }}
        unavailable={false}
        selected={false}
        onSelect={vi.fn()}
      />,
    );

    // Assert
    expect(screen.getByText('Hors seuil')).toBeInTheDocument();
  });

  it('should apply the thresholds of the region, not a global one', () => {
    // Arrange — 33 °C est hors seuil pour BR (26–32) mais DANS la tolérance EC
    // (31±3 = 28–34). La carte EC ne doit donc pas alerter.
    render(
      <RegionReadingCard
        country="EC"
        measurement={{
          id: 'm-ec',
          country: 'EC',
          warehouse: 'Guayaquil-1',
          temperatureCelsius: 33,
          humidityPercent: 60,
          recordedAt: '2026-06-01T08:00:00.000Z',
        }}
        unavailable={false}
        selected={false}
        onSelect={vi.fn()}
      />,
    );

    // Assert
    expect(screen.queryByText('Hors seuil')).not.toBeInTheDocument();
  });

  it('should show an explicit empty state when the region has no reading', () => {
    render(
      <RegionReadingCard
        country="EC"
        measurement={null}
        unavailable={false}
        selected={false}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText('Aucun relevé pour le moment.')).toBeInTheDocument();
  });

  it('should show an unavailable state when the region backend is down', () => {
    render(
      <RegionReadingCard
        country="CO"
        measurement={null}
        unavailable
        selected={false}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText('Région injoignable')).toBeInTheDocument();
  });

  it('should call onSelect with the country when clicked', async () => {
    // Arrange
    const onSelect = vi.fn();
    render(
      <RegionReadingCard
        country="BR"
        measurement={inTolerance}
        unavailable={false}
        selected={false}
        onSelect={onSelect}
      />,
    );

    // Act
    await userEvent.click(screen.getByRole('button'));

    // Assert
    expect(onSelect).toHaveBeenCalledWith('BR');
  });

  it('should mark the selected card as pressed', () => {
    render(
      <RegionReadingCard
        country="BR"
        measurement={inTolerance}
        unavailable={false}
        selected
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });
});
