import { HealthIndicatorService } from '@nestjs/terminus';
import { DatabaseHealthIndicator } from './database.health';
import { PrismaService } from '../infrastructure/persistence/prisma.service';

function mockIndicatorService(): HealthIndicatorService {
  const session = {
    up: jest.fn().mockReturnValue({ database: { status: 'up' } }),
    down: jest.fn().mockReturnValue({ database: { status: 'down' } }),
  };
  return {
    check: jest.fn().mockReturnValue(session),
  } as unknown as HealthIndicatorService;
}

describe('DatabaseHealthIndicator', () => {
  it('should report up when the query succeeds', async () => {
    // Arrange
    const service = mockIndicatorService();
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]) };
    const indicator = new DatabaseHealthIndicator(
      service,
      prisma as unknown as PrismaService,
    );

    // Act
    const result = await indicator.isHealthy('database');

    // Assert
    expect(result).toEqual({ database: { status: 'up' } });
  });

  it('should report down when the query throws', async () => {
    // Arrange
    const service = mockIndicatorService();
    const prisma = {
      $queryRaw: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
    };
    const indicator = new DatabaseHealthIndicator(
      service,
      prisma as unknown as PrismaService,
    );

    // Act
    const result = await indicator.isHealthy('database');

    // Assert
    expect(result).toEqual({ database: { status: 'down' } });
  });
});
