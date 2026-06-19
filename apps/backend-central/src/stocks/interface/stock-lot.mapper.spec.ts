import type { Lot } from '@futurekawa/contracts';
import { toStockLot } from './stock-lot.mapper';

describe('stock-lot.mapper', () => {
  describe('toStockLot', () => {
    it('should copy only the contract fields of a lot', () => {
      // Arrange — an extra pays-side field must not leak through the siege DTO.
      const lot = {
        id: 'lot-1',
        country: 'CO',
        farm: 'farm-1',
        warehouse: 'wh-2',
        storedAt: '2026-01-01T00:00:00.000Z',
        status: 'CONFORME',
        injected: 'should-not-leak',
      } as unknown as Lot;

      // Act
      const dto = toStockLot(lot);

      // Assert
      expect(dto).toEqual({
        id: 'lot-1',
        country: 'CO',
        farm: 'farm-1',
        warehouse: 'wh-2',
        storedAt: '2026-01-01T00:00:00.000Z',
        status: 'CONFORME',
      });
    });
  });
});
