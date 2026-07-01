export interface DayRange {
  from: string;
  to: string;
}

// Helpers de jour calendaire `YYYY-MM-DD`, tous en **heure locale** : cohérents
// entre le calendrier (react-day-picker manipule des Date locales), les
// raccourcis (aujourd'hui/hier) et les bornes de requête. « Filtrer par le 1er
// juillet » = le 1er juillet du fuseau de l'utilisateur, converti en instants
// UTC pour l'API (recordedAt stockés en UTC).

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

// `YYYY-MM-DD` (local) → Date à minuit local.
export function dayToDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Date → `YYYY-MM-DD` (composantes locales, pas d'ISO UTC qui décalerait le jour).
export function dateToDay(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Jour courant (local).
export function todayIso(): string {
  return dateToDay(new Date());
}

// Décale un jour de `deltaDays` (local, gère les fins de mois).
export function shiftDay(iso: string, deltaDays: number): string {
  const date = dayToDate(iso);
  date.setDate(date.getDate() + deltaDays);
  return dateToDay(date);
}

// Bornes [début, fin] du jour local, en ISO UTC pour l'API.
export function dayBounds(day: string): DayRange {
  const start = dayToDate(day);
  const end = dayToDate(day);
  end.setHours(23, 59, 59, 999);
  return { from: start.toISOString(), to: end.toISOString() };
}
