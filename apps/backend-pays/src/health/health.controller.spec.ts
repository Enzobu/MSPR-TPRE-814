import { HealthCheckService } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { DatabaseHealthIndicator } from './database.health';
import { MqttHealthIndicator } from './mqtt.health';

describe('HealthController', () => {
  let controller: HealthController;
  let capturedIndicators: unknown[];
  let checkCalls: number;
  let databaseIsHealthy: jest.Mock;
  let mqttIsHealthy: jest.Mock;

  beforeEach(() => {
    capturedIndicators = [];
    checkCalls = 0;
    const health = {
      check: (indicators: unknown[]) => {
        checkCalls += 1;
        capturedIndicators = indicators;
        return Promise.resolve({ status: 'ok' });
      },
    } as unknown as HealthCheckService;
    databaseIsHealthy = jest
      .fn()
      .mockResolvedValue({ database: { status: 'up' } });
    mqttIsHealthy = jest.fn().mockResolvedValue({ mqtt: { status: 'up' } });
    const database = {
      isHealthy: databaseIsHealthy,
    } as unknown as DatabaseHealthIndicator;
    const mqtt = {
      isHealthy: mqttIsHealthy,
    } as unknown as MqttHealthIndicator;
    controller = new HealthController(health, database, mqtt);
  });

  it('should return ok for the liveness probe without checking dependencies', () => {
    // Act
    const result = controller.liveness();

    // Assert
    expect(result.status).toBe('ok');
    expect(checkCalls).toBe(0);
  });

  it('should check database and mqtt for the readiness probe', async () => {
    // Act
    await controller.readiness();

    // Assert
    expect(checkCalls).toBe(1);
    expect(capturedIndicators).toHaveLength(2);
  });

  it('should wire the readiness indicators to the database and mqtt checks', async () => {
    // Act
    await controller.readiness();
    const indicators = capturedIndicators as Array<() => Promise<unknown>>;
    await Promise.all(indicators.map((fn) => fn()));

    // Assert
    expect(databaseIsHealthy).toHaveBeenCalledWith('database');
    expect(mqttIsHealthy).toHaveBeenCalledWith('mqtt');
  });
});
