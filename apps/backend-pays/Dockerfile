FROM node:22-alpine AS build

WORKDIR /workspace
RUN corepack enable
ENV HUSKY=0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/nest-common/package.json packages/nest-common/package.json
COPY apps/backend-pays/package.json apps/backend-pays/package.json
# Le postinstall de backend-pays lance `prisma generate` : le schéma et la
# config Prisma doivent donc être présents avant l'install.
COPY apps/backend-pays/prisma apps/backend-pays/prisma
COPY apps/backend-pays/prisma.config.ts apps/backend-pays/prisma.config.ts
RUN pnpm install --frozen-lockfile

COPY packages/contracts packages/contracts
COPY packages/nest-common packages/nest-common
COPY apps/backend-pays apps/backend-pays
RUN pnpm --filter @futurekawa/contracts build
RUN pnpm --filter @futurekawa/nest-common build
RUN pnpm --filter backend-pays build

FROM node:22-alpine AS runtime

WORKDIR /workspace

ENV NODE_ENV=production
# Artefacts laissés à root (proprio par défaut) : l'utilisateur non-root `node`
# (uid 1000 fourni par l'image) peut les lire/exécuter mais PAS les modifier au
# runtime — un process compromis ne peut pas réécrire son propre code (Sonar
# S6504). L'app n'écrit rien dans /workspace (logs → stdout via pino).
COPY --from=build /workspace /workspace
WORKDIR /workspace/apps/backend-pays
USER node

EXPOSE 3000
# start:prod = `node dist/main` : on l'invoque directement pour éviter de dépendre
# de pnpm/corepack au runtime (cache absent dans l'étape finale).
CMD ["node", "dist/main"]
