import type { LotStatus } from '@futurekawa/contracts';
import { cn } from '@/lib/utils';

interface LotStatusBadgeProps {
  status: LotStatus;
}

interface StatusConfig {
  label: string;
  className: string;
}

const STATUS_CONFIG: Record<LotStatus, StatusConfig> = {
  CONFORME: {
    label: 'Conforme',
    className: 'bg-status-conforme text-status-conforme-foreground',
  },
  EN_ALERTE: {
    label: 'En alerte',
    className: 'bg-status-alerte text-status-alerte-foreground',
  },
  PERIME: {
    label: 'Périmé',
    className: 'bg-status-perime text-status-perime-foreground',
  },
};

export function LotStatusBadge({ status }: LotStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}
