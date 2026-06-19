# frontend-web

Interface Web du siège + équipes terrain. SPA React consommant `backend-central`.

Contexte global : voir le `CLAUDE.md` racine.

## Responsabilités (extrait CDC §III.3)

1. Sélection pays/exploitation/entrepôt.
2. Liste des lots **triés par date de stockage** (FIFO).
3. Détail d'un lot avec **courbes T° et humidité** depuis son entrée en stockage.
4. Accès aux **alertes** et aux statuts des lots.

## Stack

Vite 8 + **React 19** + **TypeScript 6** + **Tailwind v4** (plugin `@tailwindcss/vite`) + **shadcn** (preset **Nova** — style `radix-nova`, icônes **Lucide**, police **Geist**).

## Commandes

```bash
pnpm dev                                  # serveur Vite (port 5173)
pnpm build                                # tsc -b + vite build
pnpm lint                                 # ESLint
pnpm dlx shadcn@latest add <component>    # ajouter un composant shadcn
```

## Conventions rapides

- **Alias `@/*`** configuré (`tsconfig` + `vite.config.ts`) → **toujours** importer via `@/components/...` plutôt que `../../components/...`.
- **Icônes** : `lucide-react` **uniquement** (cohérent avec le preset Nova).
- **Composants shadcn** dans `src/components/ui/` (configuré dans `components.json`) — ne pas les éditer à la main, re-run `shadcn add` avec tes modifs.
- **Types API** : importer depuis `@futurekawa/contracts`. Ne pas re-typer les réponses HTTP.
- **TS 6** : `"ignoreDeprecations": "6.0"` actif pour garder `baseUrl` compatible shadcn.

## Variables d'environnement

Préfixe `VITE_` obligatoire côté client :

```
VITE_API_URL=http://localhost:3000
```

⚠ **Tout `VITE_*` est public** (shipped dans le bundle) — jamais de secret dedans.

---

## Règles spécifiques

> Les règles transverses (architecture, tests, git, sécurité) sont dans `.claude/commands/rules.md` (`/rules`). Celles-ci s'ajoutent.

### Architecture feature-first

Le code est organisé **par feature métier**, pas par type technique :

```
src/
├── features/
│   ├── lots/
│   │   ├── components/        LotCard, LotList, LotDetail, LotStatusBadge...
│   │   ├── hooks/             useLots, useLot, useLotFilters...
│   │   ├── api/               lots.api.ts (client axios)
│   │   ├── schemas/           schémas zod dérivés de contracts
│   │   └── types.ts           types LOCAUX à la feature (le partagé = contracts)
│   ├── measurements/
│   │   ├── components/        MeasurementChart, MeasurementTable...
│   │   ├── hooks/
│   │   └── api/
│   └── alerts/
│       └── ...
├── components/               composants transverses (Layout, Sidebar, Header)
│   └── ui/                   composants shadcn
├── hooks/                    hooks transverses (useTheme, useMediaQuery)
├── lib/                      utilitaires + http-client.ts + utils.ts (shadcn)
├── pages/                    1 page par route, assemble les features
├── routes/                   déclaration des routes
└── main.tsx / App.tsx
```

**Tout ce qui ne sert qu'à une feature vit dans `features/<nom>/`.** Un élément ne quitte `features/` que quand il devient vraiment transverse (utilisé par ≥ 2 features).

### Tests — dossier dédié (PAS de colocation)

Les tests vivent dans **`tests/`** à la racine de l'app, mirrorant la structure de `src/` :

```
apps/frontend-web/
├── src/features/lots/components/LotCard.tsx
└── tests/features/lots/components/LotCard.test.tsx
```

Pas de `LotCard.test.tsx` à côté de `LotCard.tsx` — convention assumée de l'équipe.

### HTTP — axios + hooks uniquement

- **Un client `axios` partagé** dans `src/lib/http-client.ts`, configuré une fois (baseURL, intercepteurs, correlation ID, gestion erreurs).
- **Toutes les requêtes API passent par axios** via ce client. **Interdit** d'utiliser `fetch` natif dans le code applicatif.
- **Interdit de faire un appel HTTP directement dans un composant**. Toujours passer par un hook de feature (`useLots`, `useCreateLot`, `useMeasurements`…).
- Les fonctions de `src/features/*/api/*.ts` utilisent axios et retournent des données typées via `contracts`. Les hooks consomment ces fonctions (typiquement via TanStack Query quand installé).

### Composants — limites et découpage

- **Un composant > 300 lignes → on découpe.** Pas de god-component.
- **Un composant a une seule responsabilité.** S'il contient plusieurs sections indépendantes (formulaire + liste + détail), c'est 3 composants.
- **Nommage** : `PascalCase.tsx`, un composant par fichier, nom de fichier = nom du composant.
- **Exports nommés** par défaut. `export default` **uniquement** pour les pages (facilite le lazy-loading via `React.lazy`).
- **Props typées** explicitement via interface au-dessus du composant. Pas d'`any`, pas d'inférence implicite.

### Styling — Tailwind + couleurs shadcn

