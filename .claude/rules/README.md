# Règles transverses du monorepo FutureKawa

Ce dossier contient les **règles qui s'appliquent à tout le projet**, découpées par thème pour faciliter la lecture, la maintenance et les diffs.

**Source canonique** : ces fichiers.
**Accès rapide** : taper `/rules` dans Claude Code → la commande charge l'ensemble en contexte.

| Fichier | Thème |
|---|---|
| [`01-architecture.md`](01-architecture.md) | Clean architecture, dependency rule, SRP, no cross-app imports |
| [`02-code.md`](02-code.md) | TypeScript strict, nommage, petites unités, commentaires |
| [`03-feature.md`](03-feature.md) | Une feature = tests + documentation |
| [`04-tests.md`](04-tests.md) | Pyramide, AAA, coverage priorités |
| [`05-documentation.md`](05-documentation.md) | Swagger, ADR, README, doc utilisateur |
| [`06-git.md`](06-git.md) | Conventional Commits, branches, PR, pre-commit |
| [`07-security.md`](07-security.md) | OWASP API Top 10, secrets, validation, CORS, rate limit |
| [`08-observability.md`](08-observability.md) | Logs structurés, correlation ID, health endpoints |
| [`09-monorepo.md`](09-monorepo.md) | Dépendances, pas de cycles, `@futurekawa/contracts` |
| [`10-ai-parity.md`](10-ai-parity.md) | Parité Claude Code ↔ Codex — synchronisation obligatoire en PR |

## Règles spécifiques par sous-projet

Ces règles-ci sont **transverses**. Les règles **spécifiques** à un sous-projet (REST/DTO/Prisma pour les backends, shadcn/Tailwind/features pour le front, PlatformIO pour l'IoT) vivent dans le `CLAUDE.md` du sous-projet :

- `apps/backend-pays/CLAUDE.md`
- `apps/backend-central/CLAUDE.md`
- `apps/frontend-web/CLAUDE.md`
- `apps/iot/CLAUDE.md`
- `packages/contracts/CLAUDE.md`

En cas de conflit apparent, la règle **la plus spécifique** gagne.
