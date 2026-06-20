import { AlertTriangle } from 'lucide-react';
import type { CountryCode } from '@futurekawa/contracts';
import { COUNTRY_LABELS } from '@/features/dashboard/lib/country';

type DashboardUnavailableBannerProps = Readonly<{
  unavailable: CountryCode[];
}>;

// Bandeau d'indisponibilité du dashboard (design L577-586) : prévient que les
// KPI affichés sont partiels quand le central renvoie des pays injoignables.
// Teinte statut périmé (rouge) en faible opacité.
export function DashboardUnavailableBanner({
  unavailable,
}: DashboardUnavailableBannerProps) {
  if (unavailable.length === 0) {
    return null;
  }

  const labels = unavailable.map((code) => COUNTRY_LABELS[code]).join(', ');
  const isPlural = unavailable.length > 1;

  return (
    <div
      role="alert"
      className="flex items-center gap-3 rounded-[10px] border border-status-perime/35 bg-status-perime/8 px-4 py-3"
    >
      <AlertTriangle
        className="size-[18px] shrink-0 text-status-perime"
        aria-hidden
      />
      <div className="flex-1">
        <p className="text-[13.5px] font-semibold">
          Données partielles : {labels}{' '}
          {isPlural ? 'sont injoignables' : 'est injoignable'}.
        </p>
        <p className="text-[12.5px] text-muted-foreground">
          Les chiffres affichés peuvent être incomplets. Les autres pays restent
          à jour.
        </p>
      </div>
    </div>
  );
}
