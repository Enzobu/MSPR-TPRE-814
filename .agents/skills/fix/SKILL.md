---
name: fix
description: Corrige un bug selon la méthode test-first (reproduire, test qui échoue, fix, vérifier). À déclencher quand l'utilisateur signale un bug à corriger avec référence à un ticket. Respecte les règles projet.
---

Corrige un bug de manière propre et régressive-safe.

## Pré-requis

- **Un ticket GitHub Issue** décrivant le bug avec **reproduction steps** et **comportement attendu**. Si absent, proposer la skill `create-ticket` d'abord.

## Workflow

1. **Lire** le ticket (`gh issue view <id>`).
2. **Reproduire localement** le bug (commande, scénario). Si impossible → demander à l'utilisateur une repro minimale avant de continuer.
3. **Créer une branche** `fix/<scope>-<desc-kebab>` depuis `dev`.
4. **Déléguer** au subagent `tester` pour écrire un **test qui échoue** reproduisant le bug. Le test doit cibler le comportement attendu, pas l'implémentation.
5. Vérifier que le test échoue bien sur la branche actuelle (`pnpm --filter <app> test -- -t "<nom>"`).
6. **Corriger** le code avec le subagent approprié (`nest-expert`, `frontend-expert`, `iot-expert`).
7. Vérifier que le test passe **et** que les autres tests continuent de passer (`pnpm --filter <app> test`).
8. **Mettre à jour** `docs/features/<feature>.md` du ou des features touchées (`updated`, éventuellement commentaire dans TODO).
9. **Mettre à jour Bruno** si le bug était sur une route (cas de réponse, shape, etc.).
10. **Proposer la skill `commit`**.

## Règles spécifiques fix

- **Root cause fix** : ne pas masquer le symptôme. Comprendre **pourquoi** ça bug, corriger la cause.
- **Pas de refactor** dans un fix : si tu vois du code à nettoyer, crée un ticket `refacto` séparé.
- **Test de non-régression obligatoire** : sans test, le fix est incomplet.
- **Commit message** : `fix(scope): <description> (#<issue>)`.

## Anti-patterns à refuser

- Fix sans test de non-régression
- "Fix" qui désactive un test existant
- "Fix" en attrapant silencieusement une exception
- Fix qui contourne la clean archi (ex. coder en dur dans un contrôleur au lieu de passer par le use-case)
