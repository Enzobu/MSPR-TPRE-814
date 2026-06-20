---
title: Stack frontend (router, query, charts, tests)
owner: Yanis
status: accepted
updated: 2026-06-19
cdc-ref: "§III.3"
adr-refs: [0001]
---

# 0005 — Stack frontend (router, query, charts, tests)

## Contexte

Le `frontend-web` (Vite 8 + React 19 + TS 6 + Tailwind v4 + shadcn preset Nova +
Lucide + Geist) n'a **pas encore** de router ni de client data. Le
`CLAUDE.md` frontend liste des **recommandations « à trancher »** : cet ADR les
**fige avant l'installation** (faite dans le ticket backbone #18), pour éviter
d'introduire des libs au coup par coup.

Hors scope : auth ([ADR-0006](0006-auth-strategy.md)), state management global
(non requis pour le MSPR).

## Décision

| Besoin | Choix | Alternative écartée | Justification |
|---|---|---|---|
| **Routing** | **react-router v7** (mode data router) | TanStack Router | Standard de l'écosystème, data router (loaders, `useSearchParams` pour l'URL state FIFO), maturité, déjà recommandé par le CLAUDE.md. |
| **Data fetching** | **@tanstack/react-query v5** | SWR, fetch maison | Cache, invalidation, refetch périodique (dashboard siège #37), états loading/error de première classe. Interdit de fetch dans `useEffect` (règle front). |
| **Charts** | **recharts v3** | chart.js / nivo | Wrapper `<Chart>` **intégré à shadcn**, API déclarative React, lignes de référence (seuils pays #30). **v3 requise** (compat React 19). |
| **Forms** | **react-hook-form v7 + zod v3** | Formik, état `useState` | Intégration shadcn `<Form>`, perf (uncontrolled), schémas zod **dérivés de `contracts`**. |
| **Toasts** | **sonner** | shadcn `toast` legacy, `alert()` | Recommandé par shadcn, API simple, `alert()` interdit (règle front). |
| **Tests unit/UI** | **vitest + @testing-library/react v16** | Jest | Même moteur que Vite (pas de double config), rapide, ESM natif. TL v16 = support React 19. Tests dans `tests/` (pas de colocation). |
| **Tests e2e** | **playwright** | Cypress | Multi-navigateurs, rapide, artefacts (trace, vidéo) archivables en CI (#38, #39). |
| **HTTP** | **axios** (client partagé `lib/http-client.ts`) | fetch natif | Intercepteurs (correlation-id, gestion d'erreur), `fetch` natif interdit dans le code applicatif (règle front). |

### Versions recommandées (pinnées à l'install — #18)

> Les versions exactes sont **pinnées au moment de l'install** (#18). Recommandation
> de **major** ci-dessous ; vérifier les peer deps React 19 avant de figer.

- `react-router` ≥ 7
- `@tanstack/react-query` ≥ 5
- `recharts` ≥ 3 **(impératif pour React 19)**
- `react-hook-form` ≥ 7 · `@hookform/resolvers` + `zod` ≥ 3
- `sonner` (dernière stable)
- `vitest` ≥ 3 · `@testing-library/react` ≥ 16 · `@testing-library/jest-dom`
- `@playwright/test` (dernière stable)

### Incompatibilités connues

- **recharts ↔ React 19** : les versions `recharts@2.x` provoquent des
  avertissements de peer dependency et des soucis de refs avec React 19.
  **recharts v3** supporte officiellement React 19 → **on impose v3**.
- **@testing-library/react** : exiger **v16+** (les versions antérieures ne
  déclarent pas React 19 en peer).
- **zod v4** existe mais on retient **v3** pour la stabilité du resolver
  react-hook-form ; migration v4 = décision ultérieure si besoin.
- **Tailwind v4** : la config est CSS-first (`@theme` dans `index.css`) — les libs
  ci-dessus n'apportent pas de styles concurrents (recharts est stylé via les
  variables shadcn, pas de thème recharts par défaut).

## Conséquences

### Positives

- Stack **cohérente avec shadcn** (charts, forms, toasts) → peu de glue.
- Un seul moteur de test (Vitest/Vite) → config minimale.
- URL state via react-router → FIFO partageable/bookmarkable (exigence #25).
- Refetch périodique natif (react-query) pour le dashboard temps quasi-réel.

### Négatives

- **recharts v3 imposé** : si un composant tiers attend recharts v2, conflit à
  arbitrer (peu probable).
- react-query ajoute un `QueryClientProvider` + une courbe d'apprentissage (cache,
  staleTime) — assumée.

### Neutres

- Pas de state manager global (Zustand/Redux) : non requis ; à réévaluer si un
  état réellement transverse émerge.
- L'install effective + la config (QueryClient, router, ErrorBoundary, Toaster,
  theme) sont portées par le **backbone front #18**.

## Références

- CDC : §III.3 (application Web), §IV (dataviz).
- `apps/frontend-web/CLAUDE.md` (section « À trancher »).
- ADR liés : [0001](0001-distributed-architecture.md).
- Implémentation : backbone front #18, features #25 (lots), #30 (mesures),
  #37 (dashboard) ; e2e #38, #39.
