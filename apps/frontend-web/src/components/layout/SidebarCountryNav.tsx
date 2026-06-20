import { Check } from 'lucide-react';
import { COUNTRY_CODES, type CountryCode } from '@futurekawa/contracts';
import { cn } from '@/lib/utils';
import { COUNTRY_LABELS } from '@/features/dashboard/lib/country';
import { useDashboardCountry } from '@/features/dashboard/hooks/useDashboardCountry';

const ITEM_BASE =
  'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const ITEM_ACTIVE = 'bg-accent font-semibold text-foreground';
const ITEM_INACTIVE = 'text-muted-foreground';

const CHIP =
  'inline-flex w-7 shrink-0 justify-center rounded-md bg-muted px-1 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground';

type CountryEntry = Readonly<{
  code?: CountryCode;
  chip: string;
  name: string;
}>;

const ENTRIES: readonly CountryEntry[] = [
  { code: undefined, chip: 'ALL', name: 'Tous les pays' },
  ...COUNTRY_CODES.map((code) => ({
    code,
    chip: code,
    name: COUNTRY_LABELS[code],
  })),
];

type SidebarCountryNavProps = Readonly<{
  onNavigate?: () => void;
}>;

// Section "Pays" de la sidebar. Branchée sur l'état pays porté par l'URL
// (useDashboardCountry) — pas de source d'état réinventée ici.
export function SidebarCountryNav({ onNavigate }: SidebarCountryNavProps) {
  const { country, setCountry } = useDashboardCountry();

  const handleSelect = (next?: CountryCode): void => {
    setCountry(next);
    onNavigate?.();
  };

  return (
    <div className="flex flex-col gap-0.5">
      {ENTRIES.map((entry) => {
        const isActive = country === entry.code;
        return (
          <button
            key={entry.chip}
            type="button"
            aria-pressed={isActive}
            onClick={() => handleSelect(entry.code)}
            className={cn(ITEM_BASE, isActive ? ITEM_ACTIVE : ITEM_INACTIVE)}
          >
            <span className={CHIP}>{entry.chip}</span>
            <span className="flex-1 text-left">{entry.name}</span>
            {isActive ? (
              <Check className="size-4 shrink-0 text-primary" aria-hidden />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
