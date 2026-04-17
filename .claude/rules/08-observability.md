# 08 — Observabilité

## Logs structurés JSON

- **`nestjs-pino`** sur les deux backends (déjà installé).
- **Pas de `console.log`** dans le code applicatif (toléré uniquement pour debug local jetable, à retirer avant commit).
- **Niveaux cohérents** :
  - `trace` — détails très fins (rare)
  - `debug` — aide au debug en dev
  - `info` — événements normaux (requête, message MQTT traité)
  - `warn` — situation anormale récupérable (retry, timeout)
  - `error` — erreur nécessitant intervention
- **Pas de secret dans les logs** (token, mot de passe, contenu personnel).

## Correlation ID

- **Header** `x-correlation-id` généré par le frontend (ou l'entrée backend si absent), propagé :
  - dans les logs de toute la requête
  - dans les appels inter-backends (siège → pays)
- Intercepteur Nest dédié pour l'injection / propagation.

## Health endpoints

Exposés par chaque backend :

- **`/health`** — liveness (le process est vivant, répond 200).
- **`/ready`** — readiness (dépendances critiques accessibles : DB, MQTT, SMTP si pays).

Utilisés par Docker Compose (`healthcheck`) et un futur orchestrateur.

## Monitoring (phase ultérieure)

Non bloquant pour la soutenance, mais à mentionner dans le dossier technique :

- Exposition de métriques Prometheus (`/metrics`) si time permet.
- Dashboard Grafana pour supervision T°/humidité agrégée.
- Alerting technique (pas seulement métier) : broker down, DB down, backend pays isolé.
