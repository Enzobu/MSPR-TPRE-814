import { HealthCheckService } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { DatabaseHealthIndicator } from './database.health';

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
    controller = new HealthController(health, database);
  });

  it('should return ok for the liveness probe without checking dependencies', () => {
    // Act
    const result = controller.liveness();

    // Assert
    expect(result.status).toBe('ok');
    expect(checkCalls).toBe(0);
  });

  it('should check only the database for the readiness probe', async () => {
    // Act
    await controller.readiness();

    // Assert
    expect(checkCalls).toBe(1);
    expect(capturedIndicators).toHaveLength(1);
  });
});
