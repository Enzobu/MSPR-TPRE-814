import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

type LotsSearchProps = Readonly<{
  value: string;
  onChange: (value: string) => void;
}>;

// FILTRE CLIENT LOCAL : aucun paramètre de recherche texte n'existe côté hook /
// API. La saisie filtre la page courante (référence ou entrepôt) sans appel
// réseau ni état URL.
export function LotsSearch({ value, onChange }: LotsSearchProps) {
  return (
    <div className="relative w-full sm:w-[280px]">
      <Search
        className="pointer-events-none absolute top-1/2 left-2.5 size-[15px] -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        type="search"
        aria-label="Rechercher un lot par référence ou entrepôt"
        placeholder="Référence ou entrepôt…"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="pl-8"
      />
    </div>
  );
}
