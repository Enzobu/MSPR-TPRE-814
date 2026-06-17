FROM node:22-alpine AS build

WORKDIR /workspace
RUN corepack enable
ENV HUSKY=0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/contracts/package.json packages/contracts/package.json
COPY apps/backend-central/package.json apps/backend-central/package.json
RUN pnpm install --frozen-lockfile

COPY packages/contracts packages/contracts
COPY apps/backend-central apps/backend-central
RUN pnpm --filter @futurekawa/contracts build
RUN pnpm --filter backend-central build

FROM node:22-alpine AS runtime

WORKDIR /workspace
RUN corepack enable

ENV NODE_ENV=production
COPY --from=build /workspace /workspace
WORKDIR /workspace/apps/backend-central

EXPOSE 3000
CMD ["pnpm", "start:prod"]
