import type { Alert } from '../domain/alert';
import { AlertNotFoundError } from '../domain/alert.errors';
import type { AlertRepository } from '../domain/alert.repository';
import { GetAlertUseCase } from './get-alert.use-case';

const buildAlert = (): Alert => ({
  id: 'a1',
  country: 'BR',
  type: 'TEMPERATURE_OUT_OF_RANGE',
  message: 'Température hors plage',
  warehouse: 'Entrepôt Sul-1',
  triggeredAt: new Date('2026-06-01T08:00:00.000Z'),
  acknowledged: false,
});

const buildRepo = (): jest.Mocked<AlertRepository> => ({
  existsForWarehouseOnDay: jest.fn(),
  existsForLotOnDay: jest.fn(),
  save: jest.fn(),
  findMany: jest.fn(),
  findById: jest.fn(),
  acknowledge: jest.fn(),
});

describe('GetAlertUseCase', () => {
  let alerts: jest.Mocked<AlertRepository>;
  let useCase: GetAlertUseCase;

  beforeEach(() => {
    alerts = buildRepo();
    useCase = new GetAlertUseCase(alerts);
  });

  it('should return the alert when it exists', async () => {
    // Arrange
    const alert = buildAlert();
    alerts.findById.mockResolvedValue(alert);

    // Act
    const result = await useCase.execute('a1');

    // Assert
    expect(result).toBe(alert);
  });

  it('should throw when the alert does not exist', async () => {
    // Arrange
    alerts.findById.mockResolvedValue(null);

    // Act / Assert
    await expect(useCase.execute('UNKNOWN')).rejects.toThrow(
      AlertNotFoundError,
    );
  });
});
