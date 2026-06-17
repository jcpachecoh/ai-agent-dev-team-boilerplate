# API smoke tests (gateway → api cutover)

Single backend: **`apps/api`** on port **3001** (REST `/api/*`, GraphQL `/graphql`, health `/health`).

## Prerequisites

```bash
# Recomendado — API + web-app juntos (desde la raíz del monorepo)
pnpm --filter @restopsiq/web-app run dev:stack

# O en dos terminales:
#   cd apps/api && pnpm start:dev
#   cd apps/web-app && pnpm dev
```

Si la API no arranca, revisa `DATABASE_URL` en `apps/api/.env` (Postgres accesible) y que `VITE_GRAPHQL_URL` no apunte a `:4000`.

Set `DATABASE_URL`, `JWT_SECRET`, and Redis if MES auth rate-limit is enabled.

## Automated smoke suite

```bash
pnpm --filter @restopsiq/api exec jest src/test/smoke.spec.ts
```

## Manual checklist

| #   | Area                | How                                                                            | Expected                                               |
| --- | ------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------ |
| 1   | Health              | `curl http://localhost:3001/health`                                            | `200`, status ok                                       |
| 2   | REST auth           | Postman folder **01 — Global Auth → Login**                                    | `accessToken` in body                                  |
| 3   | GraphQL auth        | Postman folder **10 — GraphQL Auth → Login** (`graphqlUrl` → `:3001/graphql`)  | `data.login.accessToken`                               |
| 4   | Web login           | Web-app login page                                                             | Redirect to dashboard                                  |
| 5   | Suppliers           | Web-app Proveedores or GraphQL `suppliers` query with `Bearer` + `x-tenant-id` | List loads                                             |
| 6   | Plant REST          | Postman **02 → Login Owner**, then **05/06** plant request                     | `200` with `mesAccessToken`                            |
| 7   | GraphQL operational | Postman **10 → Login Operational**                                             | `data.loginOperational.accessToken` → `mesAccessToken` |
| 8   | Plant WS            | `apps/plant` with `VITE_PLANT_API_URL=http://localhost:3001`                   | Socket connects                                        |

## Production

- Railway deploys **only** `apps/api` (`railway.toml` → `apps/api/Dockerfile`, health `/health`).
- **`apps/gateway` is removed** — do not deploy port `:4000`.
