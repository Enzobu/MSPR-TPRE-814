import { cn } from '@/lib/utils';

export interface SegmentedChipOption<TValue extends string> {
  value: TValue;
  label: string;
  // Classe Tailwind du dot coloré (token-only). Omise = pas de dot.
  dotClassName?: string;
}

type SegmentedChipsProps<TValue extends string> = Readonly<{
  options: SegmentedChipOption<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  legend: string;
}>;

// Segmented chips façon Nova : conteneur teinté `bg-muted`, chip actif surélevé
// (`bg-card shadow-sm`). Rendu en `<fieldset>`/`<button>` pour l'accessibilité
// (pas de `<div onClick>`).
export function SegmentedChips<TValue extends string>({
  options,
  value,
  onChange,
  legend,
}: SegmentedChipsProps<TValue>) {
  return (
    <fieldset className="m-0 inline-flex gap-0.5 rounded-lg border-0 bg-muted p-[3px]">
      <legend className="sr-only">{legend}</legend>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex items-center rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors',
              active
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {option.dotClassName ? (
              <span
                className={cn(
                  'mr-1.5 inline-block size-[7px] rounded-full',
                  option.dotClassName,
                )}
                aria-hidden
              />
            ) : null}
            {option.label}
          </button>
        );
      })}
    </fieldset>
  );
}
