import { ChevronRight, Package } from 'lucide-react';
import { Link } from 'react-router';
import type { Alert } from '@futurekawa/contracts';

type AlertLotCardProps = Readonly<{
  alert: Alert;
}>;

interface MetaItem {
  key: string;
  value: string;
}

function buildMeta(alert: Alert): MetaItem[] {
  const meta: MetaItem[] = [{ key: 'Pays', value: alert.country }];
  if (alert.warehouse) {
    meta.push({ key: 'Entrepôt', value: alert.warehouse });
  }
  return meta;
}

export function AlertLotCard({ alert }: AlertLotCardProps) {
  const meta = buildMeta(alert);

  return (
    <div className="rounded-xl border bg-card p-[18px]">
      <p className="mb-3.5 text-sm font-semibold">Lot lié</p>

      {alert.lotId ? (
        <Link
          to={`/lots/${alert.lotId}`}
          className="mb-3.5 flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex size-[34px] shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
            <Package className="size-4" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-mono text-sm font-semibold">
              {alert.lotId}
            </span>
            <span className="block text-xs text-muted-foreground">
              Voir le détail du lot
            </span>
          </span>
          <ChevronRight
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
        </Link>
      ) : (
        <p className="mb-3.5 rounded-lg border bg-card p-3 text-sm text-muted-foreground">
          Aucun lot directement rattaché à cette alerte.
        </p>
      )}

      <dl className="flex flex-col gap-2.5">
        {meta.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between gap-2"
          >
            <dt className="text-[12.5px] text-muted-foreground">{item.key}</dt>
            <dd className="text-[12.5px] font-medium">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
