import { Check } from 'lucide-react';

type AlertsEmptyStateProps = Readonly<{
  // Vrai si un filtre est actif : le message s'adapte (rien sous ce filtre vs
  // aucune alerte du tout).
  filtered: boolean;
}>;

export function AlertsEmptyState({ filtered }: AlertsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border bg-card px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl bg-status-conforme/15 text-status-conforme">
        <Check className="size-6" aria-hidden />
      </span>
      <div>
        <p className="text-sm font-semibold">Rien à signaler ici</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {filtered
            ? 'Aucune alerte ne correspond à ce filtre.'
            : 'Aucune alerte active sur le périmètre courant.'}
        </p>
      </div>
    </div>
  );
}
