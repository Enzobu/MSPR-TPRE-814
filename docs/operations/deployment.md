---
title: Déploiement
owner: Yanis
status: in-progress
cdc-ref: "§IV.5"
adr-refs: [0001]
updated: 2026-06-20
---

# Déploiement

Procédure de déploiement de la solution, du **local** à la **production**. La
CI/CD repose sur **GitHub Actions** (`.github/workflows/ci.yml`), le déploiement
est délégué à **Dokploy** (orchestrateur Docker Compose). Le détail des jobs du
pipeline est dans [`../ci-cd/github-actions.md`](../ci-cd/github-actions.md).

## Vue d'ensemble

```mermaid
flowchart LR
    PR["PR sur dev"] -->|CI verte + review| M["merge dev"]
    M -->|release| MAIN["merge sur main"]
    MAIN -->|"job deploy (si ref=main)"| DOK["Dokploy API<br/>compose.deploy"]
    DOK --> PROD["Stack prod<br/>(docker compose)"]
```

- **`dev`** : intégration continue (build + tests + e2e + Sonar). **Pas** de déploiement.
- **`main`** : le job `deploy` se déclenche (`if: github.ref == 'refs/heads/main'`)
  et appelle l'API Dokploy qui redéploie le `docker-compose` de prod.

## 1. Déploiement local (toute la stack)

```bash
cp .env.compose.example .env.compose   # renseigner les valeurs
docker compose --env-file .env.compose build
docker compose --env-file .env.compose up -d
```

Vérifier :

```bash
docker compose ps
curl -fsS http://localhost:${BACKEND_CENTRAL_PORT}/ready
# UI : http://localhost:${FRONTEND_WEB_PORT}
```

> Reproduire le build « comme la CI » : `pnpm -r build` puis
> `docker compose build`.

## 2. Déploiement en production

Le déploiement prod est **automatique** sur `main` :

1. Ouvrir une PR vers `dev`, faire passer la CI + review, merger.
2. Quand une release est prête, merger `dev` → `main` (via PR).
3. Le job **`deploy`** (GitHub Actions) s'exécute après `sonarqube` et appelle :

   ```bash
   curl -X POST "https://<dokploy>/api/compose.deploy" \
     -H "x-api-key: $DOKPLOY_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"composeId":"<DOKPLOY_COMPOSE_ID>"}'
   ```

4. Dokploy reconstruit et redémarre la stack `docker-compose` de prod.

### Secrets requis (GitHub → Settings → Secrets)

| Secret | Usage |
|---|---|
| `DOKPLOY_API_KEY` | Authentifie l'appel de déploiement |
| `DOKPLOY_COMPOSE_ID` | Identifie la stack compose à redéployer |
| `SONAR_TOKEN`, `SONAR_HOST_URL` | Analyse SonarQube (job précédent) |

### Variables d'environnement de prod

Le `docker-compose.yml` est entièrement **paramétré par variables** (voir
`.env.compose.example`) : ports, DB (`DATABASE_*_URL`), MQTT (`MQTT_*`), SMTP
(`SMTP_*`, `ALERT_*`), CORS (`*_CORS_ORIGIN`), JWT (`JWT_*`). En prod, ces valeurs
viennent de l'environnement Dokploy, **jamais** du dépôt. Durcissement prod
(secrets hors-image, TLS, CSP) : ticket #50.

> ⚠️ Le `docker-compose.yml` versionné fixe `JWT_SECRET=change-me-for-local-compose-only`
> pour le local : **doit être surchargé** en prod par un vrai secret.

## 3. Preuve d'exécution (jury)

> 📸 **À compléter (#51)** : insérer ici une capture d'un run GitHub Actions vert
> (workflow `Build`) et un extrait de log du job `deploy` (code HTTP 2xx renvoyé
> par l'API Dokploy). Cette étape nécessite un accès au dépôt GitHub / Dokploy et
> est réalisée par l'équipe.

## 4. Rollback

En cas de déploiement défaillant :

1. **Re-déployer la version précédente** : remettre `main` sur le dernier commit
   stable puis relancer le déploiement.

   ```bash
   git revert <commit-fautif>   # ou reset sur le tag stable, via PR
   # le merge sur main relance le job deploy
   ```

2. **Rollback côté Dokploy** : redéployer le `composeId` sur l'image/tag stable
   précédent depuis l'interface Dokploy (ou rappeler `compose.deploy` après avoir
   pointé sur la version antérieure).
3. **Vérifier** : `/ready` des backends + UI + flux MQTT (voir
   [`runbook.md`](runbook.md)).

> 🔁 **Rollback à tester (#51)** : valider la procédure sur l'environnement réel
> et joindre la preuve.

## Références

- Pipeline détaillé : [`../ci-cd/github-actions.md`](../ci-cd/github-actions.md)
- Images & compose : [`../ci-cd/docker.md`](../ci-cd/docker.md)
- Opérations courantes : [`runbook.md`](runbook.md)
- Architecture distribuée : [`../architecture/distributed.md`](../architecture/distributed.md)
- Pipeline : `.github/workflows/ci.yml`
