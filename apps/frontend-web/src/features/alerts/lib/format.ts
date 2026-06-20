// Formatage des dates de déclenchement en français (audience métier siège/terrain).
const DATETIME_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatTriggeredAt(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return DATETIME_FORMATTER.format(date);
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

// Écart temporel court (« il y a 3 min ») pour les lignes d'alertes et l'entête
// du détail. Affichage purement front, locale FR.
export function formatAgo(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  const diff = Date.now() - date.getTime();
  if (diff < MINUTE_MS) {
    return "à l'instant";
  }
  if (diff < HOUR_MS) {
    return `il y a ${Math.floor(diff / MINUTE_MS)} min`;
  }
  if (diff < DAY_MS) {
    return `il y a ${Math.floor(diff / HOUR_MS)} h`;
  }
  return `il y a ${Math.floor(diff / DAY_MS)} j`;
}
