export interface Crumb {
  label: string;
  // Chemin cible du crumb (cliquable tant qu'il n'est pas la page courante).
  href: string;
  // Le dernier crumb est la page courante (rendu non-muted, non cliquable).
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
    return [{ label: 'Dashboard', href: '/', current: true }];
  }

  return segments.map((segment, index) => ({
    label: labelForSegment(segment),
    href: '/' + segments.slice(0, index + 1).join('/'),
    current: index === segments.length - 1,
  }));
}
