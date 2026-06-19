import { Bean } from 'lucide-react';

// Hero d'accueil : dégradé subtil entre tokens chart, arrondi + ombre. Le texte
// reste lisible (couche de fond translucide derrière, foreground en surimpression).
export function DashboardHero() {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[color:var(--chart-2)] to-[color:var(--chart-4)] p-6 shadow-sm ring-1 ring-border sm:p-8">
      <div className="absolute inset-0 bg-background/70" aria-hidden />
      <div className="relative space-y-2">
        <span className="inline-flex items-center gap-2 rounded-full bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border">
          <Bean className="size-3.5" aria-hidden />
          FutureKawa
        </span>
        <h1 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">
          FutureKawa
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
          Suivi des stocks de café vert — Brésil · Équateur · Colombie
        </p>
      </div>
    </section>
  );
}
