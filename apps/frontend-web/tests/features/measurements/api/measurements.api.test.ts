import { afterEach, describe, expect, it, vi } from 'vitest';
import type {
  ConsolidatedList,
  ConsolidatedResponse,
  Measurement,
} from '@futurekawa/contracts';
import { httpClient } from '@/lib/http-client';
import {
  MEASUREMENTS_CHART_PAGE_SIZE,
  fetchLatestMeasurements,
  fetchMeasurements,
} from '@/features/measurements/api/measurements.api';

vi.mock('@/lib/http-client', () => ({
  httpClient: { get: vi.fn() },
}));

const mockedClient = vi.mocked(httpClient);

const RESPONSE: ConsolidatedResponse<Measurement> = {
  data: [],
  total: 0,
  page: 1,
  pageSize: MEASUREMENTS_CHART_PAGE_SIZE,
  unavailable: [],
};

describe('measurements.api', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should request measurements with required country and warehouse and defaults', async () => {
    // Arrange
    mockedClient.get.mockResolvedValue({ data: RESPONSE });

    // Act
    const result = await fetchMeasurements({ country: 'BR', warehouse: 'Santos-A' });

    // Assert
    expect(mockedClient.get).toHaveBeenCalledWith('/api/v1/measurements', {
      params: {
        country: 'BR',
        warehouse: 'Santos-A',
        from: undefined,
        to: undefined,
        page: 1,
        pageSize: MEASUREMENTS_CHART_PAGE_SIZE,
      },
    });
    expect(result).toEqual(RESPONSE);
  });

  it('should forward explicit pagination and range params', async () => {
    // Arrange
    mockedClient.get.mockResolvedValue({ data: RESPONSE });

    // Act
    await fetchMeasurements({
      country: 'EC',
      warehouse: 'Guayaquil-B',
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-02-01T00:00:00.000Z',
      page: 3,
      pageSize: 50,
    });

    // Assert
    expect(mockedClient.get).toHaveBeenCalledWith('/api/v1/measurements', {
      params: {
        country: 'EC',
        warehouse: 'Guayaquil-B',
        from: '2026-01-01T00:00:00.000Z',
        to: '2026-02-01T00:00:00.000Z',
        page: 3,
        pageSize: 50,
      },
    });
  });

  it('should request the consolidated latest measurements endpoint', async () => {
    // Arrange
    const latest: ConsolidatedList<Measurement> = { data: [], unavailable: [] };
    mockedClient.get.mockResolvedValue({ data: latest });

    // Act
    const result = await fetchLatestMeasurements();

    // Assert
    expect(mockedClient.get).toHaveBeenCalledWith('/api/v1/measurements/latest');
    expect(result).toEqual(latest);
  });
});
