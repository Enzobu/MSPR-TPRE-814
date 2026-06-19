import { Boxes, CloudOff, TriangleAlert } from 'lucide-react';
import { KpiCard } from '@/features/dashboard/components/KpiCard';
import { useStocksSummary } from '@/features/lots/hooks/useStocksSummary';
import { useUnacknowledgedCount } from '@/features/alerts/hooks/useUnacknowledgedCount';

// Trois KPI alimentés par les vraies données consolidées (lots, alertes, pays
// injoignables). Chaque carte gère son propre chargement/erreur.
export function DashboardKpis() {
  const stocks = useStocksSummary();
  const unack = useUnacknowledgedCount();

  const unavailable = stocks.data?.unavailable ?? [];
  const hasUnavailable = unavailable.length > 0;
  const unackCount = unack.data ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <KpiCard
        label="Lots en stock"
        icon={Boxes}
        isLoading={stocks.isPending}
        isError={stocks.isError}
        value={stocks.data?.total ?? 0}
        hint="Tous pays confondus"
      />
      <KpiCard
        label="Alertes non acquittées"
        icon={TriangleAlert}
        isLoading={unack.isPending}
        isError={unack.isError}
        value={unackCount}
        emphasis={unackCount > 0}
        hint={unackCount > 0 ? 'Action requise' : 'Rien à signaler'}
      />
      <KpiCard
        label="Pays indisponibles"
        icon={CloudOff}
        isLoading={stocks.isPending}
        isError={stocks.isError}
        value={hasUnavailable ? unavailable.join(', ') : 'Tous connectés'}
        emphasis={hasUnavailable}
        hint={hasUnavailable ? 'Données partielles' : undefined}
      />
    </div>
  );
}
