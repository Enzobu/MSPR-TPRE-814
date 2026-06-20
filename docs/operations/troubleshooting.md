---
title: Troubleshooting
owner: Yanis
status: in-progress
cdc-ref: "§IV.4.1"
updated: 2026-06-20
---

# Troubleshooting

Problèmes connus et résolutions. Démarche générale : **regarder les logs**
(`docker compose logs -f <service>`), **vérifier la santé** (`/ready`), isoler le
composant fautif. Voir aussi le [`runbook.md`](runbook.md).

## 1. Un backend ne démarre pas

**Symptômes** : le conteneur redémarre en boucle, `/health` ne répond pas.

**Causes & solutions :**

- **Variable d'env manquante/invalide** : l'app **refuse de démarrer** si la
  validation d'env (zod) échoue (règle 07). Le log indique la variable fautive.
  → Comparer `.env.compose` à `.env.compose.example`, corriger, redémarrer.
- **DB pas prête** : le backend démarre avant MariaDB. Les `depends_on:
  condition: service_healthy` couvrent ce cas ; si l'image DB n'a pas son
  healthcheck, attendre puis `docker compose restart <backend>`.

## 2. Le backend ne se connecte pas à la base

**Symptômes** : `/ready` KO sur la DB, erreurs Prisma dans les logs.

**Solutions :**

- Vérifier `DATABASE_URL` (host = nom du service compose, ex. `mariadb-pays`, pas
  `localhost`, à l'intérieur du réseau Docker).
- Vérifier la santé : `docker compose ps` (la DB doit être `healthy`).
- Migrations non appliquées → `pnpm --filter <backend> exec prisma migrate deploy`.

## 3. Les mesures IoT n'arrivent pas

**Symptômes** : pas de nouvelles mesures, `mosquitto_sub` muet.

**Solutions :**

- **Broker down** : `docker compose ps mosquitto-pays` ; relancer si besoin.
- **Auth MQTT** : connexion anonyme refusée (`allow_anonymous false`). Utiliser
  les credentials backend/IoT (voir [`../architecture/mqtt.md`](../architecture/mqtt.md)).
- **Mauvais pays / topic** : le backend ne lit que `futurekawa/{COUNTRY_CODE}/...`.
  Vérifier `COUNTRY_CODE` du backend et le topic publié par le capteur.
- **Capteur hors-ligne** : le statut LWT `offline` (retain) le signale ; côté
  firmware, voir reconnexion ([`../iot/firmware.md`](../iot/firmware.md)).
- **Tester sans matériel** : `/mqtt-simulate` (ou `--anomaly`).

## 4. Le siège affiche « pays indisponible »

**Symptômes** : bandeau `unavailable` dans l'UI, données partielles.

**C'est un comportement nominal** (ADR-0007) quand un `backend-pays` est
injoignable : le central renvoie `{ data, unavailable: [...] }` plutôt qu'une
erreur. **Solutions :**

- Vérifier le `backend-pays` concerné (`/ready`, logs, réseau).
- Vérifier `BACKEND_PAYS_*_URL` côté central.
- Le **circuit breaker** court-circuite un pays après 5 échecs (cooldown 30 s) :
  une fois le pays rétabli, la sonde half-open referme le circuit automatiquement.
- Le **cache 30 s** peut retarder l'affichage du rétablissement → attendre un
  cycle de refresh.

## 5. Pas d'email d'alerte reçu

**Symptômes** : alerte levée (visible via `GET /api/v1/alerts`) mais pas d'email.

**Solutions :**

- L'envoi est **best-effort** : une alerte est **toujours** persistée même si le
  mail échoue (le log `warn`/`error` le trace).
- Vérifier `SMTP_*` et `ALERT_RECIPIENT`.
- En test/local : utiliser **MailDev** (capture les mails, UI sur son port API).
- Déduplication : **1 alerte par type+entité+jour UTC** → un 2ᵉ dépassement le
  même jour ne renvoie pas d'email (normal).

## 6. CORS bloqué côté front

**Symptômes** : erreurs CORS dans la console navigateur.

**Solutions :**

- `CORS_ORIGIN` est une **liste blanche explicite** (jamais `*`). Ajouter
  l'origine du front (`BACKEND_CENTRAL_CORS_ORIGIN`) et redémarrer le central.
- Le front consomme **toujours** le central (jamais un backend pays en direct).

## 7. La Quality Gate SonarQube est rouge

**Souvent attendu** : la gate évalue la couverture du *new code* ; une PR de
doc/squelette la laisse rouge. Le merge reste possible (Build + tests +
GitGuardian verts). Voir [`../ci-cd/github-actions.md`](../ci-cd/github-actions.md).

## 8. Les tests e2e backend tapent la mauvaise base

**Symptôme** : e2e qui modifie la base de dev au lieu de la stack de test.

**Cause connue** : `process.loadEnvFile` n'alimente pas le `process.env` du
sandbox VM de Jest. **Contournement** : hardcoder l'env requis en tête de spec
(ex. `process.env.MQTT_URL='mqtt://localhost:1893'`) avant les imports. Détail :
[`../testing/strategy.md`](../testing/strategy.md).

## Escalade

Si l'incident persiste : collecter les logs (`docker compose logs --since=30m`),
le `correlation_id` de la requête fautive et l'état (`docker compose ps`), puis
ouvrir une issue `bug` en suivant [`../testing/anomalies.md`](../testing/anomalies.md).
