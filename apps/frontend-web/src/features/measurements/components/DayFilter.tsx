import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { fr } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  dateToDay,
  dayToDate,
  shiftDay,
} from '@/features/measurements/lib/day-range';
import { cn } from '@/lib/utils';

type DayFilterProps = Readonly<{
  day?: string;
  // Borne haute de sélection (YYYY-MM-DD) : pas de jour futur.
  max: string;
  onChange: (day?: string) => void;
}>;

const CUSTOM_DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
});

const CHIP_BASE =
  'rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const CHIP_ACTIVE = 'bg-card text-foreground shadow-sm';
const CHIP_INACTIVE = 'text-muted-foreground hover:text-foreground';

function formatCustom(day: string): string {
  return CUSTOM_DATE_FORMATTER.format(dayToDate(day));
}

type ChipProps = Readonly<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}>;

function Chip({ active, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(CHIP_BASE, active ? CHIP_ACTIVE : CHIP_INACTIVE)}
    >
      {children}
    </button>
  );
}

// Filtre « jour » de l'historique. Pills segmentées (même langage visuel que
// SegmentedChips) : raccourcis Tout / Aujourd'hui / Hier + un déclencheur qui
// ouvre le date-picker shadcn (Popover + Calendar react-day-picker) pour une
// date arbitraire.
export function DayFilter({ day, max, onChange }: DayFilterProps) {
  const [open, setOpen] = useState(false);

  const today = max;
  const yesterday = shiftDay(max, -1);
  const isPreset = day === undefined || day === today || day === yesterday;
  const customActive = day !== undefined && !isPreset;

  const handleSelect = (date?: Date): void => {
    if (!date) return;
    onChange(dateToDay(date));
    setOpen(false);
  };

  return (
    <fieldset className="border-0 p-0">
      <legend className="sr-only">Filtrer par jour</legend>
      <div className="inline-flex items-center gap-0.5 rounded-lg bg-muted p-[3px]">
        <Chip active={day === undefined} onClick={() => onChange(undefined)}>
          Tout
        </Chip>
        <Chip active={day === today} onClick={() => onChange(today)}>
          Aujourd'hui
        </Chip>
        <Chip active={day === yesterday} onClick={() => onChange(yesterday)}>
          Hier
        </Chip>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-pressed={customActive}
              className={cn(
                CHIP_BASE,
                'flex items-center gap-1.5',
                customActive ? CHIP_ACTIVE : CHIP_INACTIVE,
              )}
            >
              <CalendarDays className="size-3.5" aria-hidden />
              {customActive && day ? formatCustom(day) : 'Autre jour'}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              locale={fr}
              autoFocus
              selected={day ? dayToDate(day) : undefined}
              defaultMonth={dayToDate(day ?? max)}
              disabled={{ after: dayToDate(max) }}
              onSelect={handleSelect}
            />
          </PopoverContent>
        </Popover>
      </div>
    </fieldset>
  );
}
