import { ArrowDownNarrowWide, ArrowUpNarrowWide } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CountryFilter } from '@/features/lots/components/CountryFilter';
import { LotCard } from '@/features/lots/components/LotCard';
import { LotsListSkeleton } from '@/features/lots/components/LotsListSkeleton';
import { LotsTable } from '@/features/lots/components/LotsTable';
import { UnavailableBanner } from '@/features/lots/components/UnavailableBanner';
import { useLots } from '@/features/lots/hooks/useLots';
import {
  DEFAULT_PAGE_SIZE,
  useLotFilters,
} from '@/features/lots/hooks/useLotFilters';

export default function LotsPage() {
  const { filters, setCountry, setSort, setPage } = useLotFilters();
  const { data, isPending, isError } = useLots(filters);

  const isAscending = filters.sort === 'storedAt:asc';
  const totalPages = data ? Math.ceil(data.total / DEFAULT_PAGE_SIZE) : 1;
  const hasNextPage = filters.page < totalPages;
  const hasPreviousPage = filters.page > 1;

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Lots de café vert</h1>
        <p className="text-muted-foreground">
          Stocks consolidés, triés par date de stockage (FIFO).
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <CountryFilter value={filters.country} onChange={setCountry} />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setSort(isAscending ? 'storedAt:desc' : 'storedAt:asc')}
        >
          {isAscending ? (
            <ArrowUpNarrowWide aria-hidden />
          ) : (
            <ArrowDownNarrowWide aria-hidden />
          )}
          {isAscending ? 'Plus anciens' : 'Plus récents'}
        </Button>
      </div>

      {data ? <UnavailableBanner unavailable={data.unavailable} /> : null}

      {isPending ? <LotsListSkeleton /> : null}

      {isError ? (
        <p
          role="alert"
          className="rounded-lg border border-border bg-muted px-4 py-3 text-sm text-muted-foreground"
        >
          Impossible de charger les lots pour le moment. Réessayez plus tard.
        </p>
      ) : null}

      {data && data.data.length === 0 ? (
        <p className="rounded-lg border border-border px-4 py-8 text-center text-sm text-muted-foreground">
          Aucun lot ne correspond à ces critères.
        </p>
      ) : null}

      {data && data.data.length > 0 ? (
        <>
          <div className="hidden md:block">
            <LotsTable lots={data.data} />
          </div>
          <div className="space-y-3 md:hidden">
            {data.data.map((lot) => (
              <LotCard key={lot.id} lot={lot} />
            ))}
          </div>

          <nav
            className="flex items-center justify-between gap-3"
            aria-label="Pagination des lots"
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
