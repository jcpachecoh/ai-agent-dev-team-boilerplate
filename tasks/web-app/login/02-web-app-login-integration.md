# WEB-LOGIN-02 — Integración login en web-app

**Domain:** `[FRONTEND]` `[WEB-APP]` `[AUTH]` `[REACT-QUERY]`  
**Status:** `done`  
**Depends On:** `01-ui-web-login-components.md`, `tasks/web-app/01-layout-shell-sidebar.md`  
**Blocks:** —

---

## Objetivo

Conectar `WebLoginPage` con la API MES, React Query y rutas protegidas para que el dashboard solo sea accesible con token válido.

## Archivos

```txt
apps/web-app/src/
├── features/auth/
│   ├── api/
│   │   ├── auth.api.ts
│   │   ├── auth.api.test.ts
│   │   └── auth.keys.ts
│   ├── hooks/
│   │   ├── useLogin.ts
│   │   ├── useLogin.test.tsx
│   │   └── useLogout.ts
│   ├── components/
│   │   └── LoginPageView.tsx
│   └── types.ts
├── pages/LoginPage/
│   ├── LoginPage.tsx
│   └── index.ts
├── routes/
│   ├── RequireAuth.tsx
│   └── RequireAuth.test.tsx
└── App.tsx
```

`Header` usa `useLogout()` → `UserMenu onLogout`.

## Variables de entorno (`.env.local`)

```env
# Dev: omitir VITE_API_URL — Vite proxy /api → :3001
VITE_TENANT_ID=palos-de-lena
VITE_GRAPHQL_URL=http://localhost:4000/graphql
# VITE_DEMO_CEDULA=1234567890
# VITE_DEMO_PIN=1234
```

## Flujo

1. Sin token → cualquier ruta del shell redirige a `/login` (`RequireAuth`).
2. `POST /api/mes/auth/login` con `x-tenant-id`, cédula y PIN.
3. Éxito → `setGraphqlAuthToken` + invalidar `authKeys.all` + navegar a `/` o `state.from`.
4. Logout en menú usuario → `clearGraphqlAuthToken` + `/login`.

## Validación cliente

| Campo  | Regla        |
| ------ | ------------ |
| Cédula | 8–11 dígitos |
| PIN    | 4–6 dígitos  |

## Tests

```bash
pnpm --filter web-app exec vitest run src/features/auth src/routes/RequireAuth.test.tsx src/App.test.tsx
```

## Desarrollo local (login funcional)

El front solo hace proxy a la API; si ves `ECONNREFUSED` o 500 en `/api/mes/auth/login`, **la API no está corriendo**.

**Opción A — dos terminales:**

```bash
# Terminal 1
cd apps/api && pnpm dev          # o: npm run dev / npm run start:dev → :3001

# Terminal 2
cd apps/web-app && pnpm dev      # :5173, proxy /api → :3001
```

**Opción B — una sola (desde repo root o web-app):**

```bash
cd apps/web-app && pnpm dev:stack
```

Seed (una vez): `cd apps/api && pnpm db:seed` → cédula `12345678`, PIN `1234`, tenant `palos-de-lena`.

## Checklist

- [x] `LoginPageView` + `LoginPage` (estado/hooks vs UI)
- [x] `useLogin` + `auth.api.ts` (sin fetch en componentes)
- [x] `RequireAuth` + rutas en `App.tsx`
- [x] Redirect post-login (`state.from`)
- [x] Logout en shell (`useLogout`)
- [x] Demo credentials vía env
- [x] Tests: `auth.api`, `useLogin`, `RequireAuth`, `App` (auth redirect)
