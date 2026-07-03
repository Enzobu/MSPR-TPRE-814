---
title: Déploiement
owner: Yanis
status: implemented
cdc-ref: "§IV.5"
adr-refs: [0001]
updated: 2026-07-03
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

Run de référence : **Build #28649726905**, déclenché par push sur `main`
le **2026-07-03 08:53:55 UTC**, commit
`2d46e453e900fd9bace59bf826478b9d9c782090`.

Lien GitHub Actions :
`https://github.com/Enzobu/MSPR-TPRE-814/actions/runs/28649726905`

Synthèse du run :

| Job | Statut | Preuve |
|---|---|---|
| Build Docker images | success | images Docker construites via `docker compose --env-file .env.compose.ci build` |
| Run tests | success | `pnpm -r lint`, `pnpm -r test`, coverage uploadé |
| Front e2e (Playwright) | success | tests Playwright + rapport uploadé |
| SonarQube analysis | success | scan + Quality Gate |
| Deploy | success | appel Dokploy accepté |

Capture : [`../ci-cd/capture_ecran_preuve_ci_cd.png`](../ci-cd/capture_ecran_preuve_ci_cd.png)

Extrait du job `Deploy` :

```text
HTTP code: 200
{"success":true,"message":"Deployment queued","composeId":"***"}
```

Les secrets (`DOKPLOY_API_KEY`, `DOKPLOY_COMPOSE_ID`) sont masqués par GitHub
dans les logs (`***`).

## 4. Rollback

En cas de déploiement défaillant :

1. **Identifier le commit fautif et le dernier commit stable** depuis l'onglet
   Actions ou l'historique Git. Ne pas reverter automatiquement le dernier merge
   si plusieurs correctifs ont été groupés dans la release.
2. **Créer une PR de rollback** depuis une branche dédiée :

   ```bash
   git switch main
   git pull --ff-only
   git switch -c revert/<scope>-<incident>
   git revert <commit-ou-merge-fautif>   # ajouter -m 1 si le commit fautif est un merge
   git push -u origin revert/<scope>-<incident>
   gh pr create --base main --fill
   ```

3. **Merger la PR sur `main`** après review rapide. Le merge relance le workflow
   `Build`, puis le job `Deploy` rappelle Dokploy si la CI est verte.
4. **Rollback côté Dokploy si GitHub est indisponible** : redéployer le
   `composeId` sur l'image/tag stable précédent depuis l'interface Dokploy, ou
   rappeler `compose.deploy` après avoir pointé la stack sur la version stable.
5. **Vérifier** : `/ready` des backends + UI + flux MQTT (voir
   [`runbook.md`](runbook.md)).

### Test de rollback

Test non destructif réalisé le **2026-07-03** dans un worktree temporaire :

```bash
git worktree add /tmp/futurekawa-rollback-test origin/main
cd /tmp/futurekawa-rollback-test
git revert --no-commit -m 1 e08b8533584d268f204d7ef3719481377f0af980
git status --short
git worktree remove --force /tmp/futurekawa-rollback-test
```

Résultat : le revert Git du merge testé passe sans conflit. Le `git status`
montre les fichiers qui seraient restaurés avant création de la PR de rollback ;
cela confirme aussi qu'il faut choisir le commit fautif avec précision pour ne
pas retirer des changements valides inclus dans la même release.

Le redéploiement Dokploy réel n'a pas été déclenché pendant ce test pour éviter
un rollback de production inutile. Sa preuve opérationnelle est le job `Deploy`
du run #28649726905, qui accepte le redéploiement avec HTTP 200.

## 5. Checklist « avant mise en prod » (CDC §V.2, OWASP API Top 10)

Config prod de référence : `apps/backend-central/.env.example.prod`,
`apps/backend-pays/.env.example.prod` (#50).

**Secrets & environnement**
- [ ] `NODE_ENV=production` sur les deux backends.
- [ ] Tous les secrets (`DB`, `JWT_SECRET` ≥ 32 car., `MQTT_*`, `SMTP_*`) fournis
      par le gestionnaire de secrets du CI/CD — **aucun** en clair dans le dépôt.
- [ ] `JWT_SECRET` distinct du local (le `docker-compose.yml` fixe une valeur
      `change-me-for-local-compose-only` → **surchargée** en prod).
- [ ] Identifiants du seed ADMIN forts et changés après le premier login.

**Réseau & en-têtes**
- [ ] `CORS_ORIGIN` = origine(s) HTTPS exacte(s), **jamais `*`** (vérifié sur les 2 backends).
- [ ] **CSP** active (en-tête `Content-Security-Policy` servi par Nginx) et
      `connect-src` restreint à l'origine réelle de l'API → **0 erreur console** au
      chargement (à vérifier dans le navigateur sur l'image buildée).
- [ ] En-têtes de sécurité présents : `X-Content-Type-Options`, `X-Frame-Options`,
      `Referrer-Policy`, `Permissions-Policy` (cf. `apps/frontend-web/nginx.conf`).
- [ ] HTTPS de bout en bout (TLS au niveau du reverse proxy / Dokploy).

**Auth & cookies**
- [ ] Cookie de refresh `fk_refresh` : `httpOnly` + `Secure` + `SameSite=Strict`
      (auto en prod via `isProduction`, cf. `refresh-cookie.ts`).
- [ ] Tokens d'accès **en mémoire** côté front (jamais `localStorage`).

**Robustesse & limites**
- [ ] Rate limiting resserré (`THROTTLE_LIMIT`/`THROTTLE_TTL_MS`) selon la charge attendue.
- [ ] Broker MQTT : `allow_anonymous false`, credentials prod, ACL par pays.
- [ ] `/health` et `/ready` répondent ; healthchecks Docker actifs.
- [ ] Erreurs normalisées RFC 7807, **aucune** stacktrace renvoyée au client.
- [ ] Logs en `LOG_LEVEL=info`, sans secret.

## Références

- Pipeline détaillé : [`../ci-cd/github-actions.md`](../ci-cd/github-actions.md)
- Images & compose : [`../ci-cd/docker.md`](../ci-cd/docker.md)
- Opérations courantes : [`runbook.md`](runbook.md)
- Architecture distribuée : [`../architecture/distributed.md`](../architecture/distributed.md)
- Pipeline : `.github/workflows/ci.yml`
