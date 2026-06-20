import { useNavigate } from 'react-router';
import type { Lot } from '@futurekawa/contracts';
import { LotStatusBadge } from '@/features/lots/components/LotStatusBadge';
import {
  computeExpiry,
  expiryColorClass,
  formatStoredAt,
} from '@/features/lots/lib/format';
import { cn } from '@/lib/utils';

type LotsTableProps = Readonly<{
  lots: Lot[];
}>;

const COLUMNS = [
  'Statut',
  'Référence',
  'Pays',
  'Entrepôt',
  'Stocké le',
  'Péremption',
  'Dernière mesure',
] as const;

// Le type `Lot` (contracts) ne porte pas la dernière mesure : on affiche un
// placeholder neutre plutôt que d'inventer une valeur.
const NO_MEASUREMENT = '—';

export function LotsTable({ lots }: LotsTableProps) {
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[940px] border-collapse text-sm">
        <caption className="sr-only">Liste des lots de café vert</caption>
        <thead>
          <tr className="bg-muted text-left">
            {COLUMNS.map((label) => (
              <th
                key={label}
                scope="col"
                className="px-4 py-3 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lots.map((lot) => {
            const expiry = computeExpiry(lot.storedAt);
            return (
              <tr
                key={lot.id}
                onClick={() => navigate(`/lots/${lot.id}`)}
                className="cursor-pointer border-b border-border/50 transition-colors last:border-0 hover:bg-accent"
              >
                <td className="px-4 py-3">
                  <LotStatusBadge status={lot.status} />
                </td>
                <td className="px-4 py-3 font-mono text-[13px] font-semibold">
                  {lot.id}
                </td>
                <td className="px-4 py-3 font-mono text-xs font-semibold text-muted-foreground">
                  {lot.country}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {lot.warehouse}
                </td>
                <td className="px-4 py-3 font-mono text-xs tabular-nums">
                  {formatStoredAt(lot.storedAt)}
                </td>
                <td
                  className={cn(
                    'px-4 py-3 text-xs tabular-nums',
                    expiry ? expiryColorClass(expiry.proximity) : undefined,
                  )}
                >
                  {expiry ? expiry.label : NO_MEASUREMENT}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground tabular-nums">
                  {NO_MEASUREMENT}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
