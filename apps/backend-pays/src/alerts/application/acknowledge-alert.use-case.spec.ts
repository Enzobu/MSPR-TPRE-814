import type { Alert } from '../domain/alert';
import { AlertNotFoundError } from '../domain/alert.errors';
import type { AlertRepository } from '../domain/alert.repository';
import { AcknowledgeAlertUseCase } from './acknowledge-alert.use-case';

const buildAlert = (): Alert => ({
  id: 'a1',
  country: 'BR',
  type: 'TEMPERATURE_OUT_OF_RANGE',
  message: 'Température hors plage',
  warehouse: 'Entrepôt Sul-1',
  triggeredAt: new Date('2026-06-01T08:00:00.000Z'),
  acknowledged: true,
});

const buildRepo = (): jest.Mocked<AlertRepository> => ({
  existsForWarehouseOnDay: jest.fn(),
  existsForLotOnDay: jest.fn(),
  save: jest.fn(),
  findMany: jest.fn(),
  findById: jest.fn(),
  acknowledge: jest.fn(),
});

describe('AcknowledgeAlertUseCase', () => {
  let alerts: jest.Mocked<AlertRepository>;
  let useCase: AcknowledgeAlertUseCase;

  beforeEach(() => {
    alerts = buildRepo();
    useCase = new AcknowledgeAlertUseCase(alerts);
  });

  it('should return the acknowledged alert when it exists', async () => {
    // Arrange
    const alert = buildAlert();
    alerts.acknowledge.mockResolvedValue(alert);

    // Act
    const result = await useCase.execute('a1');

    // Assert
    expect(result).toBe(alert);
    expect(result.acknowledged).toBe(true);
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest mock, pas un appel
    expect(alerts.acknowledge).toHaveBeenCalledWith('a1');
  });

  it('should throw when the alert does not exist', async () => {
    // Arrange
    alerts.acknowledge.mockResolvedValue(null);

    // Act / Assert
    await expect(useCase.execute('UNKNOWN')).rejects.toThrow(
      AlertNotFoundError,
    );
  });
});
