import { LOT_MAX_AGE_DAYS } from '@futurekawa/contracts';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Instant pivot de péremption (ADR-0004) : un lot est périmé si son `storedAt`
// est STRICTEMENT antérieur à ce cutoff. Le ticket parle de « > 365 jours »,
// donc 365 j pile (storedAt === cutoff) n'est PAS encore périmé ; il le devient
// à partir de 366 j (storedAt < cutoff). Pur, sans infra.
export const expirationCutoff = (
  now: Date,
  maxAgeDays: number = LOT_MAX_AGE_DAYS,
): Date => new Date(now.getTime() - maxAgeDays * MS_PER_DAY);

// Un lot est périmé si stocké depuis STRICTEMENT plus de `maxAgeDays` jours.
// Cohérent avec `expirationCutoff` : 365 j pile → false, 366 j → true.
export const isLotExpired = (
  storedAt: Date,
  now: Date,
  maxAgeDays: number = LOT_MAX_AGE_DAYS,
): boolean => storedAt.getTime() < expirationCutoff(now, maxAgeDays).getTime();
