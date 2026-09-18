# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --filter web... --frozen-lockfile || pnpm install --filter web...

FROM deps AS build
COPY apps/web apps/web
# Leave empty (default) for same-origin deployments served behind the nginx
# reverse proxy in this image (see nginx.conf) — the frontend then calls
# relative "/api/v1" and nginx forwards it to the api container. Only set
# this to an absolute URL when the frontend and API are deployed separately
# (different domains/hosts).
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm --filter web build

FROM nginx:1.27-alpine AS runner
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
