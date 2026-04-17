# Bruno — Collection API FutureKawa

Collection Bruno versionnée du monorepo, partagée par toute l'équipe.

## Installation

1. Installer [Bruno](https://www.usebruno.com/) (desktop ou CLI).
2. Dans Bruno, **Open Collection** → pointer sur ce dossier `bruno/`.
3. Sélectionner un environnement dans le sélecteur en haut à droite.

## Environnements

| Environnement | Cible | Port | Usage |
|---|---|---|---|
| `local-central` | backend-central (siège) | 3000 | développement local principal |
| `local-pays-br` | backend-pays Brésil | 3010 | tests directs sur le pays BR |
| `local-pays-ec` | backend-pays Équateur | 3011 | tests directs sur le pays EC |
| `local-pays-co` | backend-pays Colombie | 3012 | tests directs sur le pays CO |
| `prod` | prod | — | placeholder, secrets à remplir via Bruno (jamais commit) |

## JWT auto-stocké

1. Lancer `POST central/auth/login` (avec `local-central` sélectionné).
2. Le script `post-response` stocke `accessToken` + `refreshToken` dans les variables d'environnement (marquées `secret`).
3. La **collection** (`collection.bru`) applique automatiquement le header `Authorization: Bearer {{accessToken}}` à toutes les requêtes suivantes.
4. Pour forcer une route publique : mettre `auth: none` dans la requête (cf. `login.bru`).

## Correlation ID

Chaque requête envoie un header `x-correlation-id` unique (script `pre-request` de la collection). Les logs serveur doivent le propager — voir `.claude/rules/08-observability.md`.

## Règle de contribution

**Chaque route ajoutée ou modifiée dans un backend doit mettre à jour Bruno dans le même PR** :

- ajouter / modifier le `.bru` correspondant dans `central/` ou `pays/`
- écrire le bloc `docs { ... }` avec contrat, erreurs, effets de bord, références ADR
- écrire le bloc `tests { ... }` (status attendu + shape de la réponse au minimum)
- vérifier que la requête tourne contre l'env `local-*` correspondant

Voir `.claude/rules/05-documentation.md` et le CLAUDE.md de chaque backend.

## Structure

```
bruno/
├── bruno.json                     config collection
├── collection.bru                 auth bearer héritée + correlation ID
├── environments/
│   ├── local-central.bru
│   ├── local-pays-br.bru
│   ├── local-pays-ec.bru
│   ├── local-pays-co.bru
│   └── prod.bru
├── central/                       routes du backend siège
│   └── auth/
│       └── login.bru              ← exemple implémenté (route 404 tant que l'ADR auth n'est pas tranchée)
└── pays/                          routes d'un backend pays (via env local-pays-*)
```
