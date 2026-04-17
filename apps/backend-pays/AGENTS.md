# backend-pays

Backend **local pays** (1 instance déployée par pays : Brésil / Équateur / Colombie). Conteneurisé, déployé en bordure de site.

Contexte global : voir le `AGENTS.md` racine.

## Responsabilités (extrait CDC §III.5)

1. Exposer une **API REST** pour enregistrer les lots et exposer stocks + mesures.
2. **S'abonner au broker MQTT local** (Mosquitto) pour consommer les relevés du module IoT et les persister.
3. Lever des **alertes** automatiques (conditions hors plage selon pays, lot > 365j) et envoyer un **email** au responsable d'exploitation.

## Stack

NestJS 11 + Prisma (MariaDB via provider `mysql`) + `@nestjs/microservices` (transport MQTT) + `@nestjs-modules/mailer` + `@nestjs/schedule` (cron de vérification péremption) + `@nestjs/swagger` + `class-validator` + `nestjs-pino`.

## Commandes

```bash
pnpm start:dev              # dev avec hot-reload
pnpm test                   # unitaires (Jest)
pnpm test:e2e               # tests e2e
pnpm lint                   # ESLint --fix
pnpm exec prisma migrate dev # migration locale
pnpm exec prisma studio      # explorer la DB
```

## Conventions

- **Modules par feature** (Nest best practice) : `LotsModule`, `MeasurementsModule`, `AlertsModule`, `MqttModule`, `MailerModule`.
- **DTO dans `src/*/dto/`** validés par `class-validator`, types importés depuis `@futurekawa/contracts` (ne pas redéfinir).
- **Swagger exposé sur `/api-docs`** (à configurer dans `main.ts` avec la suite).
- **ValidationPipe global** activé dans `main.ts` (`whitelist: true, forbidNonWhitelisted: true, transform: true`).
- **Logger** : `nestjs-pino` (JSON structuré, requis pour la supervision mentionnée au CDC).

## Variables d'environnement attendues

```
DATABASE_URL=mysql://user:pass@mariadb:3306/futurekawa_pays
MQTT_URL=mqtt://mosquitto:1883
COUNTRY_CODE=BR              # BR | EC | CO — détermine les seuils via contracts
SMTP_HOST=maildev
SMTP_PORT=1025
SMTP_FROM=alerts@futurekawa.local
ALERT_RECIPIENT=responsable.br@futurekawa.local
```

## Règles spécifiques

> Les règles transverses (architecture, tests, git, sécurité, etc.) sont dans `.codex/commands/rules.md` (`/rules`). Celles-ci s'ajoutent.

### Clean architecture

Organisation **par feature** + **par couche** :

```
src/<feature>/
├── domain/          entités, value objects, interfaces de ports (PURE, aucun import infra)
├── application/     use-cases / services applicatifs (orchestrent le domain)
├── infrastructure/  adapters (Prisma repo, MQTT subscriber, mailer, HTTP client)
└── interface/       controllers REST + DTO d'entrée/sortie
```

- **Le domain ne connaît ni Prisma, ni HTTP, ni MQTT, ni Nest.** Il ne dépend que de TS pur + `@futurekawa/contracts`.
- **L'application** dépend du domain, pas de l'infra — elle parle aux **ports** (interfaces déclarées dans `domain/`).
- **L'infrastructure** implémente les ports (ex. `PrismaLotRepository implements LotRepository`).
- **L'interface** (contrôleurs) appelle uniquement l'application et transforme via DTOs.

### DTO d'entrée ET de sortie — TOUJOURS

- **Entrée** : `CreateXxxDto`, `UpdateXxxDto`, `QueryXxxDto` — décorés `class-validator`, basés sur les types de `@futurekawa/contracts`.
- **Sortie** : `XxxResponseDto` — décoré `@ApiProperty` avec `example`, forme figée indépendante de la DB.
- **Mapper explicite** `entity → responseDto` (dans le service, ou un `<feature>.mapper.ts`).
- **Interdit** de retourner une entité domaine ou un modèle Prisma directement depuis un contrôleur.
- **Interdit** d'importer un type Prisma (`Prisma.*`, `@prisma/client`) depuis un contrôleur ou un fichier `domain/`.

### REST

- **Ressources au pluriel** : `/lots`, `/measurements`, `/alerts`.
- **Verbes sémantiques** : `GET` idempotent, `POST` crée, `PATCH` partiel, `PUT` remplace, `DELETE` supprime.
- **Status codes** : 200 / 201 création / 204 delete / 400 validation / 404 / 409 conflit / 422 règle métier / 500.
- **Erreurs uniformes** en **RFC 7807** (`application/problem+json`) via un `ExceptionFilter` global : `{ type, title, status, detail, instance }`.
- **Versioning** : préfixe `/api/v1/...` dès le premier endpoint.
- **Pagination** standardisée : `?page=1&pageSize=20` → `{ data, total, page, pageSize }`.
- **Tri / filtrage** : `?sort=storedAt:desc` (essentiel pour FIFO).

### Bruno — obligatoire à chaque route

Chaque route ajoutée / modifiée = **Bruno mis à jour dans le même PR** :

- Fichier `.bru` dans `bruno/pays/<scope>/<route>.bru`
- Bloc `docs { ... }` : contrat complet (params, body, réponses, erreurs, ADR liées)
- Bloc `tests { ... }` : status attendu + shape de la réponse
- Testé contre l'environnement `local-pays-br/ec/co`

Voir `bruno/README.md`. Règle transverse : `.codex/rules/05-documentation.md`.

### Prisma

- **`PrismaService`** unique dans `infrastructure/persistence/prisma.service.ts`.
- **Repositories** (implémentant les ports domain) dans `infrastructure/persistence/<entity>.repository.ts`.
- **Migrations versionnées** : `pnpm exec prisma migrate dev --name <description>`. Jamais de `prisma db push` hors dev jetable.
- **Seeds** dans `prisma/seed.ts` pour reproductibilité démo.
- **Pas de `findFirst` sans `orderBy`** si la table peut avoir plusieurs matches.

### MQTT & règles métier pays

- **Topics** (à figer en ADR) : `futurekawa/{country}/warehouse/{warehouseId}/measurement`.
- Les **seuils T°/humidité + tolérances** viennent de `COUNTRY_CONDITIONS[COUNTRY_CODE]` dans `@futurekawa/contracts` — **jamais codés en dur** ici.
- Le **responsable destinataire email** vient de l'env (`ALERT_RECIPIENT`), pas du code.
- **Cron péremption** : tâche quotidienne `@Cron('0 2 * * *')` qui marque les lots > 365j et déclenche l'alerte.
