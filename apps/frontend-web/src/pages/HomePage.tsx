import { CountrySelector } from '@/features/dashboard/components/CountrySelector';
import { DashboardHero } from '@/features/dashboard/components/DashboardHero';
import { DashboardKpis } from '@/features/dashboard/components/DashboardKpis';
import { DashboardQuickAccess } from '@/features/dashboard/components/DashboardQuickAccess';
import { DashboardUnavailableBanner } from '@/features/dashboard/components/DashboardUnavailableBanner';
import { RecentAlerts } from '@/features/dashboard/components/RecentAlerts';
import { useDashboardCountry } from '@/features/dashboard/hooks/useDashboardCountry';
import { useStocksSummary } from '@/features/lots/hooks/useStocksSummary';

// Dashboard d'accueil : vue d'ensemble (hero + KPI temps réel) scopable par
// pays (état dans l'URL), accès rapides vers lots/alertes. Données consolidées
// via les hooks de feature. La query stocks est partagée avec DashboardKpis
// (même queryKey ['stocks','summary',country]) : TanStack dédoublonne, pas de
// double-fetch — on réutilise ici son `unavailable` pour le banner.
export default function HomePage() {
  const { country, setCountry } = useDashboardCountry();
  const stocks = useStocksSummary(country);
  const unavailable = stocks.data?.unavailable ?? [];

  return (
    <div className="space-y-8">
      <DashboardHero />
      <div className="space-y-4">
        <CountrySelector value={country} onChange={setCountry} />
        <DashboardUnavailableBanner unavailable={unavailable} />
        <DashboardKpis country={country} />
      </div>
      <section className="space-y-3">
        <h2 className="font-heading text-lg font-medium text-foreground">
          Accès rapides
        </h2>
        <DashboardQuickAccess />
      </section>
      <RecentAlerts country={country} />
    </div>
  );
}
