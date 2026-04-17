# 03 — Une feature = tests + documentation

## Règle

**Aucune feature mergée sans** :

1. **Tests automatisés** au niveau adapté :
   - ≥ 1 test unitaire sur la logique métier
   - Test d'intégration si la feature traverse un système externe (DB, MQTT, HTTP client, mailer)
   - Test e2e si la feature introduit un nouveau parcours utilisateur
2. **Documentation** mise à jour :
   - **Un fichier `docs/features/<feature>.md`** (voir template ci-dessous) — **créé au premier PR** de la feature, pas après coup
   - **Swagger** à jour côté API (endpoints, DTO, exemples)
   - **README** de l'app touchée si la feature modifie les commandes de dev ou les variables d'env
   - **ADR** (`docs/adr/`) si la feature implique un choix d'architecture
   - **Documentation utilisateur métier** (`docs/user/`, CDC §IV.8) si la feature change un parcours utilisateur

## Template `docs/features/<feature>.md`

Une feature traverse potentiellement plusieurs apps (contracts + backend-pays + backend-central + frontend + IoT). Sa doc **ne vit pas dans une app** — elle vit dans `docs/features/` et sert de **source de vérité cross-app**, en orchestrant les liens vers code, tests, ADR, Swagger, doc utilisateur.

```markdown
---
title: <Nom de la feature>
owner: <prénom>
status: draft | in-progress | implemented | deprecated
cdc-ref: "§III.1"                  # section du CDC couverte
adr-refs: [0003, 0005]             # ADR qui la cadrent, si applicable
updated: YYYY-MM-DD
---

# <Nom de la feature>

## Objectif métier
2-3 phrases : pourquoi cette feature existe, pour qui, quel irritant elle résout.
Cite la section CDC concernée.

## Scope
**Inclus :** ...
**Hors scope :** ...

## Parcours utilisateur
User stories ou étapes clés.
- En tant que <rôle>, je veux <action> afin de <bénéfice>.

## Règles métier
Conditions, seuils, invariants, cas limites, références aux constantes de `@futurekawa/contracts`.

## Modèle de données
Entités et relations impactées. Lien vers `docs/architecture/database.md` pour le schéma complet.

## Contrats API / MQTT
| Type | Contrat | Fichier |
|---|---|---|
| REST | `POST /api/v1/lots` | `apps/backend-pays/src/lots/interface/lots.controller.ts` |
| MQTT | `futurekawa/{country}/warehouse/{id}/measurement` | `apps/backend-pays/src/mqtt/` |
| Types | `Lot`, `CreateLotDto` | `packages/contracts/src/lot.ts` |

Swagger : `/api-docs#/Lots`

## Architecture technique
Flux traversant les apps. Diagramme Mermaid inline si utile.
Points d'attention : résilience, cache, auth.

## Implémentation
Pointeurs vers le code (clean archi par couche) :
- **Domain** : `apps/<app>/src/<feature>/domain/`
- **Application** : `apps/<app>/src/<feature>/application/`
- **Infrastructure** : `apps/<app>/src/<feature>/infrastructure/`
- **Interface** : `apps/<app>/src/<feature>/interface/`
- **Front** : `apps/frontend-web/src/features/<feature>/`

## Tests
| Niveau | Fichier | Couvre |
|---|---|---|
| Unit | `apps/<app>/src/<feature>/application/*.spec.ts` | règles métier pures |
| Intégration | `apps/<app>/test/<feature>.e2e-spec.ts` | API + DB |
| UI | `apps/frontend-web/tests/features/<feature>/*.test.tsx` | composants |
| E2E | `tests/e2e/<feature>.spec.ts` | parcours complet |

## Documentation utilisateur
Lien : [`../user/<feature>.md`](../user/<feature>.md)

## Évolutions / TODO
- [ ] ...
```

## Règles spécifiques au fichier feature

1. **Un fichier par feature**, dans `docs/features/`, nommé `kebab-case.md`.
2. **`owner`** est responsable du maintien à jour à **chaque PR** touchant la feature.
3. **`status`** reflète l'état réel : `draft` avant le premier code, `in-progress` pendant, `implemented` quand la feature est testée et en démo, `deprecated` si abandonnée.
4. **`updated`** mis à jour à chaque modification significative.
5. **Liens relatifs uniquement** vers le code (`../../apps/...`) et les autres docs (`../architecture/...`).
6. **Diagrammes Mermaid inline** tant que c'est lisible. Au-delà → `docs/features/diagrams/<feature>.drawio` + PNG.
7. **Chaque PR touchant la feature** doit linker ce fichier dans sa description.

## Quand une PR n'est pas prête

- Tests manquants sur la règle métier critique → **pas prête**.
- `docs/features/<feature>.md` absent ou non mis à jour (status / updated / tests / implémentation) → **pas prête**.
- Swagger pas à jour (endpoint pas décoré, DTO sans `@ApiProperty`) → **pas prête**.
- **Collection Bruno** (`bruno/`) pas mise à jour pour chaque route ajoutée/modifiée (fichier `.bru` + bloc `docs` + bloc `tests`) → **pas prête**.
- Variables d'env nouvelles mais pas documentées dans `.env.example` → **pas prête**.

## Pourquoi

La soutenance jury évalue explicitement : qualité du travail, exhaustivité des livrables, capacité à expliquer (CDC §IV). Une feature non testée, **ou non documentée en un point unique traçable**, n'est pas un livrable.
