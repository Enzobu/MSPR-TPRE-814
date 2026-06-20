import { Skeleton } from '@/components/ui/skeleton';

const PLACEHOLDER_ROWS = Array.from({ length: 6 }, (_, index) => index);

export function AlertsListSkeleton() {
  return (
    <div className="space-y-2" aria-hidden>
      {PLACEHOLDER_ROWS.map((row) => (
        <Skeleton key={row} className="h-12 w-full" />
      ))}
    </div>
  );
}
