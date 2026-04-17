# 02 — Code (TypeScript)

## Strictness

- **TS strict** activé partout. Pas de `any`.
- Les `as X` sont justifiés par un commentaire `// WHY: ...`.
- **Type de retour explicite** sur toute méthode publique.

## Petites unités

- Fichier **≤ 200 lignes** (règle molle, à assouplir uniquement si justifié).
- Fonction **≤ 40 lignes**.
- **Early return** plutôt que pyramides `if/else`.

## Commentaires

- **Pas de commentaires qui décrivent le QUOI** (le code le dit déjà).
- **Commentaires autorisés** uniquement pour le POURQUOI : invariant, workaround, contrainte non évidente, référence à un ticket ou un incident.

## Nommage

- `PascalCase` pour classes et types.
- `camelCase` pour variables et méthodes.
- `SCREAMING_SNAKE_CASE` pour constantes exportées.
- Noms en **anglais** pour le code, **français acceptable** pour les commentaires/doc métier.
