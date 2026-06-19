FROM node:22-alpine AS build

WORKDIR /workspace
RUN corepack enable
ENV HUSKY=0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/nest-common/package.json packages/nest-common/package.json
COPY apps/backend-central/package.json apps/backend-central/package.json
# Le postinstall de backend-central lance `prisma generate` : le schéma et la
# config Prisma doivent donc être présents avant l'install.
COPY apps/backend-central/prisma apps/backend-central/prisma
COPY apps/backend-central/prisma.config.ts apps/backend-central/prisma.config.ts
RUN pnpm install --frozen-lockfile

COPY packages/contracts packages/contracts
COPY packages/nest-common packages/nest-common
COPY apps/backend-central apps/backend-central
RUN pnpm --filter @futurekawa/contracts build
RUN pnpm --filter @futurekawa/nest-common build
RUN pnpm --filter backend-central build

FROM node:22-alpine AS runtime

WORKDIR /workspace

ENV NODE_ENV=production
# L'image node fournit un utilisateur non-root `node` (uid 1000) : on lui donne
# la propriété des artefacts et on tourne en non-root (Sonar hotspot Docker).
COPY --from=build --chown=node:node /workspace /workspace
WORKDIR /workspace/apps/backend-central
USER node

EXPOSE 3000
# start:prod = `node dist/main` : on l'invoque directement pour éviter de dépendre
# de pnpm/corepack au runtime (cache absent dans l'étape finale).
CMD ["node", "dist/main"]
