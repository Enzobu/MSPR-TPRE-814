import { ALERT_TYPES, type AlertType } from '@futurekawa/contracts';
import { Button } from '@/components/ui/button';

interface AlertTypeFilterProps {
  value?: AlertType;
  onChange: (type?: AlertType) => void;
}

const SHORT_LABELS: Record<AlertType, string> = {
  TEMPERATURE_OUT_OF_RANGE: 'Température',
  HUMIDITY_OUT_OF_RANGE: 'Humidité',
  LOT_EXPIRED: 'Péremption',
};

export function AlertTypeFilter({ value, onChange }: AlertTypeFilterProps) {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Filtrer par type"
    >
      <Button
        type="button"
        size="sm"
        variant={value === undefined ? 'default' : 'outline'}
        aria-pressed={value === undefined}
        onClick={() => onChange(undefined)}
      >
        Tous
      </Button>
      {ALERT_TYPES.map((type) => (
        <Button
          key={type}
          type="button"
          size="sm"
          variant={value === type ? 'default' : 'outline'}
          aria-pressed={value === type}
          onClick={() => onChange(type)}
        >
          {SHORT_LABELS[type]}
        </Button>
      ))}
    </div>
  );
}
