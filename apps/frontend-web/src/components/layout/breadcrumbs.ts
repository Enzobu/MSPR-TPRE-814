export interface Crumb {
  label: string;
  // Le dernier crumb est la page courante (rendu non-muted).
  current: boolean;
}

const SEGMENT_LABELS: Record<string, string> = {
  '': 'Dashboard',
  lots: 'Lots',
  alerts: 'Alertes',
};

function labelForSegment(segment: string): string {
  return SEGMENT_LABELS[segment] ?? segment;
}

// Dérive les breadcrumbs depuis le pathname courant. Racine = ["Dashboard"].
// Un segment dynamique (id de lot/alerte) est affiché tel quel comme feuille.
export function deriveCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return [{ label: 'Dashboard', current: true }];
  }

  return segments.map((segment, index) => ({
    label: labelForSegment(segment),
    current: index === segments.length - 1,
  }));
}
