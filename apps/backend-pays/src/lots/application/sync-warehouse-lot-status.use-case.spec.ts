import type { LotRepository } from '../domain/lot.repository';
import { SyncWarehouseLotStatusUseCase } from './sync-warehouse-lot-status.use-case';

describe('SyncWarehouseLotStatusUseCase', () => {
  let setWarehouseStatus: jest.Mock;
  let lots: jest.Mocked<Pick<LotRepository, 'setWarehouseStatus'>>;
  let useCase: SyncWarehouseLotStatusUseCase;

  beforeEach(() => {
    setWarehouseStatus = jest.fn().mockResolvedValue(1);
    lots = { setWarehouseStatus };
    useCase = new SyncWarehouseLotStatusUseCase(
      lots as unknown as LotRepository,
    );
  });

  it('should move CONFORME lots to EN_ALERTE when out of range', async () => {
    await useCase.execute({ country: 'BR', warehouse: 'W1', outOfRange: true });

    expect(setWarehouseStatus).toHaveBeenCalledWith({
      country: 'BR',
      warehouse: 'W1',
      from: 'CONFORME',
      to: 'EN_ALERTE',
    });
  });

  it('should move EN_ALERTE lots back to CONFORME when in range', async () => {
    await useCase.execute({ country: 'EC', warehouse: 'W2', outOfRange: false });

    expect(setWarehouseStatus).toHaveBeenCalledWith({
      country: 'EC',
      warehouse: 'W2',
      from: 'EN_ALERTE',
      to: 'CONFORME',
    });
  });

  it('should never target PERIME lots (only CONFORME/EN_ALERTE transitions)', async () => {
    await useCase.execute({ country: 'CO', warehouse: 'W3', outOfRange: true });
    await useCase.execute({ country: 'CO', warehouse: 'W3', outOfRange: false });

    const froms = setWarehouseStatus.mock.calls.map((c) => c[0].from);
    const tos = setWarehouseStatus.mock.calls.map((c) => c[0].to);
    expect(froms).not.toContain('PERIME');
    expect(tos).not.toContain('PERIME');
  });
});
