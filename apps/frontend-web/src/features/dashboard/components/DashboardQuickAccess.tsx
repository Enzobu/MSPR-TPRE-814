import { Boxes, TriangleAlert } from 'lucide-react';
import { QuickAccessCard } from '@/features/dashboard/components/QuickAccessCard';
import { useUnacknowledgedCount } from '@/features/alerts/hooks/useUnacknowledgedCount';

// Accès rapides du dashboard : grandes cartes-CTA vers les écrans clés. La carte
// Alertes affiche le compteur non acquitté quand il est non nul.
export function DashboardQuickAccess() {
  const { data: count } = useUnacknowledgedCount();
  const hasAlerts = count !== undefined && count > 0;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <QuickAccessCard
        to="/lots"
        icon={Boxes}
        title="Consulter les lots"
        description="Stocks consolidés triés par date de stockage (FIFO)."
      />
      <QuickAccessCard
        to="/alerts"
        icon={TriangleAlert}
        title="Voir les alertes"
        description="Suivez et acquittez les alertes T° / humidité / péremption."
        badge={
          hasAlerts ? (
            <span
              aria-label={`${count} non acquittées`}
              className="inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-semibold text-background tabular-nums"
            >
              {count}
            </span>
          ) : undefined
        }
      />
    </div>
  );
}
