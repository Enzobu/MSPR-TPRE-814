import { Check } from 'lucide-react';
import type { CountryCode } from '@futurekawa/contracts';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAcknowledgeAlert } from '@/features/alerts/hooks/useAcknowledgeAlert';

type AcknowledgeButtonProps = Readonly<{
  id: string;
  country: CountryCode;
  acknowledged: boolean;
  // 'outline' = action inline (table) ; 'primary' = bouton plein largeur (détail).
  variant?: 'outline' | 'primary';
  fullWidth?: boolean;
}>;

export function AcknowledgeButton({
  id,
  country,
  acknowledged,
  variant = 'outline',
  fullWidth = false,
}: AcknowledgeButtonProps) {
  const { mutate, isPending } = useAcknowledgeAlert();

  if (acknowledged) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Check className="size-3.5 text-status-conforme" aria-hidden />
        Acquittée
      </span>
    );
  }

  return (
    <Button
      type="button"
      size={variant === 'primary' ? 'default' : 'sm'}
      variant={variant === 'primary' ? 'default' : 'outline'}
      disabled={isPending}
      className={cn(fullWidth && 'w-full')}
      onClick={() => mutate({ id, country })}
    >
      {variant === 'primary' ? (
        <Check className="size-4" aria-hidden />
      ) : null}
      {isPending ? 'Acquittement…' : 'Acquitter'}
      {variant === 'primary' ? " l'alerte" : ''}
    </Button>
  );
}
