import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type FacetComboboxProps = Readonly<{
  label: string;
  allLabel: string;
  value?: string;
  options: string[];
  onChange: (value?: string) => void;
  disabled?: boolean;
}>;

// Sélecteur de facette (exploitation / entrepôt) : bouton + liste filtrable
// (Popover + Command). Les options viennent des facettes serveur ; la sélection
// déclenche un filtrage SERVEUR via `onChange` (état porté par l'URL en amont).
export function FacetCombobox({
  label,
  allLabel,
  value,
  options,
  onChange,
  disabled = false,
}: FacetComboboxProps) {
  const [open, setOpen] = useState(false);

  const select = (next?: string): void => {
    onChange(next);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          role="combobox"
          aria-expanded={open}
          aria-label={label}
          disabled={disabled}
          className="justify-between gap-2 font-normal"
        >
          <span className={cn('truncate', !value && 'text-muted-foreground')}>
            {value ?? label}
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Rechercher ${label.toLowerCase()}…`} />
          <CommandList>
            <CommandEmpty>Aucun résultat.</CommandEmpty>
            <CommandGroup>
              <CommandItem value={allLabel} onSelect={() => select(undefined)}>
                <Check
                  className={cn('mr-2 size-4', value ? 'opacity-0' : 'opacity-100')}
                  aria-hidden
                />
                {allLabel}
              </CommandItem>
              {options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => select(option)}
                >
                  <Check
                    className={cn(
                      'mr-2 size-4',
                      value === option ? 'opacity-100' : 'opacity-0',
                    )}
                    aria-hidden
                  />
                  <span className="truncate">{option}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
