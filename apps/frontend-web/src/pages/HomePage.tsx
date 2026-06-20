import { DashboardHero } from '@/features/dashboard/components/DashboardHero';
import { DashboardKpis } from '@/features/dashboard/components/DashboardKpis';
import { DashboardQuickAccess } from '@/features/dashboard/components/DashboardQuickAccess';
import { DashboardUnavailableBanner } from '@/features/dashboard/components/DashboardUnavailableBanner';
import { RecentAlerts } from '@/features/dashboard/components/RecentAlerts';
import { useDashboardCountry } from '@/features/dashboard/hooks/useDashboardCountry';
import { useStocksSummary } from '@/features/lots/hooks/useStocksSummary';

// Dashboard d'accueil (design L558-701) : salutation + KPI temps réel scopables
// par pays (état dans l'URL, piloté depuis la sidebar via useDashboardCountry),
// alertes récentes + accès rapides. La query stocks est partagée avec
// DashboardKpis (même queryKey) : TanStack dédoublonne, pas de double-fetch — on
// réutilise ici son `unavailable` pour le bandeau.
//
// « Stock par pays » du design est omis : le central n'expose pas de tonnage ni
// de comptage de lots par pays (useStocksSummary ne renvoie que `total` et
// `unavailable`). Pas de donnée inventée — la carte sera ajoutée quand l'API la
// fournira.
export default function HomePage() {
  const { country } = useDashboardCountry();
  const stocks = useStocksSummary(country);
  const unavailable = stocks.data?.unavailable ?? [];

  return (
    <div className="space-y-[18px]">
      <DashboardHero country={country} />
      <DashboardUnavailableBanner unavailable={unavailable} />
      <DashboardKpis country={country} />
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[1.55fr_1fr]">
        <RecentAlerts country={country} />
        <DashboardQuickAccess country={country} />
      </div>
    </div>
  );
}
