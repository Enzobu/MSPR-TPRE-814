import { Button } from '@/components/ui/button';
import { AcknowledgedFilter } from '@/features/alerts/components/AcknowledgedFilter';
import { AlertCard } from '@/features/alerts/components/AlertCard';
import { AlertTypeFilter } from '@/features/alerts/components/AlertTypeFilter';
import { AlertsListSkeleton } from '@/features/alerts/components/AlertsListSkeleton';
import { AlertsTable } from '@/features/alerts/components/AlertsTable';
import { AlertsUnavailableBanner } from '@/features/alerts/components/AlertsUnavailableBanner';
import { useAlerts } from '@/features/alerts/hooks/useAlerts';
import {
  DEFAULT_PAGE_SIZE,
  useAlertFilters,
} from '@/features/alerts/hooks/useAlertFilters';

export default function AlertsPage() {
  const { filters, setType, setAcknowledged, setPage } = useAlertFilters();
  const { data, isPending, isError } = useAlerts(filters);

  const totalPages = data ? Math.ceil(data.total / DEFAULT_PAGE_SIZE) : 1;
  const hasNextPage = filters.page < totalPages;
  const hasPreviousPage = filters.page > 1;

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Alertes</h1>
        <p className="text-muted-foreground">
          Alertes consolidées, triées par date de déclenchement (plus récentes
          d'abord).
        </p>
      </header>

      <div className="flex flex-col gap-3">
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
          className="rounded-lg border border-border bg-muted px-4 py-3 text-sm text-muted-foreground"
        >
          Impossible de charger les alertes pour le moment. Réessayez plus tard.
        </p>
      ) : null}

      {data?.data.length === 0 ? (
        <p className="rounded-lg border border-border px-4 py-8 text-center text-sm text-muted-foreground">
          Aucune alerte ne correspond à ces critères.
        </p>
      ) : null}

      {data && data.data.length > 0 ? (
        <>
          <div className="hidden md:block">
            <AlertsTable alerts={data.data} />
          </div>
          <div className="space-y-3 md:hidden">
            {data.data.map((alert) => (
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
