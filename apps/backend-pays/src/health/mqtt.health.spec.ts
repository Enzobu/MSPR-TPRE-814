import { EventEmitter } from 'node:events';
import { ConfigService } from '@nestjs/config';
import { HealthIndicatorService } from '@nestjs/terminus';
import { connect } from 'mqtt';
import type { Env } from '../config/env.validation';
import { MqttHealthIndicator } from './mqtt.health';

jest.mock('mqtt', () => ({
  connect: jest.fn(),
}));

const connectMock = connect as jest.MockedFunction<typeof connect>;

// Fake client : un EventEmitter qui expose `end` pour vérifier la fermeture.
class FakeMqttClient extends EventEmitter {
  end = jest.fn();
}

function mockIndicatorService(): HealthIndicatorService {
  const session = {
    up: jest.fn().mockReturnValue({ mqtt: { status: 'up' } }),
    down: jest.fn().mockReturnValue({ mqtt: { status: 'down' } }),
  };
  return {
    check: jest.fn().mockReturnValue(session),
  } as unknown as HealthIndicatorService;
}

function mockConfig(): ConfigService<Env, true> {
  const values: Record<string, string> = {
    MQTT_URL: 'mqtt://localhost:1883',
    MQTT_USERNAME: 'user',
    MQTT_PASSWORD: 'pass',
    MQTT_CLIENT_ID: 'backend-pays',
  };
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService<Env, true>;
}

describe('MqttHealthIndicator', () => {
  beforeEach(() => {
    connectMock.mockReset();
  });

  it('should report up and close the connection when the broker connects', async () => {
    // Arrange
    const client = new FakeMqttClient();
    connectMock.mockReturnValue(
      client as unknown as ReturnType<typeof connect>,
    );
    const indicator = new MqttHealthIndicator(
      mockIndicatorService(),
      mockConfig(),
    );

    // Act
    const resultPromise = indicator.isHealthy('mqtt');
    client.emit('connect');
    const result = await resultPromise;

    // Assert
    expect(result).toEqual({ mqtt: { status: 'up' } });
    expect(client.end).toHaveBeenCalledWith(true);
  });

  it('should report down and close the connection when the broker errors', async () => {
    // Arrange
    const client = new FakeMqttClient();
    connectMock.mockReturnValue(
      client as unknown as ReturnType<typeof connect>,
    );
    const indicator = new MqttHealthIndicator(
      mockIndicatorService(),
      mockConfig(),
    );

    // Act
    const resultPromise = indicator.isHealthy('mqtt');
    client.emit('error', new Error('ECONNREFUSED'));
    const result = await resultPromise;

    // Assert
    expect(result).toEqual({ mqtt: { status: 'down' } });
    expect(client.end).toHaveBeenCalledWith(true);
  });

  it('should pass the broker url and scoped options to connect', async () => {
    // Arrange
    const client = new FakeMqttClient();
    connectMock.mockReturnValue(
      client as unknown as ReturnType<typeof connect>,
    );
    const indicator = new MqttHealthIndicator(
      mockIndicatorService(),
      mockConfig(),
    );

    // Act
    const resultPromise = indicator.isHealthy('mqtt');
    client.emit('connect');
    await resultPromise;

    // Assert
    expect(connectMock).toHaveBeenCalledTimes(1);
    const [url, options] = connectMock.mock.calls[0];
    expect(url).toBe('mqtt://localhost:1883');
    expect(options).toMatchObject({
      username: 'user',
      password: 'pass',
      reconnectPeriod: 0,
    });
    expect(options?.clientId).toContain('backend-pays-health-');
  });
});
