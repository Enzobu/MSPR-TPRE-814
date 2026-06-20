// Panneau marketing de la page de connexion (colonne droite). Visuel statique :
// chiffres d'illustration produit, citation, périmètre pays. Masqué en mobile.
const BRAND_STATS: ReadonlyArray<{ value: string; label: string }> = [
  { value: '3', label: 'Pays surveillés' },
  { value: '24/7', label: 'Mesures IoT' },
  { value: '300j', label: 'Suivi péremption' },
];

// Texture diagonale du panneau : motif décoratif inline toléré ici (exception
// design login), construit sur la teinte primary-foreground via color-mix.
const DIAGONAL_TEXTURE =
  'repeating-linear-gradient(135deg, transparent, transparent 22px, color-mix(in oklch, var(--primary-foreground) 7%, transparent) 22px, color-mix(in oklch, var(--primary-foreground) 7%, transparent) 23px)';

export function LoginBrandPanel() {
  return (
    <div className="relative hidden flex-col justify-end overflow-hidden bg-primary p-11 lg:flex">
      <div
        className="absolute inset-0"
        style={{ background: DIAGONAL_TEXTURE }}
        aria-hidden
      />
      <div className="relative flex max-w-md flex-col gap-[18px]">
        <div className="flex gap-2.5">
          {BRAND_STATS.map((stat) => (
            <div
              key={stat.label}
              className="flex-1 rounded-[10px] border border-primary-foreground/20 bg-primary-foreground/10 p-3.5"
            >
              <div className="text-[22px] font-semibold tracking-tight text-primary-foreground tabular-nums">
                {stat.value}
              </div>
              <div className="mt-0.5 text-[11.5px] text-primary-foreground/80">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        <p className="text-balance text-base font-medium leading-relaxed text-primary-foreground">
          « Du grain à l'expédition, chaque lot tracé, chaque seuil surveillé. »
        </p>
        <span className="text-[12.5px] text-primary-foreground/75">
          Brésil · Équateur · Colombie — surveillance IoT temps réel
        </span>
      </div>
    </div>
  );
}
