# @futurekawa/nest-common

Code **runtime transverse** partagé par les deux backends NestJS (`backend-pays` et
`backend-central`). Évite la duplication du code d'infrastructure commun (filtres,
logging, validation d'env).

Contexte global : voir l'`AGENTS.md` racine.

## Pourquoi un package séparé de `@futurekawa/contracts`

`@futurekawa/contracts` est **types-only** (règle 09 : zéro runtime NestJS). Le code
ci-dessous a des **dépendances runtime** (`@nestjs/common`, `@nestjs/swagger`) : il ne
peut donc PAS vivre dans `contracts`. D'où ce package dédié.

## Contenu exporté

| Export | Rôle |
|---|---|
| `ProblemDetailsFilter` | `ExceptionFilter` global RFC 7807 (`application/problem+json`) |
| `ProblemDetailsDto` | forme de la réponse d'erreur (Swagger) |
| `buildPinoOptions(level)` | options `nestjs-pino` (correlation-id, redaction secrets) |
| `CORRELATION_ID_HEADER` | constante `x-correlation-id` |
| `createEnvValidator(schema)` | fabrique un validateur d'env à partir d'un schéma zod **propre à chaque backend** |

## Règles spécifiques

- **Aucune logique métier ici** : seulement de l'infrastructure transverse. Les seuils,
  alertes, FIFO, etc. restent dans les backends.
- **Pas de schéma d'env en dur** : `createEnvValidator` est générique ; chaque backend
  garde son `envSchema` (variables spécifiques) et son type `Env`.
- **Dépendances NestJS en `peerDependencies`** : fournies par l'app consommatrice, pour
  garantir une seule instance de `@nestjs/common` (identité de classe → `instanceof`).
- **Rebuild obligatoire** après modification (`pnpm --filter @futurekawa/nest-common build`)
  pour que les backends voient les changements (dist gitignoré).
- **`private: true`**, jamais publié sur npm.

## Commandes

```bash
pnpm --filter @futurekawa/nest-common build
pnpm --filter @futurekawa/nest-common test
pnpm --filter @futurekawa/nest-common lint
```
