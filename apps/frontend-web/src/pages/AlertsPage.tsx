import { Button } from '@/components/ui/button';
import { AcknowledgedFilter } from '@/features/alerts/components/AcknowledgedFilter';
import { AlertCard } from '@/features/alerts/components/AlertCard';
import { AlertTypeFilter } from '@/features/alerts/components/AlertTypeFilter';
import { AlertsEmptyState } from '@/features/alerts/components/AlertsEmptyState';
import { AlertsListSkeleton } from '@/features/alerts/components/AlertsListSkeleton';
import { AlertsTable } from '@/features/alerts/components/AlertsTable';
import { AlertsUnavailableBanner } from '@/features/alerts/components/AlertsUnavailableBanner';
import { useAlerts } from '@/features/alerts/hooks/useAlerts';
import {
  DEFAULT_PAGE_SIZE,
  useAlertFilters,
} from '@/features/alerts/hooks/useAlertFilters';

function countLabel(total: number): string {
  if (total === 0) {
    return 'Aucune alerte';
  }
  const noun = total > 1 ? 'alertes' : 'alerte';
  return `${total} ${noun}, plus récentes d'abord`;
}

export default function AlertsPage() {
  const { filters, setType, setAcknowledged, setPage } = useAlertFilters();
  const { data, isPending, isError } = useAlerts(filters);

  const totalPages = data ? Math.ceil(data.total / DEFAULT_PAGE_SIZE) : 1;
  const hasNextPage = filters.page < totalPages;
  const hasPreviousPage = filters.page > 1;
  const isFiltered =
    filters.type !== undefined || filters.acknowledged !== undefined;
  const alerts = data?.data ?? [];

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Alertes</h1>
        <p className="text-sm text-muted-foreground">
          {data ? countLabel(data.total) : 'Chargement des alertes…'}
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Type et statut sont des filtres API portés par l'URL (useAlertFilters). */}
        <AlertTypeFilter value={filters.type} onChange={setType} />
        <AcknowledgedFilter
          value={filters.acknowledged}
          onChange={setAcknowledged}
        />
      </div>

      {data ? <AlertsUnavailableBanner unavailable={data.unavailable} /> : null}

      {isPending ? <AlertsListSkeleton /> : null}

      {isError ? (
        <p
          role="alert"
          className="rounded-xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground"
        >
          Impossible de charger les alertes pour le moment. Réessayez plus tard.
        </p>
      ) : null}

      {data && alerts.length === 0 ? (
        <AlertsEmptyState filtered={isFiltered} />
      ) : null}

      {data && alerts.length > 0 ? (
        <>
          <div className="hidden md:block">
            <AlertsTable alerts={alerts} />
          </div>
          <div className="grid gap-3 md:hidden">
            {alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>

          <nav
            className="flex items-center justify-between gap-3"
            aria-label="Pagination des alertes"
          >
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!hasPreviousPage}
              onClick={() => setPage(filters.page - 1)}
            >
              Précédent
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {filters.page} sur {totalPages}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!hasNextPage}
              onClick={() => setPage(filters.page + 1)}
            >
              Suivant
            </Button>
          </nav>
        </>
      ) : null}
    </section>
  );
}
