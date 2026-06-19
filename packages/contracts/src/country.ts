// Source unique de vérité des codes pays : le type dérive du tableau, qui sert
// aussi de référentiel runtime (validation `@IsIn`, enums Swagger, zod).
export const COUNTRY_CODES = ['BR', 'EC', 'CO'] as const;
export type CountryCode = (typeof COUNTRY_CODES)[number];

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
