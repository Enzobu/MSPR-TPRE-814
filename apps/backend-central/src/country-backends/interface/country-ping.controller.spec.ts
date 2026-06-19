import { BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import type { CountryBackendGateway } from '../domain/country-backend.gateway';
import { CountryUnavailableError } from '../domain/country-backend.gateway';
import { CountryPingController } from './country-ping.controller';

type RequestWithId = Request & { id: string };

const req = { id: 'corr-1' } as RequestWithId;

describe('CountryPingController', () => {
  it('should report reachable when the gateway resolves', async () => {
    // Arrange
    const gateway = {
      get: jest.fn().mockResolvedValue({ status: 'ok' }),
    } as unknown as CountryBackendGateway;
    const controller = new CountryPingController(gateway);

    // Act
    const result = await controller.ping('BR', req);

    // Assert
    expect(result).toEqual({ country: 'BR', reachable: true, status: 'ok' });
  });

  it('should propagate the request correlation-id to the gateway', async () => {
    // Arrange
    const get = jest.fn().mockResolvedValue({ status: 'ok' });
    const gateway = { get } as unknown as CountryBackendGateway;
    const controller = new CountryPingController(gateway);

    // Act
    await controller.ping('br', req);

    // Assert
    expect(get).toHaveBeenCalledWith('BR', '/health', {
      correlationId: 'corr-1',
    });
  });

  it('should report not reachable when the gateway throws', async () => {
    // Arrange
    const gateway = {
      get: jest
        .fn()
        .mockRejectedValue(new CountryUnavailableError('EC', 'timeout')),
    } as unknown as CountryBackendGateway;
    const controller = new CountryPingController(gateway);

    // Act
    const result = await controller.ping('EC', req);

    // Assert
    expect(result).toEqual({ country: 'EC', reachable: false, status: null });
  });

  it('should reject an unknown country with 400', async () => {
    // Arrange
    const gateway = { get: jest.fn() } as unknown as CountryBackendGateway;
    const controller = new CountryPingController(gateway);

    // Act / Assert
    await expect(controller.ping('FR', req)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
