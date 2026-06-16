FROM node:20-alpine AS base
RUN npm install -g pnpm@9.15.9
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/tsconfig ./packages/tsconfig
COPY apps/gateway/package.json ./apps/gateway/
RUN pnpm install --frozen-lockfile --filter @restopsiq/gateway...

FROM deps AS build
COPY packages ./packages
COPY apps/gateway ./apps/gateway
RUN pnpm --filter @restopsiq/gateway build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=build /app/apps/gateway/dist ./dist
COPY --from=build /app/apps/gateway/package.json ./
COPY --from=build /app/node_modules ./node_modules
EXPOSE 4000
CMD ["node", "dist/index.js"]
