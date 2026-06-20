FROM node:22-alpine AS build

WORKDIR /workspace
RUN corepack enable
ENV HUSKY=0

ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=${VITE_API_URL}

# Suivi des erreurs front (Sentry, ADR-0011). DSN public → inliné au build.
ARG VITE_SENTRY_DSN=
ENV VITE_SENTRY_DSN=${VITE_SENTRY_DSN}
ARG VITE_SENTRY_ENVIRONMENT=production
ENV VITE_SENTRY_ENVIRONMENT=${VITE_SENTRY_ENVIRONMENT}
ARG VITE_SENTRY_RELEASE=
ENV VITE_SENTRY_RELEASE=${VITE_SENTRY_RELEASE}

# Upload des sourcemaps (optionnel) : actif seulement si SENTRY_AUTH_TOKEN fourni
# au build (secret CI/Dokploy). Région EU par défaut (de.sentry.io).
ARG SENTRY_AUTH_TOKEN=
ENV SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}
ARG SENTRY_ORG=mspr-sd
ENV SENTRY_ORG=${SENTRY_ORG}
ARG SENTRY_PROJECT=frontend-web
ENV SENTRY_PROJECT=${SENTRY_PROJECT}
ARG SENTRY_URL=https://de.sentry.io/
ENV SENTRY_URL=${SENTRY_URL}

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/contracts/package.json packages/contracts/package.json
COPY apps/frontend-web/package.json apps/frontend-web/package.json
RUN pnpm install --frozen-lockfile

COPY packages/contracts packages/contracts
COPY apps/frontend-web apps/frontend-web
RUN pnpm --filter @futurekawa/contracts build
RUN pnpm --filter frontend-web build

# Image nginx non-privilégiée : tourne en utilisateur `nginx` (uid 101) et écoute
# sur 8080 (> 1024, pas besoin de root) — résout le hotspot Docker root.
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

COPY apps/frontend-web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/apps/frontend-web/dist /usr/share/nginx/html

EXPOSE 8080
