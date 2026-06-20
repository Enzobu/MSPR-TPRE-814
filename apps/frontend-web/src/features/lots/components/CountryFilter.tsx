import { COUNTRY_CODES, type CountryCode } from '@futurekawa/contracts';
import { Button } from '@/components/ui/button';

type CountryFilterProps = Readonly<{
  value?: CountryCode;
  onChange: (country?: CountryCode) => void;
}>;

export function CountryFilter({ value, onChange }: CountryFilterProps) {
  return (
    <fieldset className="flex flex-wrap gap-2 border-0 p-0">
      <legend className="sr-only">Filtrer par pays</legend>
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
    </fieldset>
  );
}
