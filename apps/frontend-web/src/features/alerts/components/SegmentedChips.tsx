import { cn } from '@/lib/utils';

export interface SegmentedOption<T> {
  value: T;
  label: string;
}

type SegmentedChipsProps<T> = Readonly<{
  legend: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  // Compare deux valeurs (utile pour les unions undefined/boolean/string).
  isSelected: (option: T, current: T) => boolean;
}>;

// Groupe de chips segmentées (pattern design : conteneur teinté `bg-muted`, chip
// actif `bg-card shadow-sm`). Boutons natifs accessibles (aria-pressed).
export function SegmentedChips<T>({
  legend,
  options,
  value,
  onChange,
  isSelected,
}: SegmentedChipsProps<T>) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="sr-only">{legend}</legend>
      <div className="inline-flex gap-0.5 rounded-lg bg-muted p-[3px]">
        {options.map((option) => {
          const active = isSelected(option.value, value);
          return (
            <button
              key={option.label}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className={cn(
                'rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
