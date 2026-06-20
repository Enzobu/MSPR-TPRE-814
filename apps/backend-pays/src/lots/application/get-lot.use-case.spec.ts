import type { Lot } from '../domain/lot';
import { LotNotFoundError } from '../domain/lot.errors';
import type { LotRepository } from '../domain/lot.repository';
import { GetLotUseCase } from './get-lot.use-case';

const buildLot = (): Lot => ({
  id: 'BR-2026-008',
  country: 'BR',
  farm: 'Fazenda Aurora',
  warehouse: 'Entrepôt Sul-1',
  storedAt: new Date('2026-06-01T08:00:00.000Z'),
  status: 'CONFORME',
});

describe('GetLotUseCase', () => {
  let lots: jest.Mocked<LotRepository>;
  let useCase: GetLotUseCase;

  beforeEach(() => {
    lots = {
      create: jest.fn(),
      existsById: jest.fn(),
      findById: jest.fn(),
      findManyByStoredAt: jest.fn(),
      updateStatus: jest.fn(),
    };
    useCase = new GetLotUseCase(lots);
  });

  it('should return the lot when it exists', async () => {
    // Arrange
    const lot = buildLot();
    lots.findById.mockResolvedValue(lot);

    // Act
    const result = await useCase.execute('BR-2026-008');

    // Assert
    expect(result).toBe(lot);
  });

  it('should throw when the lot does not exist', async () => {
    // Arrange
    lots.findById.mockResolvedValue(null);

    // Act / Assert
    await expect(useCase.execute('UNKNOWN')).rejects.toThrow(LotNotFoundError);
  });
});
