import type { Lot } from '../domain/lot';
import { toLotResponse } from './lot.mapper';

describe('toLotResponse', () => {
  it('should map a domain lot to the response dto with ISO storedAt', () => {
    // Arrange
    const lot: Lot = {
      id: 'BR-2026-008',
      country: 'BR',
      farm: 'Fazenda Aurora',
      warehouse: 'Entrepôt Sul-1',
      storedAt: new Date('2026-06-01T08:00:00.000Z'),
      status: 'CONFORME',
    };

    // Act
    const dto = toLotResponse(lot);

    // Assert
    expect(dto).toEqual({
      id: 'BR-2026-008',
      country: 'BR',
      farm: 'Fazenda Aurora',
      warehouse: 'Entrepôt Sul-1',
      storedAt: '2026-06-01T08:00:00.000Z',
      status: 'CONFORME',
    });
  });
});
