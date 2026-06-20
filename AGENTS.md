# FutureKawa — MSPR TPRE-814

Solution applicative multi-pays de **suivi de stocks de café vert** avec surveillance IoT T°/humidité, pour l'entreprise fictive **FutureKawa** (Brésil / Équateur / Colombie).

Projet pédagogique (bloc 4, RNCP35584). Le cahier des charges complet est dans `consigne-structuree.md`.

## Stack

| Couche | Techno |
|---|---|
| Backends (pays + siège) | NestJS 11 + Prisma + TypeScript |
| Frontend | Vite + React 19 + TypeScript + Tailwind v4 + shadcn (preset Nova, Lucide) |
| IoT firmware | PlatformIO + C++ Arduino (ESP8266 + DHT) |
| Base de données | MariaDB (provider Prisma `mysql`) |
| Broker IoT | Mosquitto (MQTT) |
| CI/CD | À définir |
| Conteneurisation | Docker + Docker Compose (imposé par le CDC) |
| Monorepo | pnpm workspaces |

## Arborescence

```
apps/                   code DÉPLOYABLE (process, image Docker, firmware flashé)
  ├── backend-pays/     NestJS — API REST + subscriber MQTT + alerting (1 instance par pays)
  ├── backend-central/  NestJS — agrège les backends pays via HTTP, sert le frontend
  ├── frontend-web/     Vite + React — UI siège
  └── iot/              PlatformIO + C++ — firmware ESP8266
packages/               code IMPORTÉ (libs TS partagées)
  ├── contracts/        @futurekawa/contracts — types/DTO/enums/seuils pays (types-only)
  └── nest-common/      @futurekawa/nest-common — infra NestJS transverse (filtre RFC 7807, pino, validation env)
.codex/                config Codex (agents, commands, settings)
consigne-structuree.md  cahier des charges (source de vérité métier)
```

Règle de placement : `apps/` = quelque chose qui se lance (`docker compose up` ou flash). `packages/` = quelque chose qu'on `import` depuis une app. Si tu hésites, c'est probablement `packages/`.

## Commandes workspace (depuis la racine)

```bash
pnpm install                              # installer toutes les deps
pnpm -r build                             # builder tous les workspaces
pnpm -r test                              # tester tous les workspaces
pnpm --filter backend-pays start:dev      # dev une app spécifique
pnpm --filter frontend-web dev
pnpm --filter @futurekawa/contracts build # rebuild des types partagés
```

`pnpm-workspace.yaml` couvre `apps/*` et `packages/*`. `apps/iot/` est ignoré (pas de `package.json`) — **ne jamais y lancer pnpm/npm**.

## Conventions transverses

- **Types métier partagés** : toujours via `@futurekawa/contracts`. Ne jamais redéfinir un `Lot`, `Measurement`, `Alert`, `CountryCode` localement — modifier le package et laisser TypeScript propager.
- **Seuils pays (T°/humidité) + tolérances** : définis dans `packages/contracts/src/country.ts`. Source unique de vérité.
- **Conventions de commit, branches, formatage** : Prettier racine, Husky + lint-staged au pre-commit.
- **Secrets** : `.env` par app, jamais commit. `.env.example` attendu pour chaque app (à créer).

## Règles projet

Les règles **transverses** (clean architecture, TS strict, tests, doc, git, sécurité, observabilité, monorepo, parité IA) vivent dans **`.codex/rules/`** (un fichier par thème, numérotés `01-` à `10-`). La skill **`rules`** (`.agents/skills/rules/SKILL.md`) les charge toutes en contexte.

Les règles **spécifiques** à un sous-projet (REST, DTO, Prisma, shadcn, firmware…) vivent dans le `AGENTS.md` du sous-projet concerné (voir section ci-dessous).

En cas de conflit apparent entre règles transverses et spécifiques, la règle **la plus spécifique** l'emporte.

## Où aller pour un AGENTS.md plus précis

Codex charge automatiquement le AGENTS.md du dossier courant **en plus** de celui-ci :

- `apps/backend-pays/AGENTS.md` — backend local pays (API + MQTT + mailer + schedule)
- `apps/backend-central/AGENTS.md` — backend siège (agrégation)
- `apps/frontend-web/AGENTS.md` — UI React/shadcn
- `apps/iot/AGENTS.md` — firmware ESP8266 C++
- `packages/contracts/AGENTS.md` — lib TS partagée (types-only)
- `packages/nest-common/AGENTS.md` — infra NestJS transverse partagée par les backends

## Subagents et skills disponibles

- **Subagents** (fichiers TOML, voir `.codex/agents/*.toml`) : `orchestrator`, `tester`, `nest-expert`, `iot-expert`, `frontend-expert`, `cdc-reviewer`
- **Skills** (dossiers avec `SKILL.md`, voir `.agents/skills/<nom>/`) :
  - Workflow : `create-ticket`, `feature`, `fix`, `refacto`, `commit`, `close-ticket`
  - Utilitaires : `rules`, `check-cdc`, `mqtt-simulate`

Config projet : `.codex/config.toml` (TOML, fusionne avec `~/.codex/config.toml` perso).
