import { Link, useNavigate } from 'react-router';
import type { Alert } from '@futurekawa/contracts';
import { AcknowledgeButton } from '@/features/alerts/components/AcknowledgeButton';
import { SeverityPill } from '@/features/alerts/components/SeverityPill';
import { alertSeverity } from '@/features/alerts/lib/severity';
import { formatAgo } from '@/features/alerts/lib/format';

type AlertsTableProps = Readonly<{
  alerts: Alert[];
}>;

const HEADERS = ['Sévérité', 'Lot', 'Type', 'Déclenchée', 'Action'] as const;

function AlertRow({ alert }: Readonly<{ alert: Alert }>) {
  const navigate = useNavigate();
  const { Icon } = alertSeverity(alert.type);

  // La ligne entière est cliquable (confort souris), mais l'accessibilité
  // clavier repose sur le lien explicite porté par le message.
  return (
    <tr
      className="cursor-pointer border-b border-border/50 last:border-0 hover:bg-accent"
      onClick={() => navigate(`/alerts/${alert.id}`)}
    >
      <td className="px-[18px] py-3">
        <SeverityPill type={alert.type} />
      </td>
      <td className="px-[18px] py-3 font-mono text-[13px] font-semibold">
        {alert.lotId ?? '—'}
      </td>
      <td className="max-w-0 px-[18px] py-3">
        <Link
          to={`/alerts/${alert.id}`}
          onClick={(event) => event.stopPropagation()}
          className="flex min-w-0 items-center gap-2 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate text-[13px]">{alert.message}</span>
        </Link>
      </td>
      <td className="px-[18px] py-3 text-[12.5px] text-muted-foreground">
        {formatAgo(alert.triggeredAt)}
      </td>
      <td className="px-[18px] py-3">
        {/* L'acquittement ne doit pas déclencher la navigation de ligne. */}
        <div onClick={(event) => event.stopPropagation()}>
          <AcknowledgeButton
            id={alert.id}
            country={alert.country}
            acknowledged={alert.acknowledged}
          />
        </div>
      </td>
    </tr>
  );
}

export function AlertsTable({ alerts }: AlertsTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <caption className="sr-only">Liste des alertes</caption>
        <thead>
          <tr className="border-b border-border bg-muted">
            {HEADERS.map((header) => (
              <th
                key={header}
                scope="col"
                className="px-[18px] py-[11px] text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert) => (
            <AlertRow key={alert.id} alert={alert} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
