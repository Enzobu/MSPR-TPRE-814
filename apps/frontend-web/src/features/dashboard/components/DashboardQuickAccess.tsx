import { Boxes, TriangleAlert } from 'lucide-react';
import type { CountryCode } from '@futurekawa/contracts';
import { QuickAccessCard } from '@/features/dashboard/components/QuickAccessCard';
import { useUnacknowledgedCount } from '@/features/alerts/hooks/useUnacknowledgedCount';

type DashboardQuickAccessProps = Readonly<{
  country?: CountryCode;
}>;

// Carte « Accès rapides » du dashboard (design L671-682) : raccourcis vers les
// écrans clés. La ligne Alertes affiche le compteur non acquitté quand non nul.
export function DashboardQuickAccess({ country }: DashboardQuickAccessProps) {
  const { data: count } = useUnacknowledgedCount(country);
  const hasAlerts = count !== undefined && count > 0;

  return (
    <div className="rounded-xl border bg-card p-[18px]">
      <h2 className="mb-3.5 text-sm font-semibold">Accès rapides</h2>
      <div className="flex flex-col gap-2">
        <QuickAccessCard
          to="/lots"
          icon={Boxes}
          title="Consulter les lots"
          description="Stocks triés par date de stockage (FIFO)."
        />
        <QuickAccessCard
          to="/alerts"
          icon={TriangleAlert}
          title="Voir les alertes"
          description="Suivez et acquittez les alertes T° / humidité."
          badge={
            hasAlerts ? (
              <span
                aria-label={`${count} non acquittées`}
                className="inline-flex min-w-5 items-center justify-center rounded-full bg-status-perime/15 px-1.5 font-mono text-[11px] font-semibold text-status-perime tabular-nums"
              >
                {count}
              </span>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}
