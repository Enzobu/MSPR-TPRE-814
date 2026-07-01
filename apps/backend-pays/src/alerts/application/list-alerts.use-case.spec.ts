import type { Alert } from '../domain/alert';
import type { AlertRepository } from '../domain/alert.repository';
import { ListAlertsUseCase } from './list-alerts.use-case';

const buildAlert = (id: string): Alert => ({
  id,
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

describe('ListAlertsUseCase', () => {
  let alerts: jest.Mocked<AlertRepository>;
  let useCase: ListAlertsUseCase;

  beforeEach(() => {
    alerts = buildRepo();
    useCase = new ListAlertsUseCase(alerts);
  });

  it('should translate page/pageSize into skip/take and forward the filters', async () => {
    // Arrange
    alerts.findMany.mockResolvedValue({ data: [], total: 0 });

    // Act
    await useCase.execute({
      type: 'LOT_EXPIRED',
      acknowledged: false,
      page: 3,
      pageSize: 20,
    });

    // Assert
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest mock, pas un appel
    expect(alerts.findMany).toHaveBeenCalledWith({
      type: 'LOT_EXPIRED',
      acknowledged: false,
      skip: 40,
      take: 20,
    });
  });

  it('should forward the country filter to the repository when provided', async () => {
    // Arrange
    alerts.findMany.mockResolvedValue({ data: [], total: 0 });

    // Act
    await useCase.execute({ page: 1, pageSize: 20, country: 'EC' });

    // Assert — le scope pays est relayé au repository (évite la fuite inter-régions)
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest mock, pas un appel
    expect(alerts.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ country: 'EC' }),
    );
  });

  it('should forward undefined filters when none are provided', async () => {
    // Arrange
    alerts.findMany.mockResolvedValue({ data: [], total: 0 });

    // Act
    await useCase.execute({ page: 1, pageSize: 10 });

    // Assert
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest mock, pas un appel
    expect(alerts.findMany).toHaveBeenCalledWith({
      type: undefined,
      acknowledged: undefined,
      skip: 0,
      take: 10,
    });
  });

  it('should wrap the repository page into the paginated response shape', async () => {
    // Arrange
    const data = [buildAlert('a1'), buildAlert('a2')];
    alerts.findMany.mockResolvedValue({ data, total: 12 });

    // Act
    const result = await useCase.execute({ page: 1, pageSize: 20 });

    // Assert
    expect(result).toEqual({ data, total: 12, page: 1, pageSize: 20 });
  });
});
