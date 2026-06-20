import { Boxes, CloudOff, TriangleAlert } from 'lucide-react';
import type { CountryCode } from '@futurekawa/contracts';
import { KpiCard } from '@/features/dashboard/components/KpiCard';
import { COUNTRY_LABELS } from '@/features/dashboard/lib/country';
import { useStocksSummary } from '@/features/lots/hooks/useStocksSummary';
import { useUnacknowledgedCount } from '@/features/alerts/hooks/useUnacknowledgedCount';

type DashboardKpisProps = Readonly<{
  country?: CountryCode;
}>;

// Trois KPI alimentés par les vraies données consolidées (lots, alertes, pays
// injoignables), scopables par pays. Chaque carte gère son propre
// chargement/erreur.
export function DashboardKpis({ country }: DashboardKpisProps) {
  const stocks = useStocksSummary(country);
  const unack = useUnacknowledgedCount(country);

  const unavailable = stocks.data?.unavailable ?? [];
  const hasUnavailable = unavailable.length > 0;
  const unackCount = unack.data ?? 0;
  const scopeHint = country ? COUNTRY_LABELS[country] : 'Tous pays confondus';

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <KpiCard
        label="Lots en stock"
        icon={Boxes}
        isLoading={stocks.isPending}
        isError={stocks.isError}
        value={stocks.data?.total ?? 0}
        hint={scopeHint}
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
