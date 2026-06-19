// Formatage court des instants de mesure pour l'axe X des courbes (audience
// métier siège/terrain, locale fr-FR). Jour + heure suffisent pour situer un point.
const TICK_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatRecordedAt(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return TICK_FORMATTER.format(date);
}
