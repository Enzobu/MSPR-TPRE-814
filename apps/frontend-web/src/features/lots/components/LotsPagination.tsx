import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type LotsPaginationProps = Readonly<{
  page: number;
  totalPages: number;
  rangeLabel: string;
  onPageChange: (page: number) => void;
}>;

function buildPageList(totalPages: number): number[] {
  return Array.from({ length: totalPages }, (_, index) => index + 1);
}

export function LotsPagination({
  page,
  totalPages,
  rangeLabel,
  onPageChange,
}: LotsPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      className="flex items-center justify-between gap-3 border-t border-border px-4 py-3"
      aria-label="Pagination des lots"
    >
      <span className="text-xs text-muted-foreground">{rangeLabel}</span>
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          aria-label="Page précédente"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft aria-hidden />
        </Button>
        {buildPageList(totalPages).map((dot) => (
          <Button
            key={dot}
            type="button"
            size="icon-sm"
            variant={dot === page ? 'default' : 'outline'}
            aria-label={`Page ${dot}`}
            aria-current={dot === page ? 'page' : undefined}
            className={cn('font-mono text-xs tabular-nums')}
            onClick={() => onPageChange(dot)}
          >
            {dot}
          </Button>
        ))}
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          aria-label="Page suivante"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight aria-hidden />
        </Button>
      </div>
    </nav>
  );
}
