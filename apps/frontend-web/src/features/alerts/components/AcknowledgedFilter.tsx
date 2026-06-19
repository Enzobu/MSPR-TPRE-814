import { Button } from '@/components/ui/button';

interface AcknowledgedFilterProps {
  value?: boolean;
  onChange: (acknowledged?: boolean) => void;
}

export function AcknowledgedFilter({ value, onChange }: AcknowledgedFilterProps) {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Filtrer par acquittement"
    >
      <Button
        type="button"
        size="sm"
        variant={value === undefined ? 'default' : 'outline'}
        aria-pressed={value === undefined}
        onClick={() => onChange(undefined)}
      >
        Toutes
      </Button>
      <Button
        type="button"
        size="sm"
        variant={value === false ? 'default' : 'outline'}
        aria-pressed={value === false}
        onClick={() => onChange(false)}
      >
        Non acquittées
      </Button>
      <Button
        type="button"
        size="sm"
        variant={value === true ? 'default' : 'outline'}
        aria-pressed={value === true}
        onClick={() => onChange(true)}
      >
        Acquittées
      </Button>
    </div>
  );
}
