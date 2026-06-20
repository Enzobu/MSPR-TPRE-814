---
title: Déploiement du site de documentation (service Docker)
owner: Yanis
status: accepted
updated: 2026-06-20
cdc-ref: "§IV.8"
adr-refs: [0009]
---

# 0010 — Déploiement du site de documentation (service Docker)

## Contexte

L'[ADR-0009](0009-vitepress-user-docs.md) a retenu **VitePress** pour la doc
utilisateur mais a **laissé l'hébergement hors scope** (« à décider séparément »).
Résultat : le site n'était consultable qu'en local (`pnpm docs:dev`) ou via un
build statique non publié ; un job CI `docs` se contentait de **vérifier** que
`pnpm docs:build` passait, sans déployer l'artefact.

Il faut donc décider **comment** servir ce site en production, sachant que le
reste de la solution est déployé via **Docker Compose + Dokploy**.

### Options envisagées

1. **Sous-chemin du frontend** (`/docs` sur le Nginx de `frontend-web`).
2. **GitHub Pages** (publication du build via la CI, hors infra Dokploy).
3. **Service Docker dédié** dans la stack compose *(retenu)*.

## Décision

Nous ajoutons un **service Docker `docs`** à `docker-compose.yml` : une image
multi-stage (build VitePress → `nginx-unprivileged` statique, port 8080), buildée
**avec le reste de la stack** et déployée par Dokploy (idéalement sur un
sous-domaine dédié, ex. `docs.…`).

Conséquence directe : le site étant construit par `docker compose build`, le
**job CI dédié `docs` est supprimé** (le `docs:build` est désormais exercé par le
job `docker-build`). Les scripts `docs:dev` / `docs:build` / `docs:preview`
restent pour le dev local.

### Détails

- `docs/Dockerfile` + `docs/nginx.conf` (statique, `cleanUrls`, en-têtes de
  sécurité). Pas de CSP stricte : VitePress injecte des scripts inline (anti-FOUC
  dark mode) ; site **statique public** sans entrée utilisateur ni secret → risque
  XSS négligeable (cf. commentaire dans `docs/nginx.conf`).
- `lastUpdated` VitePress **désactivé** : il exécute `git log` par page, absent du
  build Docker hermétique. La fraîcheur reste portée par le frontmatter `updated`
  (règle 05).
- Variables : `DOCS_WEB_PORT` (+ `DOCS_WEB_URL`).

## Pourquoi pas les autres options

- **Sous-chemin `/docs`** : couple la doc au cycle de vie, aux en-têtes/CSP et au
  routing SPA du frontend (risque de collision avec le `try_files … /index.html`).
  Moins propre.
- **GitHub Pages** : très correct pour du statique, mais **hors** de l'écosystème
  de déploiement du projet (Dokploy) → chaîne et observabilité séparées.

## Conséquences

### Positives

- Doc **déployée** et accessible en prod, **découplée** de l'app (cycle de vie,
  domaine, en-têtes propres).
- Cohérente avec le déploiement existant (Compose + Dokploy).
- **Une étape CI en moins** (plus de job `docs` redondant) ; le build est couvert
  par `docker-build`.

### Négatives

- Un conteneur de plus à déployer/superviser.
- Perte de `lastUpdated` automatique (compensée par le frontmatter `updated`).

### Neutres

- Le **sous-domaine** public reste à mapper côté Dokploy (hors dépôt).
- Étend l'ADR-0009 sur le seul point « hébergement » ; le choix VitePress reste
  inchangé.

## Références

- [ADR-0009 — VitePress pour la doc utilisateur](0009-vitepress-user-docs.md)
- `docs/Dockerfile`, `docs/nginx.conf`, `docker-compose.yml` (service `docs`).
- CI : `.github/workflows/ci.yml` (job `docs` supprimé).
