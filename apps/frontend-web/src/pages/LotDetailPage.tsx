import { ChevronLeft, Download } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LotMetaRow } from '@/features/lots/components/LotMetaRow';
import { LotStatusBadge } from '@/features/lots/components/LotStatusBadge';
import { LotThresholdBanner } from '@/features/lots/components/LotThresholdBanner';
import { useLot } from '@/features/lots/hooks/useLot';
import { MeasurementsPanel } from '@/features/measurements/components/MeasurementsPanel';

export default function LotDetailPage() {
  const { id = '' } = useParams();
  const { data: lot, isPending, isError } = useLot(id);

  return (
    <section className="space-y-4">
      <Button asChild size="sm" variant="ghost" className="-ml-2">
        <Link to="/lots">
          <ChevronLeft aria-hidden />
          Tous les lots
        </Link>
      </Button>

      {isPending ? <Skeleton className="h-28 w-full rounded-xl" /> : null}

      {isError ? (
        <p
          role="alert"
          className="rounded-xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground"
        >
          Impossible de charger ce lot pour le moment. Réessayez plus tard.
        </p>
      ) : null}

      {!isPending && !isError && lot === null ? (
        <p className="rounded-xl border border-border px-4 py-8 text-center text-sm text-muted-foreground">
          Lot introuvable.
        </p>
      ) : null}

      {lot ? (
        <>
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <h1 className="font-mono text-2xl font-semibold tracking-tight">
                  {lot.id}
                </h1>
                <LotStatusBadge status={lot.status} />
              </div>
              <LotMetaRow lot={lot} />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                toast.info("L'export arrivera dans une prochaine version.")
              }
            >
              <Download aria-hidden />
              Exporter
            </Button>
          </header>

          <LotThresholdBanner country={lot.country} />

          <section aria-label="Courbes de mesures">
            <MeasurementsPanel
              country={lot.country}
              warehouse={lot.warehouse}
              from={lot.storedAt}
            />
          </section>
        </>
      ) : null}
    </section>
  );
}
