import type { LotStatus } from '@futurekawa/contracts';
import { LOT_STATUS_CONFIG } from '@/features/lots/lib/lotStatus';
import { cn } from '@/lib/utils';

type LotStatusBadgeProps = Readonly<{
  status: LotStatus;
  className?: string;
}>;

export function LotStatusBadge({ status, className }: LotStatusBadgeProps) {
  const config = LOT_STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        config.className,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {config.label}
    </span>
  );
}
