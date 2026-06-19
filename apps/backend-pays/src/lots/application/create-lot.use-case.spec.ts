import type { Lot, NewLot } from '../domain/lot';
import {
  LotAlreadyExistsError,
  LotCountryMismatchError,
} from '../domain/lot.errors';
import type { LotRepository } from '../domain/lot.repository';
import { CreateLotUseCase } from './create-lot.use-case';

const buildNewLot = (over: Partial<NewLot> = {}): NewLot => ({
  id: 'BR-2026-008',
  country: 'BR',
  farm: 'Fazenda Aurora',
  warehouse: 'Entrepôt Sul-1',
  storedAt: new Date('2026-06-01T08:00:00.000Z'),
  ...over,
});

describe('CreateLotUseCase', () => {
  let lots: jest.Mocked<LotRepository>;
  let useCase: CreateLotUseCase;

  beforeEach(() => {
    lots = {
      create: jest.fn(),
      existsById: jest.fn(),
      findById: jest.fn(),
      findManyByStoredAt: jest.fn(),
      updateStatus: jest.fn(),
    };
    useCase = new CreateLotUseCase(lots, 'BR');
  });

  it('should reject a lot whose country differs from the backend country', async () => {
    // Arrange
    const input = buildNewLot({ country: 'EC' });

    // Act / Assert
    await expect(useCase.execute(input)).rejects.toThrow(
      LotCountryMismatchError,
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest mock, pas un appel
    expect(lots.existsById).not.toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest mock, pas un appel
    expect(lots.create).not.toHaveBeenCalled();
  });

  it('should reject a lot whose id already exists', async () => {
    // Arrange
    lots.existsById.mockResolvedValue(true);

    // Act / Assert
    await expect(useCase.execute(buildNewLot())).rejects.toThrow(
      LotAlreadyExistsError,
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest mock, pas un appel
    expect(lots.create).not.toHaveBeenCalled();
  });

  it('should persist a valid lot of the backend country', async () => {
    // Arrange
    const input = buildNewLot();
    const created: Lot = { ...input, status: 'CONFORME' };
    lots.existsById.mockResolvedValue(false);
    lots.create.mockResolvedValue(created);

    // Act
    const result = await useCase.execute(input);

    // Assert
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest mock, pas un appel
    expect(lots.create).toHaveBeenCalledWith(input);
    expect(result).toEqual(created);
  });
});
