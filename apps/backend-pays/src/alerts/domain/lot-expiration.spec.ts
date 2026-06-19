import { expirationCutoff, isLotExpired } from './lot-expiration';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const daysAgo = (now: Date, days: number): Date =>
  new Date(now.getTime() - days * MS_PER_DAY);

describe('lot-expiration', () => {
  const now = new Date('2026-06-19T02:00:00.000Z');

  describe('expirationCutoff', () => {
    it('should return now minus 365 days by default', () => {
      // Act
      const cutoff = expirationCutoff(now);

      // Assert
      expect(cutoff.getTime()).toBe(now.getTime() - 365 * MS_PER_DAY);
    });

    it('should honour a custom max age', () => {
      // Act
      const cutoff = expirationCutoff(now, 10);

      // Assert
      expect(cutoff.getTime()).toBe(now.getTime() - 10 * MS_PER_DAY);
    });
  });

  describe('isLotExpired', () => {
    it('should not flag a lot stored 364 days ago', () => {
      expect(isLotExpired(daysAgo(now, 364), now)).toBe(false);
    });

    it('should not flag a lot stored exactly 365 days ago (> 365 is strict)', () => {
      // Limite : « > 365 j » → 365 j pile n'est PAS encore périmé.
      expect(isLotExpired(daysAgo(now, 365), now)).toBe(false);
    });

    it('should flag a lot stored 366 days ago', () => {
      expect(isLotExpired(daysAgo(now, 366), now)).toBe(true);
    });

    it('should flag a lot stored 400 days ago', () => {
      expect(isLotExpired(daysAgo(now, 400), now)).toBe(true);
    });
  });
});
