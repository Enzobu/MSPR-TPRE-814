# 09 — Monorepo & dépendances

## Gestion des dépendances

- **Toujours** via `pnpm --filter <app> add <pkg>` depuis la racine du monorepo.
- **Jamais** de `npm install` local dans un sous-dossier.
- **`pnpm install`** à la racine installe tout le workspace.

## Versions

- Toutes les apps qui partagent une dépendance doivent utiliser la **même version** quand c'est possible.
- **`pnpm outdated -r`** pour détecter les divergences.
- Mise à jour coordonnée via PR dédiée (`chore(deps): bump X to Y`).

## Pas de dépendances circulaires

- `apps/*` ne dépendent **que de** `packages/*` (et deps externes).
- `packages/*` ne dépendent **que d'autres** `packages/*` ou deps externes. Pas d'import de `apps/*`.
- Entre packages : arborescence, pas de cycle.

## `@futurekawa/contracts` — règles spéciales

- **Aucune dépendance runtime** : pas de `@nestjs/*`, `react`, `axios`, `zod`, `class-validator`.
- **Uniquement des types + constantes statiques**.
- **Pas d'import depuis `apps/*`** (le package ne connaît pas les apps).
- **Rebuild obligatoire** après modification (`pnpm --filter @futurekawa/contracts build`) pour que les consommateurs voient les changements.
- **`private: true`**, jamais publié sur npm.

## Scripts workspace

Scripts standards à maintenir dans chaque app (`package.json`) :

- `build`, `dev` / `start:dev`, `lint`, `test`, `test:e2e`
- Permettent `pnpm -r build`, `pnpm -r lint`, `pnpm -r test` depuis la racine.
