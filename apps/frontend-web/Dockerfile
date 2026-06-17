FROM node:22-alpine AS build

WORKDIR /workspace
RUN corepack enable
ENV HUSKY=0

ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=${VITE_API_URL}

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/contracts/package.json packages/contracts/package.json
COPY apps/frontend-web/package.json apps/frontend-web/package.json
RUN pnpm install --frozen-lockfile

COPY packages/contracts packages/contracts
COPY apps/frontend-web apps/frontend-web
RUN pnpm --filter @futurekawa/contracts build
RUN pnpm --filter frontend-web build

FROM nginx:1.27-alpine AS runtime

COPY apps/frontend-web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/apps/frontend-web/dist /usr/share/nginx/html

EXPOSE 80
