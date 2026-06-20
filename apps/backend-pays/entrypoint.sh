#!/bin/sh
# Démarrage du backend-pays en prod : applique les migrations Prisma (lots,
# measurements, alerts) AVANT de lancer l'app, puis démarre.
set -e

# node_modules/.bin sur le PATH (sans pnpm au runtime) pour `prisma`.
export PATH="$PWD/node_modules/.bin:$PATH"

echo "[entrypoint] prisma migrate deploy"
prisma migrate deploy

echo "[entrypoint] start app"
exec node dist/main
