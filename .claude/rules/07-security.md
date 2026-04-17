# 07 — Sécurité

Référence : **OWASP API Security Top 10** (cité au CDC §V.2).

## Secrets

- **Aucun secret en git** : `.env` gitignoré, `.env.example` commité et maintenu à jour.
- **Secrets frontend** : n'existent pas. Toute variable `VITE_*` est shipped dans le bundle public.
- **Secrets CI** : via Jenkins Credentials, jamais en clair dans le `Jenkinsfile`.

## Validation d'environnement au boot

- L'app **refuse de démarrer** si une variable requise manque ou est invalide.
- Implémentation : `@nestjs/config` + validation via `zod` ou `joi` (schéma strict).

## Validation d'entrée (backends)

- **`ValidationPipe` global** dans `main.ts` :
  ```ts
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  ```
- Tous les DTO d'entrée décorés `class-validator`.
- **Zod côté front** pour UX rapide — mais le backend re-valide **toujours** (never trust the client).

## CORS

- **Explicite** — jamais `*` en production.
- Origine configurée via env (`CORS_ORIGIN`), liste blanche si plusieurs clients.

## Rate limiting

- **`@nestjs/throttler`** sur les endpoints publics (création de lot, ingestion mesure si exposée).
- Budget par défaut à décider en ADR.

## Pas de leak d'information

- **Jamais** de stacktrace, structure de DB, ou version de lib renvoyés au client.
- Erreurs normalisées via `ExceptionFilter` global (RFC 7807).
- Logs verbeux côté serveur, messages génériques côté client.

## Frontend

- **Jamais** de `dangerouslySetInnerHTML` sans sanitize (risque XSS).
- **Pas de token en `localStorage`** si possible — préférer cookie httpOnly (stratégie d'auth à décider en ADR).
- **CSP** (Content Security Policy) à configurer en prod.

## IoT

- Secrets WiFi/MQTT dans `secrets.h` gitignoré, `secrets.h.example` commité.
- **Pas d'ACL MQTT triviale** en prod : login/password côté broker, topic scoping par client.
