import { measurementTopic } from '@futurekawa/contracts';
import type { CountryCode } from '@futurekawa/contracts';
import { parseMeasurementMessage } from './measurement-message.parser';

const COUNTRY: CountryCode = 'BR';
const TOPIC = measurementTopic(COUNTRY, 'W1');

function payload(overrides: Record<string, unknown> = {}): Buffer {
  return Buffer.from(
    JSON.stringify({
      temperatureCelsius: 21,
      humidityPercent: 50,
      recordedAt: '2026-06-01T08:00:00.000Z',
      ...overrides,
    }),
  );
}

describe('parseMeasurementMessage', () => {
  it('should build a NewMeasurement from a valid topic and payload', () => {
    const result = parseMeasurementMessage(TOPIC, payload(), COUNTRY);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.measurement.warehouse).toBe('W1');
      expect(result.measurement.country).toBe(COUNTRY);
      expect(result.measurement.recordedAt).toBeInstanceOf(Date);
    }
  });

  it('should reject a topic with the wrong segment count', () => {
    const result = parseMeasurementMessage(
      'futurekawa/BR/x',
      payload(),
      COUNTRY,
    );

    expect(result).toEqual({ ok: false, reason: 'malformed-topic' });
  });

  it('should reject a topic scoped to another country', () => {
    const result = parseMeasurementMessage(
      measurementTopic('EC', 'W1'),
      payload(),
      COUNTRY,
    );

    expect(result).toEqual({ ok: false, reason: 'malformed-topic' });
  });

  it('should reject a broken JSON payload', () => {
    const result = parseMeasurementMessage(
      TOPIC,
      Buffer.from('{ broken'),
      COUNTRY,
    );

    expect(result).toEqual({ ok: false, reason: 'invalid-json' });
  });

  it('should reject a payload with a non-numeric temperature', () => {
    const result = parseMeasurementMessage(
      TOPIC,
      payload({ temperatureCelsius: 'hot' }),
      COUNTRY,
    );

    expect(result).toEqual({ ok: false, reason: 'invalid-payload-shape' });
  });

  it('should reject a payload with an invalid recordedAt', () => {
    const result = parseMeasurementMessage(
      TOPIC,
      payload({ recordedAt: 'not-a-date' }),
      COUNTRY,
    );

    expect(result).toEqual({ ok: false, reason: 'invalid-payload-shape' });
  });

  it('should reject a temperature out of range', () => {
    const result = parseMeasurementMessage(
      TOPIC,
      payload({ temperatureCelsius: 999 }),
      COUNTRY,
    );

    expect(result).toEqual({ ok: false, reason: 'out-of-range' });
  });

  it('should reject a humidity out of range', () => {
    const result = parseMeasurementMessage(
      TOPIC,
      payload({ humidityPercent: 150 }),
      COUNTRY,
    );

    expect(result).toEqual({ ok: false, reason: 'out-of-range' });
  });
});
