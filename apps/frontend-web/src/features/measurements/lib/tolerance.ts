import {
  COUNTRY_CONDITIONS,
  type CountryCode,
} from '@futurekawa/contracts';

export interface ToleranceBounds {
  ideal: number;
  lower: number;
  upper: number;
}

// Bornes ideal±tolerance pour la T°, dérivées des seuils pays (source unique :
// COUNTRY_CONDITIONS). Jamais de valeur métier en dur côté front.
export function temperatureBounds(country: CountryCode): ToleranceBounds {
  const { idealTemperatureCelsius, temperatureToleranceCelsius } =
    COUNTRY_CONDITIONS[country];
  return {
    ideal: idealTemperatureCelsius,
    lower: idealTemperatureCelsius - temperatureToleranceCelsius,
    upper: idealTemperatureCelsius + temperatureToleranceCelsius,
  };
}

// Bornes ideal±tolerance pour l'humidité, dérivées des seuils pays.
export function humidityBounds(country: CountryCode): ToleranceBounds {
  const { idealHumidityPercent, humidityTolerancePercent } =
    COUNTRY_CONDITIONS[country];
  return {
    ideal: idealHumidityPercent,
    lower: idealHumidityPercent - humidityTolerancePercent,
    upper: idealHumidityPercent + humidityTolerancePercent,
  };
}

// Un point est hors tolérance dès que |value - ideal| > tolerance (sur la limite
// exacte = encore dans la tolérance).
export function isTemperatureOutOfTolerance(
  value: number,
  country: CountryCode,
): boolean {
  const { idealTemperatureCelsius, temperatureToleranceCelsius } =
    COUNTRY_CONDITIONS[country];
  return Math.abs(value - idealTemperatureCelsius) > temperatureToleranceCelsius;
}

export function isHumidityOutOfTolerance(
  value: number,
  country: CountryCode,
): boolean {
  const { idealHumidityPercent, humidityTolerancePercent } =
    COUNTRY_CONDITIONS[country];
  return Math.abs(value - idealHumidityPercent) > humidityTolerancePercent;
}
