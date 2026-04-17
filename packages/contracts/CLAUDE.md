# @futurekawa/contracts

Librairie TypeScript **partagée** : types, DTO, enums, constantes métier.

Importée par `backend-pays`, `backend-central`, `frontend-web`. **Pas importée par `iot/`** (C++, pas consommable).

Contexte global : voir le `CLAUDE.md` racine.

## Rôle

**Source unique de vérité** pour les contrats partagés entre apps. Si tu ajoutes un champ à `Lot` ici, TypeScript remonte l'impact chez tous les consommateurs — c'est l'intérêt du monorepo.

Contient notamment :
- `Lot`, `LotStatus`, `CreateLotDto`
- `Measurement`, `IngestMeasurementDto`
- `Alert`, `AlertType`
- `CountryCode`, `CountryConditions`, `COUNTRY_CONDITIONS` (seuils + tolérances par pays)

## Commandes

```bash
pnpm build           # tsc → dist/
pnpm dev             # tsc --watch
pnpm clean           # rm -rf dist
```

Les consommateurs (`backend-pays`, `backend-central`, `frontend-web`) voient les types dès que `dist/` est à jour.

## Règles

> Les règles transverses du monorepo sont dans `.claude/commands/rules.md` (`/rules`). Celles-ci s'ajoutent.

- **Pure library** : aucune dépendance runtime (pas de `@nestjs/...`, pas de `react`, pas d'HTTP client, pas de `zod` ou `class-validator` — ces decorators vivent côté app).
- **Uniquement des types + constantes statiques**. Pas de logique métier, pas de classe instanciable, pas de singleton.
- **Pas d'import depuis les apps** (`@futurekawa/contracts` ne doit **jamais** importer de `apps/*`).
- **Rebuild obligatoire** après modification (`pnpm --filter @futurekawa/contracts build`) pour que les consommateurs voient les changements — ou lancer `pnpm dev` en watch dans un terminal dédié.
- **Versioning** : `private: true`, jamais publié sur npm. Consommé exclusivement via `workspace:^`.
- **Changement de type = breaking change potentiel** : ajouter un champ optionnel plutôt que modifier un existant quand possible. Un rename ripple partout — le faire volontairement, en un PR dédié.

## Où placer quoi

| Ajout | Fichier |
|---|---|
| Nouveau type d'entité métier | nouveau fichier `src/xxx.ts` + export dans `src/index.ts` |
| DTO d'une requête/réponse | à côté du type d'entité |
| Enum / union de string littérale | à côté du type concerné |
| Constante métier (seuils, etc.) | `src/country.ts` si par pays, sinon nouveau fichier dédié |
