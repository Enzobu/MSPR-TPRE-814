import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LotStatusBadge } from '@/features/lots/components/LotStatusBadge';
import { useLot } from '@/features/lots/hooks/useLot';
import { formatStoredAt } from '@/features/lots/lib/format';
import { MeasurementsPanel } from '@/features/measurements/components/MeasurementsPanel';

export default function LotDetailPage() {
  const { id = '' } = useParams();
  const { data: lot, isPending, isError } = useLot(id);

  let detail: React.ReactNode;
  if (isPending) {
    detail = <Skeleton className="h-48 w-full" />;
  } else if (isError) {
    detail = (
      <p
        role="alert"
        className="rounded-lg border border-border bg-muted px-4 py-3 text-sm text-muted-foreground"
      >
        Impossible de charger ce lot pour le moment. Réessayez plus tard.
      </p>
    );
  } else if (lot === null) {
    detail = (
      <p className="rounded-lg border border-border px-4 py-8 text-center text-sm text-muted-foreground">
        Lot introuvable.
      </p>
    );
  } else {
    detail = (
      <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-lg">Lot {lot.id}</CardTitle>
            <LotStatusBadge status={lot.status} />
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-muted-foreground">Pays</dt>
              <dd>{lot.country}</dd>
              <dt className="text-muted-foreground">Exploitation</dt>
              <dd>{lot.farm}</dd>
              <dt className="text-muted-foreground">Entrepôt</dt>
              <dd>{lot.warehouse}</dd>
              <dt className="text-muted-foreground">Stocké le</dt>
              <dd className="tabular-nums">{formatStoredAt(lot.storedAt)}</dd>
            </dl>
          </CardContent>
        </Card>
    );
  }

  const showMeasurements =
    !isPending && !isError && lot !== null && lot !== undefined;

  return (
    <section className="space-y-4">
      <Button asChild size="sm" variant="ghost">
        <Link to="/lots">
          <ArrowLeft aria-hidden />
          Retour aux lots
        </Link>
      </Button>

      {detail}

      {showMeasurements ? (
        <section className="space-y-3" aria-labelledby="measurements-heading">
          <h2 id="measurements-heading" className="text-base font-semibold">
            Courbes T° et humidité
          </h2>
          <MeasurementsPanel
            country={lot.country}
            warehouse={lot.warehouse}
            from={lot.storedAt}
          />
        </section>
      ) : null}
    </section>
  );
}
