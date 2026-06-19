---
title: Index des ADR
owner: Yanis
status: in-progress
updated: 2026-06-19
---

# ADR — Architecture Decision Records

Ce dossier consigne les **décisions d'architecture** structurantes de FutureKawa.
Chaque ADR fige un choix, son contexte et ses conséquences.

## Principes

- **Un fichier par décision** : `NNNN-kebab-case.md` (N sur 4 chiffres).
- **Immuabilité** : un ADR `accepted` ne se modifie plus. Pour changer une décision,
  créer un **nouvel** ADR qui *supersede* l'ancien (champ `superseded-by`).
- **Template canonique** : [`0000-template.md`](0000-template.md), conforme à
  [`.claude/rules/05-documentation.md`](../../.claude/rules/05-documentation.md).
- **Cycle de vie du statut** : `proposed` → `accepted` (validé par un pair en PR)
  → éventuellement `superseded`.
- **Just-in-time** : les ADR `proposed` ci-dessous sont rédigés au fur et à mesure,
  dans le ticket de la feature qu'ils cadrent — pas en avance sur le code.

## Index

| ADR | Titre | Statut | Cadre (tickets) |
|---|---|---|---|
| [0001](0001-distributed-architecture.md) | Architecture distribuée pays/siège | `accepted` | #2 |
| [0002](0002-prisma-schema.md) | Schéma Prisma (pays + central) | `accepted` | #24, #29 |
| [0003](0003-mqtt-convention.md) | Convention MQTT (topics + payload + QoS) | `accepted` | #27, #28, #31 |
| [0004](0004-alerting-strategy.md) | Stratégie d'alerting (seuils, cron, email) | `accepted` | #32, #33, #39 |
| [0005](0005-frontend-stack.md) | Stack frontend (router, query, charts, tests) | `accepted` | #25, #30 |
| [0006](0006-auth-strategy.md) | Stratégie d'authentification | `accepted` | #19, #20, #50 |
| 0007 | Résilience & indisponibilités partielles | `proposed` | #36, #37 |
| 0008 | Stratégie de tests (pyramide, outils) | `proposed` | #26, #31, #38, #39, #42 |

> Les titres des ADR `proposed` sont **provisoires** : ils fixent le périmètre
> attendu de la décision. Le contenu définitif est rédigé dans le ticket associé.

## Rédiger un nouvel ADR

1. Copier [`0000-template.md`](0000-template.md) vers `docs/adr/NNNN-kebab-case.md`.
2. Renseigner le frontmatter (`title`, `owner`, `status: proposed`, `updated`,
   + `cdc-ref` / `adr-refs` si applicable).
3. Remplir Contexte / Décision / Conséquences.
4. Ajouter la ligne correspondante dans le tableau d'index ci-dessus.
5. Ouvrir une PR : la validation d'un pair fait passer le statut à `accepted`.