- **Tailwind utility-first**. **Aucun CSS custom** dans les composants : ni CSS Modules, ni styled-components, ni `style={{...}}`, ni `@apply` dans des classes custom.
- **Exceptions acceptées** : `src/index.css` (variables shadcn, reset global) uniquement.
- **Couleurs** : **toujours** via les variables shadcn (`bg-background`, `text-foreground`, `border-border`, `bg-primary`, `text-muted-foreground`, `bg-destructive`…). **Interdit** de coder une couleur en dur (`bg-blue-500`, `text-[#ff0000]`, `style={{color: 'red'}}`).
- **Ajouter une couleur métier** (ex. pour statuts lots) → éditer `@theme` dans `src/index.css` + `:root`/`.dark`, pas inliner.

### Formulaires

- **`react-hook-form` + `zod`** systématiquement (cohérent avec shadcn `<Form>`).
- **Schéma zod dérivé de `@futurekawa/contracts`** quand possible — pas re-déclarer.
- **Jamais de `useState` pour un formulaire** de plus de 2 champs.
- **Validation client ≠ sécurité** — le backend re-valide via `class-validator`.

### État & data

- **URL state** pour les filtres, tri, pagination (via `useSearchParams`). Un tri FIFO doit être partageable par URL, rechargeable, bookmarkable.
- **État local d'abord** (`useState`). Context uniquement si partagé dans un sous-arbre. Store global (Zustand/Redux) **uniquement si vraiment nécessaire** — pas par défaut.
- **Pas de fetch dans un `useEffect`** — toujours via un hook dédié (TanStack Query quand installé).

### Loading, erreurs, UX

- **Skeletons shadcn** (`<Skeleton>`) plutôt que spinners.
- **Error Boundary** autour de chaque page (évite le white screen).
- **Toast** (shadcn `sonner`) pour les erreurs utilisateur et confirmations — **pas** d'`alert()`.
- **Jamais de message technique** remonté à l'utilisateur (stacktrace, erreur axios brute) — afficher un message métier, logger le vrai côté console/Sentry.
- **Clés de liste stables** : `key={lot.id}`, jamais `key={index}`.

### Accessibilité

- **`<Button>` (shadcn)** plutôt que `<div onClick>`. A minima `<button>`.
- **Navigation clavier** testée sur chaque interaction (Tab, Enter, Escape).
- **`alt` obligatoire** sur toute `<img>` (string vide si purement décoratif, mais présent).
- **Labels** associés aux inputs (`<Label htmlFor="...">`).

### Performance

- **Mobile-first** : tester en < 400 px avant de considérer l'UI "faite" (utilisateurs terrain).
- **Pages lazy-loadées** via `React.lazy` + `<Suspense>` dès qu'on a > 3 routes.
- **Images** : lazy-load (`loading="lazy"`) hors premier viewport, format optimisé (webp/avif).
- **Memoisation** (`useMemo`, `memo`, `useCallback`) **uniquement si mesurée** nécessaire — pas par principe.
- **Bundle** : préférer les lib tree-shakables (`lodash-es` plutôt que `lodash`). Vérifier la taille avec `pnpm build` régulièrement.

### Sécurité

- **Jamais de `dangerouslySetInnerHTML`** sans sanitize (XSS).
- **Aucun secret** dans `VITE_*` (tout est shipped au client).
- **Pas de token en `localStorage`** si possible — préférer cookie httpOnly côté backend (à décider avec l'archi auth).

### Magic numbers / strings

- **Extraire en constantes** tout seuil, limite, chaîne répétée (`const PAGE_SIZE = 20`).
- **Les valeurs métier** (seuils T°/humidité, tolérances, 365 jours) viennent **toujours** de `@futurekawa/contracts` — jamais redéfinies côté front.

---

## Stack applicative (tranchée — ADR-0005, branchée par le backbone #18)

Libs installées et configurées ; **ne pas en introduire d'autres** sans nouvel ADR :

- **Router** : `react-router` v7+ (data router) — routes dans `src/routes/router.tsx`.
- **Data fetching** : `@tanstack/react-query` v5 — `QueryClient` dans `src/lib/query-client.ts`. Jamais de fetch dans un `useEffect`.
- **HTTP** : `axios` via `src/lib/http-client.ts` (baseURL `VITE_API_URL`, correlation-id, hook 401).
- **Charts** : `recharts` v3 (wrapper `<Chart>` shadcn) — **pas encore installé**, viendra avec la feature mesures (#30).
- **Forms** : `react-hook-form` + `zod` v3 (schémas dérivés de `contracts`).
- **Toasts** : `sonner` — `<Toaster>` monté dans `App.tsx` (`src/components/ui/sonner.tsx`).
- **Theme** : `ThemeProvider` (`src/components/theme/`) + `useTheme` (`src/hooks/use-theme.ts`), classe `dark` sur `<html>`.
- **Tests** : `vitest` + `@testing-library/react` (dans `tests/`), e2e `playwright` (`tests/e2e/`, non lancé en CI).

- **Auth** : stratégie (cookie vs token) — toujours à définir (ADR-0006). Le hook 401 de `http-client.ts` est un TODO en attente.
