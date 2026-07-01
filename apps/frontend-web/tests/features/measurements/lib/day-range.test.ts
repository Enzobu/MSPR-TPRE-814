import { describe, expect, it } from 'vitest';
import {
  dateToDay,
  dayBounds,
  dayToDate,
  shiftDay,
} from '@/features/measurements/lib/day-range';

// Assertions tz-agnostiques : on raisonne en composantes locales (le jour est
// celui du fuseau de l'utilisateur), pas en littéral ISO UTC.
describe('day-range', () => {
  it('should round-trip a day string through dayToDate/dateToDay', () => {
    expect(dateToDay(dayToDate('2026-07-01'))).toBe('2026-07-01');
  });

  it('should shift a day across a month boundary', () => {
    expect(shiftDay('2026-07-01', -1)).toBe('2026-06-30');
    expect(shiftDay('2026-06-30', 1)).toBe('2026-07-01');
  });

  it('should bound the local calendar day from 00:00:00.000 to 23:59:59.999', () => {
    // Arrange / Act
    const { from, to } = dayBounds('2026-07-01');
    const start = new Date(from);
    const end = new Date(to);

    // Assert — même jour local, bornes début/fin de journée.
    expect([start.getFullYear(), start.getMonth(), start.getDate()]).toEqual([
      2026, 6, 1,
    ]);
    expect([
      start.getHours(),
      start.getMinutes(),
      start.getSeconds(),
      start.getMilliseconds(),
    ]).toEqual([0, 0, 0, 0]);
    expect([end.getFullYear(), end.getMonth(), end.getDate()]).toEqual([
      2026, 6, 1,
    ]);
    expect([
      end.getHours(),
      end.getMinutes(),
      end.getSeconds(),
      end.getMilliseconds(),
    ]).toEqual([23, 59, 59, 999]);
  });
});
