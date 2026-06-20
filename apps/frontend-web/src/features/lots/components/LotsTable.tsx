import { Link } from 'react-router';
import type { Lot } from '@futurekawa/contracts';
import { LotStatusBadge } from '@/features/lots/components/LotStatusBadge';
import { formatStoredAt } from '@/features/lots/lib/format';

type LotsTableProps = Readonly<{
  lots: Lot[];
}>;

export function LotsTable({ lots }: LotsTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">Liste des lots de café vert</caption>
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th scope="col" className="px-4 py-3 font-medium">
              Lot
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Pays
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Exploitation
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Entrepôt
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Stocké le
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Statut
            </th>
          </tr>
        </thead>
        <tbody>
          {lots.map((lot) => (
            <tr
              key={lot.id}
              className="border-b border-border last:border-0 hover:bg-accent/50"
            >
              <td className="px-4 py-3 font-medium">
                <Link
                  to={`/lots/${lot.id}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {lot.id}
                </Link>
              </td>
              <td className="px-4 py-3">{lot.country}</td>
              <td className="px-4 py-3">{lot.farm}</td>
              <td className="px-4 py-3">{lot.warehouse}</td>
              <td className="px-4 py-3 tabular-nums">
                {formatStoredAt(lot.storedAt)}
              </td>
              <td className="px-4 py-3">
                <LotStatusBadge status={lot.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
