import {
  buildRefreshCookieOptions,
  REFRESH_COOKIE_PATH,
  ttlToMs,
} from './refresh-cookie';

describe('ttlToMs', () => {
  it.each([
    ['7d', 7 * 86_400_000],
    ['15m', 15 * 60_000],
    ['2h', 2 * 3_600_000],
    ['30s', 30 * 1_000],
    ['3600', 3_600_000],
  ])('should convert %s to %d ms', (ttl, expected) => {
    expect(ttlToMs(ttl)).toBe(expected);
  });

  it('should return undefined for an unparsable ttl', () => {
    expect(ttlToMs('soon')).toBeUndefined();
  });
});

describe('buildRefreshCookieOptions', () => {
  it('should produce a hardened cookie in production', () => {
    // Act
    const options = buildRefreshCookieOptions({
      isProduction: true,
      refreshTtl: '7d',
    });

    // Assert
    expect(options).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: REFRESH_COOKIE_PATH,
      maxAge: 7 * 86_400_000,
    });
  });

  it('should disable Secure outside production for local http', () => {
    // Act
    const options = buildRefreshCookieOptions({
      isProduction: false,
      refreshTtl: '7d',
    });

    // Assert
    expect(options.secure).toBe(false);
  });
});
