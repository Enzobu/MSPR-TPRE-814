# 05 — Documentation

## Arborescence imposée de `docs/`

Toute la documentation du projet vit dans `docs/`, avec la structure suivante. **Aucune autre racine de documentation** n'est autorisée (pas de `documentation/`, pas de `wiki/`, pas de markdown doc à la racine des apps en dehors du `README.md` prévu).

```
docs/
├── README.md                        index + conventions
│
├── architecture/                    §IV.4.1 CDC — archi globale
│   ├── README.md
│   ├── overview.md                  vision + composants + flux
│   ├── distributed.md               pays ↔ siège, résilience
│   ├── database.md                  schémas Prisma, ER diagram
│   ├── mqtt.md                      topics, payloads, QoS
│   ├── api.md                       conventions REST + lien Swagger
│   └── diagrams/                    sources .drawio / .puml / .mmd
│
├── features/                        1 fichier par feature métier (cross-app)
│   ├── README.md                    index + template
│   ├── <feature>.md                 (voir règle 03)
│   └── diagrams/                    si diagrammes feature trop lourds pour inline
│
├── iot/                             §IV.4.2 CDC
│   ├── README.md
│   ├── hardware.md                  câblage, choix matériel, limites
│   ├── protocol.md                  MQTT topics/payloads/fréquences
│   └── firmware.md                  archi firmware + reconnexion
│
├── testing/                         §IV.4.3 CDC
│   ├── README.md
│   ├── strategy.md                  typologie + pyramide + outils
│   ├── test-plan.md                 cas de test + jeux de données + critères
│   └── anomalies.md                 process correction / retest
│
├── adr/                             décisions d'architecture (immuables)
│   ├── README.md                    index + template
│   └── NNNN-titre.md
│
├── ci-cd/                           §IV.5 CDC
│   ├── README.md
│   ├── jenkins.md                   pipelines + preuves d'exécution
│   └── docker.md                    images + compose
│
├── user/                            §IV.8 CDC — doc métier (français)
│   ├── README.md
│   ├── getting-started.md
│   ├── lots.md
│   ├── monitoring.md
│   ├── alerts.md
│   └── faq.md
│
├── phase-2/                         §IV.9 + §IV.10 CDC
│   ├── README.md
│   ├── automation-schema.md         capteurs → décision → actionneurs + sécurités
│   └── interview-questionnaire.md
│
└── operations/                      pilotage run
    ├── runbook.md
    ├── deployment.md
    └── troubleshooting.md
```

## Règles de rédaction

1. **Chaque sous-dossier a un `README.md`** qui sert d'index et liste le contenu.
2. **Frontmatter YAML obligatoire** en tête de chaque document :
   ```yaml
   ---
   title: <titre court>
   owner: <prénom>
   status: draft | in-progress | implemented | deprecated
   updated: YYYY-MM-DD
   ---
   ```
   Pour les docs liées à une exigence CDC, ajouter `cdc-ref: "§III.2"`.
   Pour les docs liées à des décisions, ajouter `adr-refs: [0003, 0005]`.
3. **Nommage de fichier** : `kebab-case.md`. Les ADR : `NNNN-kebab-case.md` avec N sur 4 chiffres.
4. **Markdown uniquement** pour le contenu.
5. **Diagrammes** :
   - Simples → **Mermaid** inline dans le markdown (versionnable, diffable).
   - Complexes → `docs/<section>/diagrams/` au format `.drawio` ou `.puml` (sources versionnées), PNG exporté à côté pour visualisation dans le markdown.
6. **Pas de duplication** : linker, ne jamais recopier.
7. **Liens relatifs** uniquement (`../architecture/database.md`), pas d'URL absolue vers le repo.
8. **Diagrammes générés** (Prisma ERD, Swagger HTML) → hors git, régénérés par script. Le markdown linke la commande de génération, pas l'artefact.
9. **Langue** :
   - `docs/user/` → **français** (audience métier).
   - Autres sections → au choix de l'équipe, mais **une langue par fichier** (pas de franglais).
10. **Ownership** : le `owner` du frontmatter est responsable du maintien à jour.
11. **`updated`** est mis à jour à chaque modification significative du contenu.

## Swagger / OpenAPI (backends)

- **Exhaustif** : chaque endpoint, chaque DTO d'entrée, chaque DTO de sortie décorés.
- Décorateurs `@ApiTags`, `@ApiOperation({ summary, description })`, `@ApiProperty({ example, description })`, `@ApiResponse`.
- **Exemples réalistes** dans les `@ApiProperty` (pas `"string"` ou `123`).
- Doc exposée sur `/api-docs`. `docs/architecture/api.md` linke les Swagger des backends.

## Bruno — collection API versionnée

La collection Bruno vit dans `bruno/` à la racine du monorepo. Elle est **commitée** et partagée par toute l'équipe.

**Règle impérative** : **toute route ajoutée ou modifiée dans un backend met à jour Bruno dans le même PR** :

1. Un fichier `.bru` par route, placé dans `bruno/central/<scope>/` ou `bruno/pays/<scope>/` selon le backend ciblé.
2. Bloc `docs { ... }` obligatoire : contrat (params, body, réponses, erreurs), références ADR, effets de bord (token capturé, etc.).
3. Bloc `tests { ... }` obligatoire : au minimum vérifier le status attendu et la shape de la réponse.
4. Si la route émet/consomme un JWT : mettre à jour les scripts `post-response` / la config `auth` en conséquence.
5. La requête doit tourner contre l'environnement `local-*` correspondant (si l'endpoint existe déjà côté code).

Cette règle vaut pour **les deux backends** (central et pays). Voir `bruno/README.md` pour l'usage.

## ADR — Architecture Decision Records

Chaque choix structurant fait l'objet d'un `docs/adr/NNNN-kebab-case.md`. **Les ADR sont immuables** : pour changer une décision, créer un **nouveau** ADR qui *Supersedes NNNN*.

Template :

```markdown
---
title: <Titre court>
owner: <prénom>
status: proposed | accepted | superseded
updated: YYYY-MM-DD
superseded-by: NNNN   # uniquement si status == superseded
---

# NNNN — Titre court

## Contexte
Pourquoi la décision se pose, contraintes, options envisagées.

## Décision
Ce qui est décidé, explicitement.

## Conséquences
Positives, négatives, neutres.
```

Exemples de sujets ADR pour FutureKawa : archi distribuée pays/siège, MariaDB vs Postgres, convention topics MQTT, alerting sync/async, stratégie d'auth, choix router / data fetching / charts.

## README par app

Chaque app (`apps/*`) a un `README.md` court avec :

1. Rôle de l'app (1 paragraphe)
2. Stack
3. Commandes de dev (`pnpm dev`, `pnpm build`, `pnpm test`…)
4. Variables d'env attendues (pointer vers `.env.example`)
5. Endpoints principaux ou points d'entrée
6. Lien vers le `CLAUDE.md` de l'app et vers `docs/features/` pour le détail métier

## README racine du repo

Présentation du projet, lien vers `consigne-structuree.md`, arborescence, installation (`pnpm install`, `docker compose up`), commandes workspace, pointeurs vers `docs/`.

## Documentation utilisateur métier (CDC §IV.8)

Vit dans `docs/user/` en **français**, structure libre mais contenu imposé par le CDC :

- Prise en main de l'interface Web (parcours, captures)
- Création / consultation de lots
- Lecture des courbes T°/humidité
- Compréhension des alertes et actions à mener
- FAQ / résolution des problèmes simples
