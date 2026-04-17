export type CountryCode = 'BR' | 'EC' | 'CO';

export interface CountryConditions {
  idealTemperatureCelsius: number;
  idealHumidityPercent: number;
  temperatureToleranceCelsius: number;
  humidityTolerancePercent: number;
}

export const COUNTRY_CONDITIONS: Record<CountryCode, CountryConditions> = {
  BR: {
    idealTemperatureCelsius: 29,
    idealHumidityPercent: 55,
    temperatureToleranceCelsius: 3,
    humidityTolerancePercent: 2,
  },
  EC: {
    idealTemperatureCelsius: 31,
    idealHumidityPercent: 60,
    temperatureToleranceCelsius: 3,
    humidityTolerancePercent: 2,
  },
  CO: {
    idealTemperatureCelsius: 26,
    idealHumidityPercent: 80,
    temperatureToleranceCelsius: 3,
    humidityTolerancePercent: 2,
  },
};
