import { PackageOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

type LotsEmptyStateProps = Readonly<{
  title: string;
  description: string;
  onReset?: () => void;
}>;

export function LotsEmptyState({
  title,
  description,
  onReset,
}: LotsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <PackageOpen className="size-6" aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {onReset ? (
        <Button type="button" size="sm" variant="outline" onClick={onReset}>
          Réinitialiser les filtres
        </Button>
      ) : null}
    </div>
  );
}
