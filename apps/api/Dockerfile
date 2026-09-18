# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --filter api... --frozen-lockfile || pnpm install --filter api...

FROM deps AS build
COPY apps/api apps/api
RUN pnpm --filter api prisma:generate
RUN pnpm --filter api build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app/apps/api/node_modules apps/api/node_modules
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/api/prisma apps/api/prisma
COPY --from=build /app/apps/api/package.json apps/api/package.json

WORKDIR /app/apps/api
RUN mkdir -p uploads logs

EXPOSE 4000
CMD ["node", "dist/server.js"]
