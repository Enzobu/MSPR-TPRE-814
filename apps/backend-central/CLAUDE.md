# backend-central

Backend **siège** (1 instance centralisée). Agrège les données des backends pays et sert le frontend.

Contexte global : voir le `CLAUDE.md` racine.

## Responsabilités (extrait CDC §III.5)

1. **Requêter les backends pays** via HTTP pour consolider stocks, mesures, alertes.
2. **Exposer une API** consommée par le frontend.
3. Servir éventuellement le frontend Web (ou laisser Nginx/Vite static).

## Stack

NestJS 11 + Prisma (MariaDB — DB siège, typiquement light : users, config, audit) + `@nestjs/swagger` + `class-validator` + `nestjs-pino`.

Pas de MQTT ici : c'est une préoccupation pays.

## Commandes

Identiques à `backend-pays` (NestJS standard) :

```bash
pnpm start:dev
pnpm test
pnpm lint
pnpm exec prisma migrate dev
```

## Conventions

- **HTTP client vers backends pays** : `@nestjs/axios` (wrapper RxJS d'axios) ou `fetch` natif. Brancher le client via `@nestjs/config` (URLs pays en env).
- **Agrégation** : penser timeouts, retry, circuit breaker léger (`p-retry` ou équivalent). Documenter la stratégie de résilience dans le dossier technique.
- **Types de réponse** : utiliser les types de `@futurekawa/contracts` pour que la réponse côté front et la requête vers pays aient la même forme.
- **CORS** : activer pour le domaine du frontend.

## Variables d'environnement attendues

```
DATABASE_URL=mysql://user:pass@mariadb:3306/futurekawa_central
BACKEND_PAYS_BR_URL=http://backend-pays-br:3000
BACKEND_PAYS_EC_URL=http://backend-pays-ec:3000
BACKEND_PAYS_CO_URL=http://backend-pays-co:3000
CORS_ORIGIN=http://localhost:5173
```

## Règles spécifiques

> Les règles transverses (architecture, tests, git, sécurité, etc.) sont dans `.claude/commands/rules.md` (`/rules`). Celles-ci s'ajoutent.

### Clean architecture

Organisation **par feature** + **par couche**, identique à `backend-pays` :

```
src/<feature>/
├── domain/          entités agrégées (vue siège), ports
├── application/     use-cases d'agrégation (ex. GetConsolidatedStocks)
├── infrastructure/  HTTP clients vers backends pays, PrismaService (léger — config/audit siège)
└── interface/       controllers REST + DTO d'entrée/sortie
```

- **Pas d'appel HTTP direct depuis un contrôleur** — passer par un use-case qui consomme un port `CountryBackendGateway`.
- **Un adapter par backend pays** n'est **pas** souhaitable : utiliser un seul `HttpCountryBackendGateway` paramétré par URL/pays.

### DTO d'entrée ET de sortie — TOUJOURS

Même règle qu'au backend-pays : `CreateXxxDto` / `QueryXxxDto` + `XxxResponseDto`, décorés Swagger, mappers explicites. **Interdit** de retourner tel quel la réponse d'un backend pays — toujours mapper vers un DTO siège (même si la forme est identique) pour découpler.

### REST

Mêmes conventions que `backend-pays` (pluriel, verbes, status codes, RFC 7807, versioning `/api/v1`, pagination, tri).

### Bruno — obligatoire à chaque route

Chaque route ajoutée / modifiée = **Bruno mis à jour dans le même PR** :

- Fichier `.bru` dans `bruno/central/<scope>/<route>.bru`
- Bloc `docs { ... }` : contrat complet (params, body, réponses, erreurs, ADR liées)
- Bloc `tests { ... }` : status attendu + shape de la réponse
- Testé contre l'environnement `local-central`
- Si la route émet ou consomme un JWT, mettre à jour les scripts `post-response` ou la config `auth` (cf. `bruno/central/auth/login.bru` comme référence)

Voir `bruno/README.md`. Règle transverse : `.claude/rules/05-documentation.md`.

### Agrégation & résilience

- **Timeouts explicites** sur les appels vers backends pays (ex. 3 s).
- **Retry léger** avec backoff (ex. `p-retry`, 2 tentatives).
- **État partiel explicite** si un pays est indisponible : `{ data: [...], unavailable: ['EC'] }` plutôt que 500.
- **Cache court** (en mémoire ou Redis) pour `GET /stocks/global` — éviter de marteler les backends pays à chaque refresh front.
- **Correlation ID** : toujours propager le header entrant vers les appels pays.

### Règles métier

- **Ne jamais dupliquer** la logique d'alerte, de FIFO, ou de seuils — c'est le pays qui décide, le siège **consulte**.
- Aucune écriture directe dans la DB d'un pays — seulement via l'API du pays.
