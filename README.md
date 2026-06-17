# FutureKawa — MSPR TPRE-814

Solution applicative multi-pays pour le **suivi de stocks de café vert** et la **surveillance IoT** (température / humidité) dans les entrepôts de FutureKawa : **Brésil, Équateur, Colombie**.

Projet pédagogique — **MSPR Bloc 4**, certification **RNCP 35584** (Expert en Informatique et Système d'Information).

---

## Sommaire

- [Contexte](#contexte)
- [Stack](#stack)
- [Arborescence](#arborescence)
- [Prise en main](#prise-en-main)
- [Commandes workspace](#commandes-workspace)
- [Documentation](#documentation)
- [Conventions & règles](#conventions--règles)
- [Équipe](#équipe)

---

## Contexte

FutureKawa souhaite une solution permettant de :

- **Centraliser** le suivi des stocks par pays / entrepôt.
- **Garantir la traçabilité** des lots de café vert depuis leur entrée en stockage.
- **Surveiller** automatiquement les conditions de conservation (T° / humidité) via des capteurs IoT.
- **Détecter et alerter** en cas de dérive des conditions ou de lots anciens (> 365 j).
- Préparer une future **automatisation des entrepôts** (chauffage, humidification, aération).

Cahier des charges complet : [`consigne-structuree.md`](./consigne-structuree.md).

## Stack

| Couche | Techno |
|---|---|
| Backends (pays + siège) | NestJS 11 · Prisma · TypeScript |
| Frontend | Vite · React 19 · TypeScript · Tailwind v4 · shadcn (Nova) · Lucide |
| IoT firmware | PlatformIO · C++ Arduino · ESP8266 (esp12e) |
| Base de données | MariaDB |
| Broker IoT | Mosquitto (MQTT) |
| CI/CD | À définir |
| Conteneurisation | Docker · Docker Compose |
| API testing | Bruno (collection versionnée) |
| Monorepo | pnpm workspaces |

## Arborescence

```
.
├── apps/
│   ├── backend-pays/        NestJS — API REST + subscriber MQTT + alerting (1 instance par pays)
│   ├── backend-central/     NestJS — agrégateur siège (consomme les backends pays)
│   ├── frontend-web/        Vite + React — UI siège
│   └── iot/                 PlatformIO + C++ — firmware ESP8266
├── packages/
│   └── contracts/           @futurekawa/contracts — types & DTO partagés
├── bruno/                   collection Bruno (API testing, JWT auto-stocké)
├── docs/                    documentation du projet (archi, features, adr, user, …)
├── .claude/                 config Claude Code (agents, commands, rules)
├── .github/                 templates PR + Issues
└── consigne-structuree.md   cahier des charges métier
```

Vue détaillée des conventions dans [`CLAUDE.md`](./CLAUDE.md).

## Prise en main

### Pré-requis

- Node **22 LTS** (voir `.nvmrc`) — `nvm use` ou équivalent
- pnpm **9+**
- Docker + Docker Compose (pour MariaDB, Mosquitto et la démo conteneurisée)
- PlatformIO CLI (pour flasher le firmware IoT)
- Bruno (pour tester l'API) — [usebruno.com](https://www.usebruno.com/)

### Installation

```bash
pnpm install
```

### Configuration

Copier chaque `.env.example` en `.env` (ou `.env.local` pour le front) et ajuster :

```bash
cp apps/backend-pays/.env.example    apps/backend-pays/.env
cp apps/backend-central/.env.example apps/backend-central/.env
cp apps/frontend-web/.env.example    apps/frontend-web/.env.local
cp apps/iot/include/secrets.h.example apps/iot/include/secrets.h
```

### Démarrer en dev

```bash
# backends (terminaux séparés)
pnpm --filter backend-pays    start:dev
pnpm --filter backend-central start:dev

# frontend
pnpm --filter frontend-web dev

# firmware IoT (depuis apps/iot)
pio run -t upload
pio device monitor
```

### Démarrer avec Docker

Les URLs, ports exposés et credentials MariaDB locaux sont centralisés dans `.env.compose`, à créer depuis [`.env.compose.example`](./.env.compose.example). Utiliser le `Makefile` pour injecter ce fichier à Docker Compose :

```bash
cp .env.compose.example .env.compose
```

```bash
make docker-build     # build des images applicatives
make docker-up        # démarre l'environnement complet en arrière-plan
make docker-logs      # suit les logs
make docker-ps        # liste les services
make docker-down      # arrête les services
make docker-clean     # arrête et supprime les volumes
```

Services exposés par défaut :

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend central | http://localhost:3000 |
| Backend pays | Configuré via `BACKEND_PAYS_URL` dans `.env.compose` |
| Broker MQTT pays | Configuré via `MOSQUITTO_PAYS_PORT` dans `.env.compose` |
| phpMyAdmin | Configuré via `PHPMYADMIN_WEB_URL` dans `.env.compose` |

## Commandes workspace

```bash
pnpm -r build              # build tous les workspaces
pnpm -r lint               # lint tous
pnpm -r test               # tests tous
pnpm format                # Prettier sur tout
pnpm --filter <app> <cmd>  # cibler une app
```

## Documentation

Toute la doc vit dans [`docs/`](./docs/) (structure imposée par [`.claude/rules/05-documentation.md`](./.claude/rules/05-documentation.md)) :

- [`docs/architecture/`](./docs/architecture/) — archi globale, DB, MQTT, API (§IV.4.1 CDC)
- [`docs/features/`](./docs/features/) — une feature = un fichier, source de vérité cross-app
- [`docs/iot/`](./docs/iot/) — hardware, protocole, firmware (§IV.4.2 CDC)
- [`docs/testing/`](./docs/testing/) — stratégie, plan de tests (§IV.4.3 CDC)
- [`docs/adr/`](./docs/adr/) — Architecture Decision Records (immuables)
- [`docs/ci-cd/`](./docs/ci-cd/) — Docker et déploiement local
- [`docs/user/`](./docs/user/) — documentation utilisateur métier en français (§IV.8 CDC)
- [`docs/phase-2/`](./docs/phase-2/) — automatisation & questionnaire (§IV.9-10 CDC)

API :
- **Swagger** : `/api-docs` sur chaque backend
- **Bruno** : collection [`bruno/`](./bruno/) — voir [`bruno/README.md`](./bruno/README.md)

## Assistants IA (Claude Code + Codex)

Le repo supporte **deux assistants IA en parallèle**, avec une configuration **sémantiquement équivalente** (formats natifs propres à chaque outil) :

| Outil | Contexte | Config | Subagents | Skills / commands |
|---|---|---|---|---|
| Claude Code | [`CLAUDE.md`](./CLAUDE.md) | [`.claude/settings.json`](./.claude/settings.json) | [`.claude/agents/`](./.claude/agents/) (YAML + markdown) | [`.claude/commands/`](./.claude/commands/) |
| Codex | [`AGENTS.md`](./AGENTS.md) | [`.codex/config.toml`](./.codex/config.toml) | [`.codex/agents/`](./.codex/agents/) (TOML) | [`.agents/skills/`](./.agents/skills/) (dossiers `SKILL.md`) |

**Règle critique** (`10-ai-parity`) : toute modification d'un côté est répliquée sémantiquement dans l'autre **dans le même PR**. Voir [`docs/operations/ai-assistants.md`](./docs/operations/ai-assistants.md).

## Conventions & règles

Règles transverses centralisées dans [`.claude/rules/`](./.claude/rules/) et [`.codex/rules/`](./.codex/rules/). Charger via `/rules` dans ton assistant. Points saillants :

- **Clean architecture** (domain / application / infrastructure / interface), dependency rule stricte
- **DTO d'entrée ET de sortie** obligatoires, jamais de type Prisma exposé
- **Types partagés** via `@futurekawa/contracts` exclusivement
- **Une feature = tests + documentation** (dont `docs/features/<feature>.md`)
- **Une route = Bruno + doc** dans le même PR
- **Conventional Commits** appliqués par Commitlint (hook `commit-msg`)
- **Sécurité** OWASP API Top 10, pas de secret en git, `.env.example` à jour
- **Observabilité** logs structurés Pino + `x-correlation-id` propagé

Règles spécifiques par sous-projet dans les `CLAUDE.md` / `AGENTS.md` correspondants.

### Workflow Git

- Branches : `feat/<scope>-<desc>`, `fix/<scope>-<desc>`, `refactor/<scope>-<desc>`, `chore/<scope>-<desc>`
- **Aucun commit direct sur `dev` / `main`** — toujours via PR
- Review obligatoire par un pair
- Pre-commit : Prettier + ESLint via Husky + lint-staged (ne pas `--no-verify`)

### Commandes slash (Claude Code & Codex)

Mêmes commandes dans les deux assistants. Workflow :
- `/create-ticket <desc>` — crée une issue GitHub propre
- `/feature <#id>` — implémente une feature de bout en bout
- `/fix <#id>` — corrige un bug (test-first obligatoire)
- `/refacto <#id>` — refactor sans changement de comportement
- `/commit [msg]` — commit + push avec Conventional Commits
- `/close-ticket <#id>` — ferme une issue après vérification de la DoD

Utilitaires :
- `/rules` — rappelle et applique les règles transverses
- `/check-cdc [section]` — audit conformité au cahier des charges
- `/mqtt-simulate <country>` — inject des relevés factices dans Mosquitto

## Équipe

Équipe de 4 apprenants — MSPR MSPR-TPRE-814.

Organisation du travail via GitHub Issues + Projects. Pour créer un ticket propre : `/create-ticket` dans Claude Code ou utiliser les templates GitHub (`.github/ISSUE_TEMPLATE/`).

## Licence

Projet pédagogique. Tous droits réservés.
