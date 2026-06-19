import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ConsolidatedResponse, Lot } from '@futurekawa/contracts';
import { httpClient } from '@/lib/http-client';
import { fetchStocks } from '@/features/lots/api/lots.api';

vi.mock('@/lib/http-client', () => ({
  httpClient: { get: vi.fn() },
}));

const mockedClient = vi.mocked(httpClient);

const RESPONSE: ConsolidatedResponse<Lot> = {
  data: [
    {
      id: 'LOT-BR-001',
      country: 'BR',
      farm: 'Fazenda Sol',
      warehouse: 'Santos-A',
      storedAt: '2026-01-10T08:00:00.000Z',
      status: 'CONFORME',
    },
  ],
  total: 1,
  page: 1,
  pageSize: 20,
  unavailable: [],
};

describe('lots.api', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should get consolidated stocks with the given params', async () => {
    // Arrange
    const params = { country: 'BR' as const, page: 1, pageSize: 20, sort: 'storedAt:asc' };
    mockedClient.get.mockResolvedValue({ data: RESPONSE });

    // Act
    const result = await fetchStocks(params);

    // Assert
    expect(mockedClient.get).toHaveBeenCalledWith('/api/v1/stocks', { params });
    expect(result).toEqual(RESPONSE);
  });
});
