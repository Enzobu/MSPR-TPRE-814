import type { CountryCode } from '@futurekawa/contracts';
import { Button } from '@/components/ui/button';
import { useAcknowledgeAlert } from '@/features/alerts/hooks/useAcknowledgeAlert';

type AcknowledgeButtonProps = Readonly<{
  id: string;
  country: CountryCode;
  acknowledged: boolean;
}>;

export function AcknowledgeButton({
  id,
  country,
  acknowledged,
}: AcknowledgeButtonProps) {
  const { mutate, isPending } = useAcknowledgeAlert();

  if (acknowledged) {
    return (
      <Button type="button" size="sm" variant="outline" disabled>
        Acquittée
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      disabled={isPending}
      onClick={() => mutate({ id, country })}
    >
      {isPending ? 'Acquittement…' : 'Acquitter'}
    </Button>
  );
}
