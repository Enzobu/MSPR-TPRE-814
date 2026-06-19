import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConsolidatedResponse, Lot } from '@futurekawa/contracts';
import { useLot } from '@/features/lots/hooks/useLot';
import { fetchStocks } from '@/features/lots/api/lots.api';

vi.mock('@/features/lots/api/lots.api');

const mockedFetch = vi.mocked(fetchStocks);

const LOT: Lot = {
  id: 'LOT-BR-001',
  country: 'BR',
  farm: 'Fazenda Sol',
  warehouse: 'Santos-A',
  storedAt: '2026-01-10T08:00:00.000Z',
  status: 'CONFORME',
};

function buildResponse(lots: Lot[]): ConsolidatedResponse<Lot> {
  return { data: lots, total: lots.length, page: 1, pageSize: 100, unavailable: [] };
}

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useLot', () => {
  beforeEach(() => {
    mockedFetch.mockResolvedValue(buildResponse([LOT]));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return the lot matching the id', async () => {
    // Arrange / Act
    const { result } = renderHook(() => useLot('LOT-BR-001'), { wrapper });

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(LOT);
  });

  it('should return null when the id is not in the consolidated page', async () => {
    // Arrange / Act
    const { result } = renderHook(() => useLot('LOT-UNKNOWN'), { wrapper });

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });
});
