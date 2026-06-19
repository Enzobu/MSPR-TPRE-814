import { ConfigService } from '@nestjs/config';
import { measurementTopic } from '@futurekawa/contracts';
import type { CountryCode } from '@futurekawa/contracts';
import type { Measurement, NewMeasurement } from '../domain/measurement';
import { IngestMeasurementUseCase } from '../application/ingest-measurement.use-case';
import { MqttMeasurementSubscriber } from './mqtt-measurement.subscriber';

const COUNTRY: CountryCode = 'BR';
const WAREHOUSE = 'W1';
const VALID_TOPIC = measurementTopic(COUNTRY, WAREHOUSE);

function buildPayload(overrides: Record<string, unknown> = {}): Buffer {
  return Buffer.from(
    JSON.stringify({
      temperatureCelsius: 22.5,
      humidityPercent: 55,
      recordedAt: '2026-06-01T08:00:00.000Z',
      ...overrides,
    }),
  );
}

describe('MqttMeasurementSubscriber', () => {
  let execute: jest.Mock;
  let warn: jest.Mock;
  let subscriber: MqttMeasurementSubscriber;

  const configStub = {
    get: (key: string): string | undefined =>
      ({
        MQTT_URL: 'mqtt://localhost:1883',
        MQTT_USERNAME: 'user',
        MQTT_PASSWORD: 'pass',
        MQTT_CLIENT_ID: 'backend-pays',
      })[key],
  } as unknown as ConfigService;

  beforeEach(() => {
    execute = jest.fn().mockResolvedValue({} as Measurement);
    const ingest = { execute } as unknown as IngestMeasurementUseCase;
    warn = jest.fn();
    const logger = {
      warn,
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
    };
    subscriber = new MqttMeasurementSubscriber(
      configStub,
      COUNTRY,
      ingest,
      logger as never,
    );
  });

  it('should persist a valid measurement built from the topic and payload', async () => {
    // Act
    await subscriber.handleMessage(VALID_TOPIC, buildPayload());

    // Assert
    expect(execute).toHaveBeenCalledTimes(1);
    // WHY: jest.Mock.calls est typé any[] ; on fige le contrat NewMeasurement attendu.
    const [[saved]] = execute.mock.calls as [[NewMeasurement]];
    expect(saved.country).toBe(COUNTRY);
    expect(saved.warehouse).toBe(WAREHOUSE);
    expect(saved.temperatureCelsius).toBe(22.5);
    expect(saved.humidityPercent).toBe(55);
    expect(saved.recordedAt).toBeInstanceOf(Date);
    expect(saved.recordedAt.toISOString()).toBe('2026-06-01T08:00:00.000Z');
    expect(warn).not.toHaveBeenCalled();
  });

  it('should drop a broken JSON payload without calling ingest', async () => {
    // Act
    await subscriber.handleMessage(VALID_TOPIC, Buffer.from('{ not json'));

    // Assert
    expect(execute).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('should drop a measurement with temperature out of range', async () => {
    await subscriber.handleMessage(
      VALID_TOPIC,
      buildPayload({ temperatureCelsius: 999 }),
    );

    expect(execute).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('should drop a measurement with humidity out of range', async () => {
    await subscriber.handleMessage(
      VALID_TOPIC,
      buildPayload({ humidityPercent: 150 }),
    );

    expect(execute).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('should drop a message on a malformed topic', async () => {
    await subscriber.handleMessage('futurekawa/BR/warehouse', buildPayload());

    expect(execute).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('should drop a message scoped to another country', async () => {
    const foreignTopic = measurementTopic('EC', WAREHOUSE);

    await subscriber.handleMessage(foreignTopic, buildPayload());

    expect(execute).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('should configure a positive reconnect period for broker resilience', () => {
    const options = subscriber.buildClientOptions();

    expect(options.reconnectPeriod).toBeGreaterThan(0);
    expect(options.clientId).toBe('backend-pays-sub');
  });
});
