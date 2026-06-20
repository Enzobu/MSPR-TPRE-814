import { Skeleton } from '@/components/ui/skeleton';

const PLACEHOLDER_ROWS = Array.from({ length: 6 }, (_, index) => index);

export function AlertsListSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-xl border bg-card"
      aria-hidden
    >
      <div className="border-b border-border bg-muted px-[18px] py-[11px]">
        <Skeleton className="h-3 w-24" />
      </div>
      {PLACEHOLDER_ROWS.map((row) => (
        <div
          key={row}
          className="flex items-center gap-4 border-b border-border/50 px-[18px] py-3 last:border-0"
        >
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  );
}
