import type { CountryCode } from '@futurekawa/contracts';
import { COUNTRY_CONDITIONS } from '@futurekawa/contracts';
import { evaluateMeasurement } from './alert-rule';

describe('evaluateMeasurement', () => {
  // BR T° [26;32] hum [53;57] / EC T° [28;34] hum [58;62] / CO T° [23;29] hum [78;82].
  const cases: {
    country: CountryCode;
    temp: number;
    hum: number;
    expected: string[];
  }[] = [
    // In-range (centre de plage) → aucune alerte.
    { country: 'BR', temp: 29, hum: 55, expected: [] },
    { country: 'EC', temp: 31, hum: 60, expected: [] },
    { country: 'CO', temp: 26, hum: 80, expected: [] },
    // Bornes incluses (basse + haute) → aucune alerte.
    { country: 'BR', temp: 26, hum: 53, expected: [] },
    { country: 'BR', temp: 32, hum: 57, expected: [] },
    { country: 'CO', temp: 23, hum: 78, expected: [] },
    { country: 'CO', temp: 29, hum: 82, expected: [] },
    // Juste hors borne basse / haute → alerte de la grandeur concernée.
    {
      country: 'BR',
      temp: 25.9,
      hum: 55,
      expected: ['TEMPERATURE_OUT_OF_RANGE'],
    },
    {
      country: 'BR',
      temp: 32.1,
      hum: 55,
      expected: ['TEMPERATURE_OUT_OF_RANGE'],
    },
    {
      country: 'EC',
      temp: 31,
      hum: 62.5,
      expected: ['HUMIDITY_OUT_OF_RANGE'],
    },
    // Cas du ticket.
    {
      country: 'BR',
      temp: 35,
      hum: 55,
      expected: ['TEMPERATURE_OUT_OF_RANGE'],
    },
    { country: 'CO', temp: 26, hum: 50, expected: ['HUMIDITY_OUT_OF_RANGE'] },
    // T° ET humidité hors → 2 alertes.
    {
      country: 'BR',
      temp: 40,
      hum: 30,
      expected: ['TEMPERATURE_OUT_OF_RANGE', 'HUMIDITY_OUT_OF_RANGE'],
    },
  ];

  it.each(cases)(
    'should raise $expected for $country temp=$temp hum=$hum',
    ({ country, temp, hum, expected }) => {
      // Act
      const result = evaluateMeasurement(
        { temperatureCelsius: temp, humidityPercent: hum },
        COUNTRY_CONDITIONS[country],
      );

      // Assert
      expect(result.map((e) => e.type)).toEqual(expected);
    },
  );

  it('should include the value and the range in the temperature message', () => {
    // Act
    const [alert] = evaluateMeasurement(
      { temperatureCelsius: 35, humidityPercent: 55 },
      COUNTRY_CONDITIONS.BR,
    );

    // Assert
    expect(alert.type).toBe('TEMPERATURE_OUT_OF_RANGE');
    expect(alert.message).toContain('35');
    expect(alert.message).toContain('[26;32]');
  });

  it('should include the value in the humidity message', () => {
    // Act
    const [alert] = evaluateMeasurement(
      { temperatureCelsius: 26, humidityPercent: 50 },
      COUNTRY_CONDITIONS.CO,
    );

    // Assert
    expect(alert.type).toBe('HUMIDITY_OUT_OF_RANGE');
    expect(alert.message).toContain('50');
    expect(alert.message).toContain('[78;82]');
  });
});
