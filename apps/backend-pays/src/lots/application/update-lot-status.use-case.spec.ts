import type { Lot } from '../domain/lot';
import { LotNotFoundError } from '../domain/lot.errors';
import type { LotRepository } from '../domain/lot.repository';
import { UpdateLotStatusUseCase } from './update-lot-status.use-case';

const buildLot = (over: Partial<Lot> = {}): Lot => ({
  id: 'BR-2026-008',
  country: 'BR',
  farm: 'Fazenda Aurora',
  warehouse: 'Entrepôt Sul-1',
  storedAt: new Date('2026-06-01T08:00:00.000Z'),
  status: 'CONFORME',
  ...over,
});

describe('UpdateLotStatusUseCase', () => {
  let lots: jest.Mocked<LotRepository>;
  let useCase: UpdateLotStatusUseCase;

  beforeEach(() => {
    lots = {
      create: jest.fn(),
      existsById: jest.fn(),
      findById: jest.fn(),
      findManyByStoredAt: jest.fn(),
      updateStatus: jest.fn(),
    };
    useCase = new UpdateLotStatusUseCase(lots);
  });

  it('should return the updated lot', async () => {
    // Arrange
    const updated = buildLot({ status: 'EN_ALERTE' });
    lots.updateStatus.mockResolvedValue(updated);

    // Act
    const result = await useCase.execute('BR-2026-008', 'EN_ALERTE');

    // Assert
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest mock, pas un appel
    expect(lots.updateStatus).toHaveBeenCalledWith('BR-2026-008', 'EN_ALERTE');
    expect(result).toBe(updated);
  });

  it('should throw when the lot does not exist', async () => {
    // Arrange
    lots.updateStatus.mockResolvedValue(null);

    // Act / Assert
    await expect(useCase.execute('UNKNOWN', 'PERIME')).rejects.toThrow(
      LotNotFoundError,
    );
  });
});
