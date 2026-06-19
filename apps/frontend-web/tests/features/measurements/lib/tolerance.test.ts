import { describe, expect, it } from 'vitest';
import { COUNTRY_CONDITIONS } from '@futurekawa/contracts';
import {
  humidityBounds,
  isHumidityOutOfTolerance,
  isTemperatureOutOfTolerance,
  temperatureBounds,
} from '@/features/measurements/lib/tolerance';

// BR : T° idéale 29°C ±3 (limites 26 / 32), humidité idéale 55% ±2 (limites 53 / 57).
const BR = COUNTRY_CONDITIONS.BR;

describe('temperature tolerance', () => {
  it('should treat the ideal value as in tolerance', () => {
    // Arrange / Act / Assert
    expect(
      isTemperatureOutOfTolerance(BR.idealTemperatureCelsius, 'BR'),
    ).toBe(false);
  });

  it('should treat a value exactly on the limit as in tolerance', () => {
    // Arrange
    const upperLimit =
      BR.idealTemperatureCelsius + BR.temperatureToleranceCelsius;

    // Act / Assert
    expect(isTemperatureOutOfTolerance(upperLimit, 'BR')).toBe(false);
  });

  it('should flag a value above the upper limit as out of tolerance', () => {
    // Arrange
    const tooHot =
      BR.idealTemperatureCelsius + BR.temperatureToleranceCelsius + 0.1;

    // Act / Assert
    expect(isTemperatureOutOfTolerance(tooHot, 'BR')).toBe(true);
  });

  it('should flag a value below the lower limit as out of tolerance', () => {
    // Arrange
    const tooCold =
      BR.idealTemperatureCelsius - BR.temperatureToleranceCelsius - 0.1;

    // Act / Assert
    expect(isTemperatureOutOfTolerance(tooCold, 'BR')).toBe(true);
  });

  it('should expose ideal and ±tolerance bounds', () => {
    // Act
    const bounds = temperatureBounds('BR');

    // Assert
    expect(bounds).toEqual({ ideal: 29, lower: 26, upper: 32 });
  });
});

describe('humidity tolerance', () => {
  it('should treat the ideal value as in tolerance', () => {
    // Act / Assert
    expect(isHumidityOutOfTolerance(BR.idealHumidityPercent, 'BR')).toBe(false);
  });

  it('should treat a value exactly on the limit as in tolerance', () => {
    // Arrange
    const lowerLimit = BR.idealHumidityPercent - BR.humidityTolerancePercent;

    // Act / Assert
    expect(isHumidityOutOfTolerance(lowerLimit, 'BR')).toBe(false);
  });

  it('should flag a value above the upper limit as out of tolerance', () => {
    // Arrange
    const tooHumid =
      BR.idealHumidityPercent + BR.humidityTolerancePercent + 0.1;

    // Act / Assert
    expect(isHumidityOutOfTolerance(tooHumid, 'BR')).toBe(true);
  });

  it('should expose ideal and ±tolerance bounds', () => {
    // Act
    const bounds = humidityBounds('BR');

    // Assert
    expect(bounds).toEqual({ ideal: 55, lower: 53, upper: 57 });
  });
});
