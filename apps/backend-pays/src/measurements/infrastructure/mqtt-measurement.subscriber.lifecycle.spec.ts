import { ConfigService } from '@nestjs/config';
import { measurementSubscriptionTopic } from '@futurekawa/contracts';
import type { CountryCode } from '@futurekawa/contracts';
import type { Measurement } from '../domain/measurement';
import { IngestMeasurementUseCase } from '../application/ingest-measurement.use-case';
import { MqttMeasurementSubscriber } from './mqtt-measurement.subscriber';

const connectMock = jest.fn();

jest.mock('mqtt', () => ({
  connect: (...args: unknown[]): unknown => connectMock(...args),
}));

const COUNTRY: CountryCode = 'BR';

interface FakeClient {
  on: jest.Mock;
  subscribe: jest.Mock;
  end: jest.Mock;
  handlers: Record<string, (...args: unknown[]) => void>;
  emit(event: string, ...args: unknown[]): void;
}

function buildFakeClient(): FakeClient {
  const handlers: Record<string, (...args: unknown[]) => void> = {};
  return {
    handlers,
    on: jest.fn((event: string, handler: (...args: unknown[]) => void) => {
      handlers[event] = handler;
    }),
    subscribe: jest.fn(),
    end: jest.fn(),
    emit(event: string, ...args: unknown[]): void {
      handlers[event]?.(...args);
    },
  };
}

const configStub = {
  get: (key: string): string | undefined =>
    ({
      MQTT_URL: 'mqtt://localhost:1883',
      MQTT_USERNAME: 'user',
      MQTT_PASSWORD: 'pass',
      MQTT_CLIENT_ID: 'backend-pays',
    })[key],
} as unknown as ConfigService;

describe('MqttMeasurementSubscriber lifecycle', () => {
  let client: FakeClient;
  let execute: jest.Mock;
  let logger: {
    warn: jest.Mock;
    info: jest.Mock;
    debug: jest.Mock;
    error: jest.Mock;
  };
  let subscriber: MqttMeasurementSubscriber;

  beforeEach(() => {
    connectMock.mockReset();
    client = buildFakeClient();
    connectMock.mockReturnValue(client);
    execute = jest.fn().mockResolvedValue({} as Measurement);
    const ingest = { execute } as unknown as IngestMeasurementUseCase;
    logger = {
      warn: jest.fn(),
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

  it('should connect and subscribe to the country topic on connect', () => {
    // Act
    subscriber.onModuleInit();
    client.emit('connect');

    // Assert
    expect(connectMock).toHaveBeenCalledTimes(1);
    expect(client.subscribe).toHaveBeenCalledWith(
      measurementSubscriptionTopic(COUNTRY),
      { qos: 1 },
      expect.any(Function),
    );
  });

  it('should log an error when the subscription fails', () => {
    subscriber.onModuleInit();
    client.emit('connect');
    // WHY: jest.Mock.calls est typé `any[]` — on passe par unknown[] pour rester type-safe.
    const subscribeCallback = (
      client.subscribe.mock.calls[0] as unknown[]
    )[2] as (error?: Error) => void;

    subscribeCallback(new Error('subscribe failed'));

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ topic: measurementSubscriptionTopic(COUNTRY) }),
      'MQTT subscribe failed',
    );
  });

  it('should log info when the subscription succeeds', () => {
    subscriber.onModuleInit();
    client.emit('connect');
    // WHY: jest.Mock.calls est typé `any[]` — on passe par unknown[] pour rester type-safe.
    const subscribeCallback = (
      client.subscribe.mock.calls[0] as unknown[]
    )[2] as (error?: Error) => void;

    subscribeCallback();

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ qos: 1 }),
      'MQTT subscribed',
    );
  });

  it('should warn on reconnect and on client error', () => {
    subscriber.onModuleInit();

    client.emit('reconnect');
    client.emit('error', new Error('boom'));

    expect(logger.warn).toHaveBeenCalledWith(
      'MQTT broker unreachable, reconnecting',
    );
    expect(logger.warn).toHaveBeenCalledWith(
      // WHY: expect.any() renvoie `any` — cast en unknown pour éviter no-unsafe-assignment.
      expect.objectContaining({ err: expect.any(Error) as unknown }),
      'MQTT client error',
    );
  });

  it('should route incoming messages to handleMessage', () => {
    const spy = jest
      .spyOn(subscriber, 'handleMessage')
      .mockResolvedValue(undefined);
    subscriber.onModuleInit();

    client.emit(
      'message',
      measurementSubscriptionTopic(COUNTRY),
      Buffer.from('{}'),
    );

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should log an error when persistence fails for a valid measurement', async () => {
    execute.mockRejectedValue(new Error('db down'));
    const topic = measurementSubscriptionTopic(COUNTRY).replace('+', 'W1');
    const payload = Buffer.from(
      JSON.stringify({
        temperatureCelsius: 22.5,
        humidityPercent: 55,
        recordedAt: '2026-06-01T08:00:00.000Z',
      }),
    );

    await subscriber.handleMessage(topic, payload);

    expect(logger.error).toHaveBeenCalledWith(
      // WHY: expect.any() renvoie `any` — cast en unknown pour éviter no-unsafe-assignment.
      expect.objectContaining({
        err: expect.any(Error) as unknown,
        dropped: 1,
      }),
      'MQTT measurement persistence failed',
    );
  });

  it('should end the client on module destroy', () => {
    subscriber.onModuleInit();

    subscriber.onModuleDestroy();

    expect(client.end).toHaveBeenCalledWith(true);
  });
});
