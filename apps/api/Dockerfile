# syntax=docker/dockerfile:1
# Build context: the repository root (see compose.yaml).

# ---- base: Node.js with the pnpm version pinned in package.json -----------
FROM node:24-slim AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /repo

# ---- deps: all dependencies of the API, cached until a manifest changes ---
FROM base AS deps
# The Prisma migration engine needs OpenSSL.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter @blog/api

# ---- build: generate the Prisma client and compile the API ----------------
FROM deps AS build
COPY apps/api apps/api
RUN pnpm --filter @blog/api run build

# ---- migrate: one-off job that applies database migrations ----------------
FROM build AS migrate
WORKDIR /repo/apps/api
USER node
CMD ["./node_modules/.bin/prisma", "migrate", "deploy"]

# ---- prod-deps: production dependencies only ------------------------------
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod --filter @blog/api

# ---- runtime: the small image that serves traffic -------------------------
FROM node:24-slim AS runtime
ENV NODE_ENV=production
WORKDIR /repo/apps/api
COPY --from=prod-deps /repo/node_modules /repo/node_modules
COPY --from=prod-deps /repo/apps/api/node_modules ./node_modules
COPY --from=build /repo/apps/api/dist ./dist
COPY apps/api/package.json ./
USER node
EXPOSE 4000
CMD ["node", "dist/main.js"]
