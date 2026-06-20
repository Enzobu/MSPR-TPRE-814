// Début de la journée calendaire UTC du moment `now`. Sert de bucket de
// déduplication (ADR-0004 : une alerte max par entité et par jour UTC). Pur.
export const startOfDayUtc = (now: Date): Date =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
