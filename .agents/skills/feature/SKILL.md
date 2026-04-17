---
name: feature
description: Implémente une feature de bout en bout en respectant toutes les règles du projet (clean archi, DTO in/out, tests, docs features, Bruno, Swagger, contracts). À déclencher quand l'utilisateur demande l'implémentation d'un ticket existant (ex. 'feature #17'). Délègue à l'orchestrator et aux subagents experts.
---

Implémente une feature complète **dans le respect strict de toutes les règles** du projet.

## Pré-requis obligatoires

1. **Un ticket GitHub Issue existe** avec critères d'acceptance. Si l'argument n'est pas un numéro d'issue :
   - demander si un ticket existe ; si non, proposer de lancer `create-ticket` d'abord et **stopper**.
   - si l'utilisateur insiste sans ticket, créer un ticket **avant** toute autre action.

## Workflow (orchestré)

Utilise le subagent **`orchestrator`** (`.codex/agents/orchestrator.toml`) pour décomposer et déléguer :

1. **Lire** le ticket (`gh issue view <id>`), `consigne-structuree.md`, charger la skill `rules`, lire l'`AGENTS.md` des sous-projets touchés.
2. **Créer `docs/features/<feature>.md`** en suivant le template de `.codex/rules/03-feature.md` :
   - `status: draft`
   - lien vers l'issue, CDC ref, ADR refs
3. **Créer une branche** `feat/<scope>-<desc-kebab>` depuis `dev`.
4. **Décomposer** en sous-tâches :
   - modif des types partagés → `packages/contracts`
   - domaine + cas d'usage → subagent `nest-expert` ou `frontend-expert`
   - infra (Prisma repo, MQTT, HTTP client) → `nest-expert`
   - interface (controllers + DTO in/out, UI) → expert approprié
   - tests unit + intégration + e2e → subagent `tester`
   - Bruno (`.bru` par route avec `docs` + `tests`) → `nest-expert`
   - Swagger (décorateurs) → `nest-expert`
   - doc user (`docs/user/`) si parcours métier changé
5. **Mettre à jour** `docs/features/<feature>.md` au fur et à mesure (`status: in-progress` → `implemented`).
6. **Vérifier** les critères d'acceptance du ticket un par un.
7. **Lancer** `pnpm -r lint && pnpm -r test && pnpm -r build` avant de considérer la feature terminée.
8. **Proposer la skill `commit`** pour commit + push quand tout est vert.

## Règles à respecter obligatoirement

Charger les règles via la skill `rules` avant de commencer. Points d'attention :

- **Clean architecture** : domain / application / infrastructure / interface — dependency rule stricte.
- **DTO d'entrée ET de sortie** : toujours, jamais de type Prisma ni d'entité domaine exposée au contrôleur.
- **Types partagés** via `@futurekawa/contracts` uniquement — si un type manque, l'ajouter au package + rebuild.
- **Tests** : au moins unitaire sur la logique métier ; intégration si la feature traverse DB / MQTT / HTTP ; e2e si parcours utilisateur.
- **Documentation** : `docs/features/<feature>.md` + Swagger + Bruno + README/env.example si changé.
- **Conventional Commits** : un commit par étape logique, pas un méga-commit final.
- **REST** : pluriels, RFC 7807, `/api/v1`, pagination standard.
- **Front** : feature-first (`src/features/<feature>/`), tests dans `tests/`, axios via `http-client`, couleurs shadcn.

## Critère d'arrêt

La feature est **terminée** quand :
- [ ] Tous les critères d'acceptance du ticket sont cochés
- [ ] `pnpm -r lint && pnpm -r test && pnpm -r build` passent
- [ ] `docs/features/<feature>.md` a `status: implemented` et `updated` à jour
- [ ] Bruno est à jour pour chaque nouvelle route
- [ ] Swagger est exhaustif
- [ ] La branche est prête à être commitée/poussée (lancer la skill `commit`)

## Anti-patterns à refuser

- Modifier directement une app sans passer par un ticket
- Commencer à coder avant d'avoir créé `docs/features/<feature>.md`
- Contourner la clean archi "pour aller vite"
- Retourner une entité Prisma depuis un contrôleur
- Oublier de mettre à jour Bruno quand une route bouge
