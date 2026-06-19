import { ConfigService } from '@nestjs/config';
import type { ConsolidatedResponse, Lot } from '@futurekawa/contracts';
import type { Env } from '../../config/env.validation';
import { StocksCache } from './stocks-cache';

const value: ConsolidatedResponse<Lot> = {
  data: [],
  total: 0,
  page: 1,
  pageSize: 20,
  unavailable: [],
};

const configWithTtl = (ttl: number): ConfigService<Env, true> =>
  ({ get: () => ttl }) as unknown as ConfigService<Env, true>;

describe('StocksCache', () => {
  let nowSpy: jest.SpyInstance<number, []>;

  beforeEach(() => {
    nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_000);
  });

  afterEach(() => {
    nowSpy.mockRestore();
  });

  it('should return a stored value before the TTL expires', () => {
    const cache = new StocksCache(configWithTtl(60_000));
    cache.set('k', value);

    nowSpy.mockReturnValue(1_000 + 59_999);
    expect(cache.get('k')).toBe(value);
  });

  it('should expire a value after the TTL', () => {
    const cache = new StocksCache(configWithTtl(60_000));
    cache.set('k', value);

    nowSpy.mockReturnValue(1_000 + 60_000);
    expect(cache.get('k')).toBeUndefined();
  });

  it('should be disabled when TTL is 0', () => {
    const cache = new StocksCache(configWithTtl(0));
    cache.set('k', value);
    expect(cache.get('k')).toBeUndefined();
  });

  it('should return undefined for an unknown key', () => {
    const cache = new StocksCache(configWithTtl(60_000));
    expect(cache.get('missing')).toBeUndefined();
  });
});
