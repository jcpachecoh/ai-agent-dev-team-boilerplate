# ─── Stage 1: prune the monorepo ───────────────────────────────────────────
FROM node:20-alpine AS pruner
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app

COPY . .
RUN pnpm dlx turbo prune @restopsiq/api --docker

# ─── Stage 2: install deps ──────────────────────────────────────────────────
FROM node:20-alpine AS installer
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app

# Copy pruned lockfile + workspace manifest
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml

RUN pnpm install --frozen-lockfile

# Copy pruned source
COPY --from=pruner /app/out/full/ .
# Root scripts (used by prisma/seed.ts)
COPY --from=pruner /app/scripts ./scripts

# Generate Prisma client before build
RUN cd apps/api && npx prisma@5 generate

# Build
RUN pnpm dlx turbo run build --filter=@restopsiq/api

# ─── Stage 3: runtime ───────────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app

ENV NODE_ENV=production

COPY --from=installer /app/apps/api/dist ./dist
COPY --from=installer /app/apps/api/prisma ./prisma
COPY --from=installer /app/apps/api/package.json ./package.json
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/apps/api/node_modules ./apps/api/node_modules
# Workspace packages — pnpm symlinks in node_modules point to these paths
COPY --from=installer /app/packages/email ./packages/email
COPY --from=installer /app/packages/shared ./packages/shared
COPY --from=installer /app/packages/types ./packages/types
COPY --from=installer /app/packages/utils ./packages/utils
# Root scripts (seed.ts resolves '../../../scripts/' → '/scripts/' at runtime)
COPY --from=installer /app/scripts /scripts

EXPOSE 3000

CMD ["sh", "-c", "npx prisma@5 migrate deploy && node dist/main"]
