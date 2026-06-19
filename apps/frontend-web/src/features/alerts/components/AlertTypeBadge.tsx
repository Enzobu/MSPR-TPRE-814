import type { AlertType } from '@futurekawa/contracts';
import { cn } from '@/lib/utils';

type AlertTypeBadgeProps = Readonly<{
  type: AlertType;
}>;

interface TypeConfig {
  label: string;
  className: string;
}

const TYPE_CONFIG: Record<AlertType, TypeConfig> = {
  TEMPERATURE_OUT_OF_RANGE: {
    label: 'Température hors plage',
    className: 'bg-status-alerte text-status-alerte-foreground',
  },
  HUMIDITY_OUT_OF_RANGE: {
    label: 'Humidité hors plage',
    className: 'bg-status-alerte text-status-alerte-foreground',
  },
  LOT_EXPIRED: {
    label: 'Lot périmé',
    className: 'bg-status-perime text-status-perime-foreground',
  },
};

export function AlertTypeBadge({ type }: AlertTypeBadgeProps) {
  const config = TYPE_CONFIG[type];
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
