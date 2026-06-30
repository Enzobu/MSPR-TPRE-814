# FutureKawa — MSPR TPRE-814

Solution applicative multi-pays pour le **suivi de stocks de café vert** et la **surveillance IoT** (température / humidité) dans les entrepôts de FutureKawa : **Brésil, Équateur, Colombie**.

Projet pédagogique — **MSPR Bloc 4**, certification **RNCP 35584** (Expert en Informatique et Système d'Information).

---

## Sommaire

- [Contexte](#contexte)
- [Stack](#stack)
- [Arborescence](#arborescence)
- [Démarrage rapide (Docker)](#démarrage-rapide-docker)
- [Développement local (sans Docker)](#développement-local-sans-docker)
- [Firmware IoT](#firmware-iot)
- [Commandes utiles](#commandes-utiles)
- [Dépannage](#dépannage)
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
| CI/CD | GitHub Actions ([`.github/workflows/ci.yml`](./.github/workflows/ci.yml)) |
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

## Pré-requis

| Outil | Version | Pourquoi |
|---|---|---|
| **Node** | 22 LTS (voir [`.nvmrc`](./.nvmrc)) | runtime des backends + build front. `nvm use` |
| **pnpm** | 9+ | gestionnaire du monorepo (`corepack enable` suffit) |
| **Docker** + Compose v2 | récent | stack complète (DB, MQTT, backends, front, docs) |
| PlatformIO CLI | — | uniquement pour flasher le firmware IoT |
| Bruno | — | uniquement pour tester l'API ([usebruno.com](https://www.usebruno.com/)) |

> ⚠️ **Toujours** lancer pnpm depuis la **racine** du repo (`pnpm install`, `pnpm --filter …`).
> Jamais de `npm install` dans un sous-dossier — ça casse le workspace.

---

## Démarrage rapide (Docker)

C'est la voie **recommandée** : une seule commande lève toute la stack (2× MariaDB,
Mosquitto, backend pays + siège, frontend, phpMyAdmin, site de docs). Le `Makefile`
injecte automatiquement `.env.compose` à Docker Compose.

```bash
# 1. Cloner + créer le fichier d'env de la stack (valeurs de dev par défaut, prêtes à l'emploi)
cp .env.compose.example .env.compose

# 2. Builder les images puis démarrer en arrière-plan
make build
make up

# 3. Suivre le démarrage (Ctrl-C pour quitter les logs, la stack continue)
make logs
```

Au premier `up`, les migrations Prisma s'appliquent et un utilisateur **admin** est
seedé automatiquement. Patiente ~15 s puis ouvre le front.

### Services exposés

| Service | URL | Notes |
|---|---|---|
| **Frontend** | http://localhost:5173 | UI siège — login ci-dessous |
| **Backend siège (API)** | http://localhost:3000 | health : `/health` · `/ready` |
| **Swagger** | http://localhost:3000/api-docs | doc API interactive |
| **phpMyAdmin** | http://localhost:8080 | serveurs `central` / `pays` |
| **Docs (VitePress)** | http://localhost:8081 | doc utilisateur métier |
| Backend pays | interne (réseau Docker) | abonné MQTT `futurekawa/<pays>/…` |
| Broker MQTT | `localhost:1883` | Mosquitto |

**Identifiants par défaut** (modifiables dans `.env.compose`) :

- **App** (front + Swagger) : `admin@futurekawa.local` / `Adm1n-FutureKawa`
- **phpMyAdmin / MariaDB** : `futurekawa` / `futurekawa`

### Données de démo (lots)

Le `up` applique les migrations et seede l'**admin**, mais **pas les lots** (données
métier). Pour peupler ~20 lots de démo (BR/EC/CO) une fois la stack lancée :

```bash
docker compose --env-file .env.compose exec -w /workspace/apps/backend-pays backend-pays \
  sh -c 'export PATH="$PWD/node_modules/.bin:$PATH"; prisma db seed'
```

Sans ça, la liste des lots est vide (les mesures T°/humidité, elles, arrivent par MQTT
— voir `/mqtt-simulate`).

### Cibles `make` disponibles

```bash
make build     # build (ou rebuild) des images applicatives
make up        # démarre toute la stack en arrière-plan (-d)
make logs      # suit les logs de tous les services
make ps        # état des conteneurs
make restart   # redémarre les services
make down      # arrête les conteneurs (les données MariaDB sont conservées)
make clean     # arrête + supprime volumes et orphelins (RESET complet)
```

> 💡 Après une **modification de code**, refais `make build` avant `make up`
> (les images embarquent le build, elles ne montent pas tes sources).

---

## Développement local (sans Docker)

Pour itérer avec hot-reload sur une app précise. Tu as besoin d'un MariaDB et d'un
Mosquitto joignables (le plus simple : `make up` puis travailler sur l'app voulue
en local, ou lancer tes propres instances).

```bash
# 1. Installer les dépendances du monorepo
pnpm install

# 2. Builder les packages partagés AU MOINS UNE FOIS (leur dist/ est gitignoré)
pnpm -r build        # ou, ciblé : pnpm --filter @futurekawa/contracts build

# 3. Créer les fichiers d'env applicatifs (gitignorés)
cp apps/backend-pays/.env.example    apps/backend-pays/.env
cp apps/backend-central/.env.example apps/backend-central/.env
cp apps/frontend-web/.env.example    apps/frontend-web/.env.local
```

Puis, dans des terminaux séparés :

```bash
pnpm --filter backend-pays    start:dev      # API pays + subscriber MQTT  (port 3010)
pnpm --filter backend-central start:dev      # API siège                   (port 3000)
pnpm --filter frontend-web    dev            # UI Vite                     (port 5173)
```

> Les `@futurekawa/contracts` sont consommés depuis leur `dist/` compilé (gitignoré).
> Après toute modif du package, **rebuild-le** (`pnpm --filter @futurekawa/contracts build`),
> sinon les apps voient des types/constantes périmés (erreurs du type `undefined` au runtime).

---

## Firmware IoT

```bash
cp apps/iot/include/secrets.h.example apps/iot/include/secrets.h   # WiFi + MQTT, gitignoré
cd apps/iot
pio run -t upload        # compile + flashe l'ESP8266
pio device monitor       # logs série
```

Détails matériel / câblage / protocole : [`docs/iot/`](./docs/iot/).

---

## Commandes utiles

### Workspace (pnpm, depuis la racine)

```bash
pnpm install               # installe tout le workspace
pnpm -r build              # build tous les workspaces (contracts inclus)
pnpm -r lint               # lint tous
pnpm -r test               # tests unitaires de tous
pnpm format                # Prettier sur tout
pnpm --filter <app> <cmd>  # cibler une app (ex: pnpm --filter backend-pays test)
```

### Base de données (Prisma, par backend)

```bash
pnpm --filter backend-pays exec prisma migrate dev   # créer/appliquer une migration
pnpm --filter backend-pays exec prisma studio        # explorer la DB
```

### Documentation utilisateur (VitePress)

```bash
pnpm docs:dev       # site doc en local (hot-reload)
pnpm docs:build     # build statique
pnpm docs:preview   # prévisualiser le build
```

### Simuler l'IoT sans firmware

`/mqtt-simulate <pays>` (Claude Code / Codex) injecte des relevés T°/humidité
factices dans Mosquitto pour tester le backend pays et l'alerting.

---

## Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| `Cannot read properties of undefined (reading 'map')` (front) | `@futurekawa/contracts` pas (re)buildé après un pull | `pnpm --filter @futurekawa/contracts build` puis relancer le front |
| Un backend Docker redémarre en boucle (`Restarting`) | erreur au boot | `make logs` puis lire l'erreur (env invalide, DB pas prête…) |
| `Invalid environment variables` au boot d'un backend | variable manquante/invalide dans `.env.compose` | comparer avec `.env.compose.example`, corriger, `make up` |
| phpMyAdmin / front inaccessibles | stack pas démarrée, ou ports déjà pris | `make ps` ; libérer les ports 5173/3000/8080/8081/1883 ou les changer dans `.env.compose` |
| MariaDB ne devient jamais *healthy* | `VOLUME_BASE_PATH` vide ou creds manquants | vérifier `.env.compose` (repartir de `.env.compose.example`) |
| Changement de code non pris en compte (Docker) | image pas reconstruite | `make build && make up` |
| Tout est cassé, repartir propre | volumes/état corrompus | `make clean` puis `make build && make up` (⚠️ efface les données) |

## Documentation

Toute la doc vit dans [`docs/`](./docs/) (structure imposée par [`.claude/rules/05-documentation.md`](./.claude/rules/05-documentation.md)) :

- [`docs/architecture/`](./docs/architecture/) — archi globale, DB, MQTT, API (§IV.4.1 CDC)
- [`docs/features/`](./docs/features/) — une feature = un fichier, source de vérité cross-app
- [`docs/iot/`](./docs/iot/) — hardware, protocole, firmware (§IV.4.2 CDC)
- [`docs/testing/`](./docs/testing/) — stratégie, plan de tests (§IV.4.3 CDC)
- [`docs/adr/`](./docs/adr/) — Architecture Decision Records (immuables)
- [`docs/ci-cd/`](./docs/ci-cd/) — pipeline GitHub Actions, Docker (§IV.5 CDC)
- [`docs/operations/`](./docs/operations/) — runbook, déploiement, troubleshooting
- [`docs/user/`](./docs/user/) — documentation utilisateur métier en français (§IV.8 CDC)
- [`docs/phase-2/`](./docs/phase-2/) — automatisation & questionnaire (§IV.9-10 CDC)

### Site de documentation utilisateur (VitePress)

La doc utilisateur (`docs/user/`) est aussi servie comme **site web navigable
avec recherche** ([ADR-0009](./docs/adr/0009-vitepress-user-docs.md)). En local :

```bash
pnpm docs:dev       # site en local (hot-reload)
pnpm docs:build     # build statique
pnpm docs:preview   # prévisualiser le build
```

En production, c'est le **service Docker `docs`** de la stack compose (buildé avec
le reste, déployé par Dokploy — [ADR-0010](./docs/adr/0010-docs-site-deployment.md)).

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
