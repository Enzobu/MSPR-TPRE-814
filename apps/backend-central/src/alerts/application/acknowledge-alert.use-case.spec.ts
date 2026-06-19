import type { Alert } from '@futurekawa/contracts';
import {
  CountryRequestError,
  CountryUnavailableError,
  type CountryBackendGateway,
} from '../../country-backends/domain/country-backend.gateway';
import { AcknowledgeAlertUseCase } from './acknowledge-alert.use-case';

const acked: Alert = {
  id: 'a-1',
  country: 'BR',
  type: 'TEMPERATURE_OUT_OF_RANGE',
  message: 'msg',
  triggeredAt: '2026-06-01T00:00:00.000Z',
  acknowledged: true,
};

interface GatewayMock extends CountryBackendGateway {
  get: jest.Mock;
  patch: jest.Mock;
}

function buildGateway(patch: jest.Mock): GatewayMock {
  return { get: jest.fn(), patch };
}

describe('AcknowledgeAlertUseCase', () => {
  it('should patch the owning country and return the acknowledged alert', async () => {
    // Arrange
    const patch = jest.fn().mockResolvedValue(acked);
    const useCase = new AcknowledgeAlertUseCase(buildGateway(patch));

    // Act
    const result = await useCase.execute({
      country: 'BR',
      id: 'a-1',
      correlationId: 'corr-9',
    });

    // Assert
    expect(result).toEqual(acked);
    expect(patch).toHaveBeenCalledWith(
      'BR',
      '/api/v1/alerts/a-1/acknowledge',
      undefined,
      { correlationId: 'corr-9' },
    );
  });

  it('should propagate CountryUnavailableError when the country is unreachable', async () => {
    // Arrange
    const patch = jest
      .fn()
      .mockRejectedValue(new CountryUnavailableError('EC', 'down'));
    const useCase = new AcknowledgeAlertUseCase(buildGateway(patch));

    // Act / Assert
    await expect(
      useCase.execute({ country: 'EC', id: 'x', correlationId: 'c' }),
    ).rejects.toBeInstanceOf(CountryUnavailableError);
  });

  it('should propagate CountryRequestError (404) when the alert is unknown', async () => {
    // Arrange
    const patch = jest
      .fn()
      .mockRejectedValue(new CountryRequestError('BR', 404, 'not found'));
    const useCase = new AcknowledgeAlertUseCase(buildGateway(patch));

    // Act / Assert
    await expect(
      useCase.execute({ country: 'BR', id: 'nope', correlationId: 'c' }),
    ).rejects.toBeInstanceOf(CountryRequestError);
  });
});
