---
description: Commit + push de la branche courante, en respectant les Conventional Commits et les règles de sécurité (jamais sur main/dev directement).
argument-hint: [message optionnel — sinon analysé automatiquement]
---

Commit les changements locaux et push la branche courante.

Entrée optionnelle : $ARGUMENTS

## Vérifications préalables (bloquantes)

1. **Branche actuelle** : ne **jamais** commit ou push directement sur `main` ou `dev`. Si c'est le cas, **stopper** et demander à l'utilisateur de créer une branche (`feat/…`, `fix/…`, `refacto/…`).
2. **Pre-commit** : Husky + lint-staged doit tourner. Ne **jamais** passer `--no-verify`.
3. **Tests et lint** : lancer `pnpm -r lint && pnpm -r test` sur la portée impactée. Si échec → **stopper** et proposer `/fix`.
4. **Règle `/rules`** : vérifier rapidement :
   - `docs/features/<feature>.md` à jour pour les features touchées
   - Bruno à jour si routes modifiées
   - Swagger à jour

## Workflow

1. **`git status` + `git diff`** pour identifier les changements.
2. **`git log --oneline -10`** pour respecter le style des commits existants.
3. **Analyser les changements** et les **grouper en commits logiques** si nécessaire (un commit ≠ un fourre-tout).
4. Pour chaque commit :
   - Rédiger un message **Conventional Commits** : `type(scope): description impérative` + corps optionnel.
   - Référencer l'issue liée : `(#<issue>)` dans le sujet ou `Refs: #<issue>` dans le corps.
   - **Ne pas** inclure de co-authored-by ou d'indication d'outil automatisé sauf si demandé.
5. **`git add`** explicitement les fichiers concernés (jamais `git add -A` à l'aveugle).
6. **`git commit`** avec le message.
7. **Vérifier** le statut post-commit (`git status`).
8. **Push** : `git push -u origin <branch>` (avec `-u` au premier push).
9. **Proposer** de créer une PR si ce n'est pas déjà fait :
   ```bash
   gh pr create --base dev --fill --web
   ```

## Règles

- **Types Conventional Commits** autorisés : `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`.
- **Scopes courants** : `pays`, `central`, `front`, `iot`, `contracts`, `docker`, `ci`, `docs`.
- **Titre ≤ 72 caractères**, impératif anglais recommandé (français accepté par cohérence d'équipe).
- **Corps** pour le POURQUOI, pas le QUOI (le diff dit le quoi).
- **Jamais `--force` / `--force-with-lease`** sans accord explicite de l'utilisateur. Jamais sur `main` / `dev`.
- **Jamais `--no-verify`** pour bypass un hook qui échoue — fix la cause.

## Anti-patterns à refuser

- Commit qui mélange fix + feature + refacto
- Push direct sur `main` ou `dev`
- Commit "wip" ou "tmp" en l'état (renommer avant push)
- Bypass de Husky
- Force push sans accord explicite
