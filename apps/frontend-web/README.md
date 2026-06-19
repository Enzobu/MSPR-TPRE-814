# frontend-web

SPA React (siège + équipes terrain) consommant `backend-central`. Voir le détail métier dans [`docs/features/`](../../docs/features/) et les conventions dans [`CLAUDE.md`](./CLAUDE.md).

## Stack

Vite 8 · React 19 · TypeScript 6 · Tailwind v4 · shadcn (preset Nova, Lucide, Geist) · react-router v7+ · @tanstack/react-query v5 · axios · sonner · react-hook-form + zod · vitest + Testing Library · Playwright. Stack figée par [ADR-0005](../../docs/adr/0005-frontend-stack.md).

## Commandes

```bash
pnpm dev          # serveur Vite (port 5173)
pnpm build        # tsc -b + vite build
pnpm lint         # ESLint
pnpm test         # tests unit/UI (vitest, une passe)
pnpm test:watch   # vitest en watch
pnpm test:cov     # vitest + couverture
pnpm test:e2e     # Playwright (démarre Vite ; nécessite `pnpm exec playwright install`)
```

## Variables d'environnement

Préfixe `VITE_` obligatoire — **tout `VITE_*` est public** (shipped dans le bundle), jamais de secret. Voir [`.env.example`](./.env.example).

```
VITE_API_URL=http://localhost:3000   # URL du backend-central
```

## Points d'entrée

- `src/main.tsx` → `src/App.tsx` (providers : ErrorBoundary, ThemeProvider, QueryClientProvider, Toaster) → `src/routes/router.tsx` (data router).
- `src/lib/http-client.ts` : client axios partagé (baseURL `VITE_API_URL`, correlation-id, hook 401 pour l'auth à venir).
- Pages dans `src/pages/`, layout dans `src/components/layout/`, features dans `src/features/<nom>/`.

## Architecture & conventions

Feature-first, tests dans `tests/` (pas de colocation), couleurs via variables shadcn uniquement, axios via `http-client` (jamais `fetch`). Détail : [`CLAUDE.md`](./CLAUDE.md).
