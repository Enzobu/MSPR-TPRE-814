import { Skeleton } from '@/components/ui/skeleton';

const PLACEHOLDER_ROWS = Array.from({ length: 6 }, (_, index) => index);

export function LotsListSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card" aria-hidden>
      <Skeleton className="h-11 w-full rounded-none rounded-t-xl" />
      <div className="divide-y divide-border/50">
        {PLACEHOLDER_ROWS.map((row) => (
          <div key={row} className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
