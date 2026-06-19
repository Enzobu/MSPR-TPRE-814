import type { Lot } from '../domain/lot';
import type { LotRepository } from '../domain/lot.repository';
import { ListLotsUseCase } from './list-lots.use-case';

const buildLot = (id: string, storedAt: string): Lot => ({
  id,
  country: 'BR',
  farm: 'Fazenda Aurora',
  warehouse: 'Entrepôt Sul-1',
  storedAt: new Date(storedAt),
  status: 'CONFORME',
});

describe('ListLotsUseCase', () => {
  let lots: jest.Mocked<LotRepository>;
  let useCase: ListLotsUseCase;

  beforeEach(() => {
    lots = {
      create: jest.fn(),
      existsById: jest.fn(),
      findById: jest.fn(),
      findManyByStoredAt: jest.fn(),
      updateStatus: jest.fn(),
    };
    useCase = new ListLotsUseCase(lots);
  });

  it('should translate page/pageSize into skip/take and forward the direction', async () => {
    // Arrange
    lots.findManyByStoredAt.mockResolvedValue({ data: [], total: 0 });

    // Act
    await useCase.execute({ page: 3, pageSize: 20, direction: 'asc' });

    // Assert
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest mock, pas un appel
    expect(lots.findManyByStoredAt).toHaveBeenCalledWith({
      skip: 40,
      take: 20,
      direction: 'asc',
    });
  });

  it('should wrap the repository page into the paginated response shape', async () => {
    // Arrange
    const data = [
      buildLot('BR-1', '2026-01-01T00:00:00.000Z'),
      buildLot('BR-2', '2026-02-01T00:00:00.000Z'),
    ];
    lots.findManyByStoredAt.mockResolvedValue({ data, total: 42 });

    // Act
    const result = await useCase.execute({
      page: 1,
      pageSize: 20,
      direction: 'asc',
    });

    // Assert
    expect(result).toEqual({ data, total: 42, page: 1, pageSize: 20 });
  });
});
