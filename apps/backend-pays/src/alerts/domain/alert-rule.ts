import type { AlertType, CountryConditions } from '@futurekawa/contracts';

// Relevé brut soumis à l'évaluateur (sous-ensemble d'une mesure : seules les
// grandeurs physiques comptent pour décider d'une alerte).
export interface MeasurementInput {
  temperatureCelsius: number;
  humidityPercent: number;
}

// Descripteur d'alerte produit par l'évaluateur : type + message FR. Pas d'id,
// pas de date, pas de persistance — l'application enrichit et persiste.
export interface AlertEvaluation {
  type: AlertType;
  message: string;
}

interface Range {
  min: number;
  max: number;
}

const rangeOf = (ideal: number, tolerance: number): Range => ({
  min: ideal - tolerance,
  max: ideal + tolerance,
});

// Bornes INCLUSES = OK (ADR-0004) : strictement hors → alerte.
const isOutOfRange = (value: number, range: Range): boolean =>
  value < range.min || value > range.max;

const formatRange = (range: Range): string => `[${range.min};${range.max}]`;

// Évaluateur PUR (ADR-0004) : déterministe, sans dépendance Nest/infra/Date.
// Retourne 0, 1 ou 2 descripteurs d'alerte selon les grandeurs hors plage.
export function evaluateMeasurement(
  input: MeasurementInput,
  conditions: CountryConditions,
): AlertEvaluation[] {
  const evaluations: AlertEvaluation[] = [];

  const tempRange = rangeOf(
    conditions.idealTemperatureCelsius,
    conditions.temperatureToleranceCelsius,
  );
  if (isOutOfRange(input.temperatureCelsius, tempRange)) {
    evaluations.push({
      type: 'TEMPERATURE_OUT_OF_RANGE',
      message: `Température ${input.temperatureCelsius}°C hors plage ${formatRange(tempRange)}`,
    });
  }

  const humidityRange = rangeOf(
    conditions.idealHumidityPercent,
    conditions.humidityTolerancePercent,
  );
  if (isOutOfRange(input.humidityPercent, humidityRange)) {
    evaluations.push({
      type: 'HUMIDITY_OUT_OF_RANGE',
      message: `Humidité ${input.humidityPercent}% hors plage ${formatRange(humidityRange)}`,
    });
  }

  return evaluations;
}
