import { AlertTriangle } from 'lucide-react';
import type { CountryCode } from '@futurekawa/contracts';
import { COUNTRY_LABELS } from '@/features/dashboard/lib/country';

type DashboardUnavailableBannerProps = Readonly<{
  unavailable: CountryCode[];
}>;

// Encart d'indisponibilité du dashboard : prévient que les KPI affichés sont
// partiels quand le central renvoie des pays injoignables. Texte générique
// (les chiffres, pas seulement les lots).
export function DashboardUnavailableBanner({
  unavailable,
}: DashboardUnavailableBannerProps) {
  if (unavailable.length === 0) {
    return null;
  }

  const labels = unavailable.map((code) => COUNTRY_LABELS[code]).join(', ');

  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-border bg-muted px-4 py-3 text-sm"
    >
      <AlertTriangle
        className="mt-0.5 size-4 shrink-0 text-status-alerte"
        aria-hidden
      />
      <p>
        Données partielles : {labels}{' '}
        {unavailable.length > 1 ? 'sont injoignables' : 'est injoignable'}. Les
        chiffres affichés peuvent être incomplets.
      </p>
    </div>
  );
}
