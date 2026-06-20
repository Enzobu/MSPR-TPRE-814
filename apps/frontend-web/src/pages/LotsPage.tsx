import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { Lot } from '@futurekawa/contracts';
import { Button } from '@/components/ui/button';
import { LotCard } from '@/features/lots/components/LotCard';
import { LotsEmptyState } from '@/features/lots/components/LotsEmptyState';
import { LotsListSkeleton } from '@/features/lots/components/LotsListSkeleton';
import { LotsPagination } from '@/features/lots/components/LotsPagination';
import { LotsTable } from '@/features/lots/components/LotsTable';
import { LotsToolbar } from '@/features/lots/components/LotsToolbar';
import { STATUS_ALL } from '@/features/lots/components/LotStatusFilter';
import { UnavailableBanner } from '@/features/lots/components/UnavailableBanner';
import { useLots } from '@/features/lots/hooks/useLots';
import {
  DEFAULT_PAGE_SIZE,
  useLotFilters,
} from '@/features/lots/hooks/useLotFilters';

// Filtres branchés sur l'URL via `useLotFilters` : pays, tri (FIFO asc/desc),
// pagination. Recherche texte et filtre statut sont des filtres CLIENT LOCAUX
// sur la page courante (aucun paramètre API correspondant) — état `useState`.
export default function LotsPage() {
  const { filters, setCountry, setSort, setPage } = useLotFilters();
  const { data, isPending, isError } = useLots(filters);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<typeof STATUS_ALL | Lot['status']>(
    STATUS_ALL,
  );

  const isAscending = filters.sort === 'storedAt:asc';
  const totalPages = data ? Math.max(Math.ceil(data.total / DEFAULT_PAGE_SIZE), 1) : 1;

  const visibleLots = useMemo(() => {
    if (!data) {
      return [];
    }
    const term = search.trim().toLowerCase();
    return data.data.filter((lot) => {
      const matchesStatus = status === STATUS_ALL || lot.status === status;
      const matchesSearch =
        term.length === 0 ||
        lot.id.toLowerCase().includes(term) ||
        lot.warehouse.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [data, search, status]);

  const hasFiltersApplied = search.trim().length > 0 || status !== STATUS_ALL;
  const totalCount = data?.total ?? 0;
  const rangeStart = totalCount === 0 ? 0 : (filters.page - 1) * DEFAULT_PAGE_SIZE + 1;
  const rangeEnd = Math.min(filters.page * DEFAULT_PAGE_SIZE, totalCount);

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Lots en entrepôt
          </h1>
          <p className="text-sm text-muted-foreground">
            {totalCount} lot{totalCount > 1 ? 's' : ''} · triés FIFO par date de
            stockage
          </p>
        </div>
        <Button
          type="button"
          onClick={() =>
            toast.info('La création de lot arrivera dans une prochaine version.')
          }
        >
          <Plus aria-hidden />
          Nouveau lot
        </Button>
      </header>

      <LotsToolbar
        search={search}
        onSearchChange={setSearch}
        country={filters.country}
        onCountryChange={setCountry}
        status={status}
        onStatusChange={setStatus}
        isAscending={isAscending}
        onToggleSort={() =>
          setSort(isAscending ? 'storedAt:desc' : 'storedAt:asc')
        }
      />

      {data ? <UnavailableBanner unavailable={data.unavailable} /> : null}

      {isPending ? <LotsListSkeleton /> : null}

      {isError ? (
        <p
          role="alert"
          className="rounded-xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground"
        >
          Impossible de charger les lots pour le moment. Réessayez plus tard.
        </p>
      ) : null}

      {data ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {visibleLots.length === 0 ? (
            <LotsEmptyState
              title="Aucun lot ne correspond"
              description={
                hasFiltersApplied
                  ? 'Ajustez la recherche ou les filtres pays / statut.'
                  : 'Aucun lot en stock pour ce périmètre.'
              }
              onReset={
                hasFiltersApplied
                  ? () => {
                      setSearch('');
                      setStatus(STATUS_ALL);
                    }
                  : undefined
              }
            />
          ) : (
            <>
              <div className="hidden md:block">
                <LotsTable lots={visibleLots} />
              </div>
              <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 md:hidden">
                {visibleLots.map((lot) => (
                  <LotCard key={lot.id} lot={lot} />
                ))}
              </div>
              <LotsPagination
                page={filters.page}
                totalPages={totalPages}
                rangeLabel={`${rangeStart}–${rangeEnd} sur ${totalCount}`}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
