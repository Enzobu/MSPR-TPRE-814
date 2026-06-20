# Site de documentation utilisateur (VitePress) — ADR-0009, ADR-0010.
# Buildé dans la stack Docker (donc construit en CI par `docker compose build`,
# ce qui rend le job CI dédié `docs:build` redondant) et déployé via Dokploy.
FROM node:22-alpine AS build

WORKDIR /workspace
RUN corepack enable
ENV HUSKY=0

# vitepress est une devDependency RACINE : seuls les manifests racine sont
# nécessaires (le site ne consomme aucun package du workspace).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY docs docs
RUN pnpm docs:build

# Image nginx non-privilégiée (uid 101, port 8080) — même base que le front,
# résout le hotspot Docker root.
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

COPY docs/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/docs/.vitepress/dist /usr/share/nginx/html

EXPOSE 8080
