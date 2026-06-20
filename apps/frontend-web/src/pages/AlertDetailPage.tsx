import { ChevronLeft } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertActionCard } from '@/features/alerts/components/AlertActionCard';
import { AlertChartCard } from '@/features/alerts/components/AlertChartCard';
import { AlertDetailHeader } from '@/features/alerts/components/AlertDetailHeader';
import { AlertLotCard } from '@/features/alerts/components/AlertLotCard';
import { useAlert } from '@/features/alerts/hooks/useAlert';

export default function AlertDetailPage() {
  const { id = '' } = useParams();
  const { data: alert, isPending, isError } = useAlert(id);

  let detail: React.ReactNode;
  if (isPending) {
    detail = <Skeleton className="h-64 w-full rounded-xl" />;
  } else if (isError) {
    detail = (
      <p
        role="alert"
        className="rounded-xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground"
      >
        Impossible de charger cette alerte pour le moment. Réessayez plus tard.
      </p>
    );
  } else if (alert === null) {
    detail = (
      <p className="rounded-xl border border-border px-4 py-8 text-center text-sm text-muted-foreground">
        Alerte introuvable.
      </p>
    );
  } else {
    detail = (
      <div className="grid gap-3.5 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-3.5">
          <AlertDetailHeader alert={alert} />
          <AlertChartCard alert={alert} />
        </div>
        <div className="flex flex-col gap-3.5">
          <AlertActionCard alert={alert} />
          <AlertLotCard alert={alert} />
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <Button asChild size="sm" variant="ghost" className="-ml-2">
        <Link to="/alerts">
          <ChevronLeft aria-hidden />
          Toutes les alertes
        </Link>
      </Button>

      {detail}
    </section>
  );
}
