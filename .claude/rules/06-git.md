# 06 — Git & workflow

## Conventional Commits

Format : `type(scope): description`

Types autorisés :

| Type | Usage |
|---|---|
| `feat` | nouvelle fonctionnalité |
| `fix` | correction de bug |
| `docs` | documentation uniquement |
| `refactor` | refactor sans changement de comportement |
| `test` | ajout / correction de tests |
| `chore` | maintenance (deps, config) |
| `ci` | pipeline Jenkins / Docker |
| `style` | formatage uniquement (rare si Prettier tourne) |

Scopes suggérés : `pays`, `central`, `front`, `iot`, `contracts`, `docker`, `ci`, `docs`.

Exemples :
- `feat(pays): add MQTT subscriber for measurements`
- `fix(front): correct FIFO sort on lot list`
- `docs(adr): add ADR-0003 on MQTT topic convention`
- `chore(contracts): rebuild after Lot schema update`

## Branches

- Base : `dev` (et `main` comme tag release).
- `feat/<scope>-<desc>`, `fix/<scope>-<desc>`, `chore/<scope>-<desc>`, `docs/<scope>-<desc>`.
- Exemple : `feat/pays-mqtt-subscriber`, `fix/front-fifo-sort`.

## Pull requests

- **Aucun commit direct sur `dev` ou `main`** — toujours via PR, y compris en équipe de 4.
- **Review obligatoire** d'un pair avant merge.
- Description de PR : contexte + changement + comment tester + liens (issue, ADR, CDC).
- Pas de PR "de fin de journée" sans relecture — mieux vaut laisser en draft.

## Pre-commit

- **Husky + lint-staged** tournent automatiquement (Prettier + ESLint sur les fichiers staged).
- **Ne jamais bypass** avec `--no-verify`. Si le hook échoue → fix la cause, pas le symptôme.

## Signature & push

- `git push` depuis une branche feature uniquement.
- `git push --force` uniquement sur **sa propre branche** et après avertissement à l'équipe.
- **Jamais** de `git push --force` sur `dev` ou `main`.
