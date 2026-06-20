#!/bin/sh
# Démarrage du backend-central en prod : applique les migrations Prisma AVANT de
# lancer l'app (sinon la table users est absente → 500 au login), seed l'admin
# (idempotent, best-effort), puis démarre.
set -e

# node_modules/.bin sur le PATH (sans pnpm au runtime) : pour `prisma` ET `tsx`
# (la commande de seed `tsx prisma/seed.ts` est résolue par prisma via le PATH).
export PATH="$PWD/node_modules/.bin:$PATH"

echo "[entrypoint] prisma migrate deploy"
prisma migrate deploy

# Seed de l'utilisateur ADMIN initial : seulement si configuré, et NON bloquant
# (un échec de seed ne doit jamais empêcher le démarrage de l'app).
if [ -n "${SEED_ADMIN_EMAIL:-}" ]; then
  echo "[entrypoint] prisma db seed"
  prisma db seed || echo "[entrypoint] seed échoué (ignoré)"
fi

echo "[entrypoint] start app"
exec node dist/main
