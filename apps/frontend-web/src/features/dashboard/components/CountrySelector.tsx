import { COUNTRY_CODES, type CountryCode } from '@futurekawa/contracts';
import { Button } from '@/components/ui/button';
import { COUNTRY_LABELS } from '@/features/dashboard/lib/country';

type CountrySelectorProps = Readonly<{
  value?: CountryCode;
  onChange: (country?: CountryCode) => void;
}>;

// Sélecteur pays du dashboard : "Tous" (agrégation) + une option par pays.
// Mobile-first (flex-wrap), accessibilité via aria-pressed.
export function CountrySelector({ value, onChange }: CountrySelectorProps) {
  return (
    <fieldset className="flex flex-wrap gap-2 border-0 p-0">
      <legend className="sr-only">Filtrer le dashboard par pays</legend>
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
          {COUNTRY_LABELS[code]}
        </Button>
      ))}
    </fieldset>
  );
}
