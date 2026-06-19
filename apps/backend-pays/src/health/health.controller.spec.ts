import { HealthCheckService } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { DatabaseHealthIndicator } from './database.health';
import { MqttHealthIndicator } from './mqtt.health';

describe('HealthController', () => {
  let controller: HealthController;
  let capturedIndicators: unknown[];
  let checkCalls: number;

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
    const database = {
      isHealthy: jest.fn(),
    } as unknown as DatabaseHealthIndicator;
    const mqtt = { isHealthy: jest.fn() } as unknown as MqttHealthIndicator;
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
});
