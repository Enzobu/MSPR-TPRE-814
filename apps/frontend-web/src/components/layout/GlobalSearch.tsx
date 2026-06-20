import { useEffect, useState } from 'react';
import { LayoutDashboard, Package, Search, TriangleAlert } from 'lucide-react';
import { useNavigate } from 'react-router';
import type { Lot } from '@futurekawa/contracts';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { COUNTRY_LABELS } from '@/features/dashboard/lib/country';
import { LOT_STATUS_CONFIG } from '@/features/lots/lib/lotStatus';
import { useLots } from '@/features/lots/hooks/useLots';
import { DEFAULT_SORT } from '@/features/lots/hooks/useLotFilters';
import { cn } from '@/lib/utils';

// Page de premier rang adressable depuis la palette.
const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Lots', path: '/lots', icon: Package },
  { label: 'Alertes', path: '/alerts', icon: TriangleAlert },
] as const;

// La palette charge un échantillon large : cmdk filtre côté client sur les
// items rendus, on ne paramètre donc pas la recherche côté API.
const SEARCH_PAGE = 1;

// Palette de commande globale (⌘K / Ctrl+K) : navigation rapide + recherche de
// lots. Remplace l'ancien champ de recherche décoratif du header.
export function GlobalSearch() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((previous) => !previous);
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  function go(path: string) {
    setOpen(false);
    navigate(path);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir la recherche"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:w-72 md:justify-start md:gap-2 md:px-3 lg:w-80"
      >
        <Search className="size-[15px] shrink-0" aria-hidden />
        <span className="hidden min-w-0 flex-1 truncate text-left text-sm md:inline">
          Rechercher un lot, un entrepôt…
        </span>
        <kbd
          aria-hidden
          className="hidden shrink-0 items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[11px] text-muted-foreground md:inline-flex"
        >
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Rechercher un lot, un entrepôt, une page…" />
        <CommandList>
          <CommandEmpty>Aucun résultat.</CommandEmpty>
          <CommandGroup heading="Navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.path}
                  value={item.label}
                  onSelect={() => go(item.path)}
                >
                  <Icon aria-hidden />
                  {item.label}
                </CommandItem>
              );
            })}
          </CommandGroup>
          <LotsCommandGroup onSelect={go} />
        </CommandList>
      </CommandDialog>
    </>
  );
}

type LotsCommandGroupProps = Readonly<{
  onSelect: (path: string) => void;
}>;

function LotsCommandGroup({ onSelect }: LotsCommandGroupProps) {
  const { data, isLoading } = useLots({
    page: SEARCH_PAGE,
    sort: DEFAULT_SORT,
  });

  if (isLoading) {
    return (
      <CommandGroup heading="Lots">
        <CommandItem disabled>Chargement…</CommandItem>
      </CommandGroup>
    );
  }

  const lots = data?.data ?? [];
  if (lots.length === 0) {
    return null;
  }

  return (
    <CommandGroup heading="Lots">
      {lots.map((lot) => (
        <LotCommandItem key={lot.id} lot={lot} onSelect={onSelect} />
      ))}
    </CommandGroup>
  );
}

type LotCommandItemProps = Readonly<{
  lot: Lot;
  onSelect: (path: string) => void;
}>;

function LotCommandItem({ lot, onSelect }: LotCommandItemProps) {
  const status = LOT_STATUS_CONFIG[lot.status];
  return (
    <CommandItem
      value={`${lot.id} ${lot.warehouse} ${lot.country}`}
      onSelect={() => onSelect(`/lots/${lot.id}`)}
    >
      <span
        aria-hidden
        className={cn('size-2 shrink-0 rounded-full', status.dotClassName)}
      />
      <span className="font-mono text-sm">{lot.id}</span>
      <span className="truncate text-sm text-muted-foreground">
        {lot.warehouse} · {COUNTRY_LABELS[lot.country]}
      </span>
    </CommandItem>
  );
}
