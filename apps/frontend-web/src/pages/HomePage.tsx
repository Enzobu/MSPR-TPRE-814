import { DashboardHero } from '@/features/dashboard/components/DashboardHero';
import { DashboardKpis } from '@/features/dashboard/components/DashboardKpis';
import { DashboardQuickAccess } from '@/features/dashboard/components/DashboardQuickAccess';
import { RecentAlerts } from '@/features/dashboard/components/RecentAlerts';

// Dashboard d'accueil : vue d'ensemble (hero + KPI temps réel) et accès rapides
// vers les écrans lots et alertes. Données consolidées via les hooks de feature.
export default function HomePage() {
  return (
    <div className="space-y-8">
      <DashboardHero />
      <DashboardKpis />
      <section className="space-y-3">
        <h2 className="font-heading text-lg font-medium text-foreground">
          Accès rapides
        </h2>
        <DashboardQuickAccess />
      </section>
      <RecentAlerts />
    </div>
  );
}
