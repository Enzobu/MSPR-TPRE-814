import { COUNTRY_CODES, type CountryCode } from '@futurekawa/contracts';
import { Button } from '@/components/ui/button';

interface CountryFilterProps {
  value?: CountryCode;
  onChange: (country?: CountryCode) => void;
}

export function CountryFilter({ value, onChange }: CountryFilterProps) {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Filtrer par pays"
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
      {COUNTRY_CODES.map((code) => (
        <Button
          key={code}
          type="button"
          size="sm"
          variant={value === code ? 'default' : 'outline'}
          aria-pressed={value === code}
          onClick={() => onChange(code)}
        >
          {code}
        </Button>
      ))}
    </div>
  );
}
