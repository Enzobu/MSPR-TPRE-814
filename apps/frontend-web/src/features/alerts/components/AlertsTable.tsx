import { Link } from 'react-router';
import { Check, Minus } from 'lucide-react';
import type { Alert } from '@futurekawa/contracts';
import { AlertTypeBadge } from '@/features/alerts/components/AlertTypeBadge';
import { formatTriggeredAt } from '@/features/alerts/lib/format';

interface AlertsTableProps {
  alerts: Alert[];
}

function targetLabel(alert: Alert): string {
  if (alert.lotId) {
    return `${alert.warehouse ?? '—'} · ${alert.lotId}`;
  }
  return alert.warehouse ?? '—';
}

export function AlertsTable({ alerts }: AlertsTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">Liste des alertes</caption>
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th scope="col" className="px-4 py-3 font-medium">
              Type
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Message
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Entrepôt / Lot
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Déclenchée le
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Acquittée
            </th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert) => (
            <tr
              key={alert.id}
              className="border-b border-border last:border-0 hover:bg-accent/50"
            >
              <td className="px-4 py-3">
                <Link
                  to={`/alerts/${alert.id}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  <AlertTypeBadge type={alert.type} />
                </Link>
              </td>
              <td className="px-4 py-3">{alert.message}</td>
              <td className="px-4 py-3">{targetLabel(alert)}</td>
              <td className="px-4 py-3 tabular-nums">
                {formatTriggeredAt(alert.triggeredAt)}
              </td>
              <td className="px-4 py-3">
                {alert.acknowledged ? (
                  <Check
                    className="size-4 text-status-conforme"
                    aria-label="Acquittée"
                  />
                ) : (
                  <Minus
                    className="size-4 text-muted-foreground"
                    aria-label="Non acquittée"
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
