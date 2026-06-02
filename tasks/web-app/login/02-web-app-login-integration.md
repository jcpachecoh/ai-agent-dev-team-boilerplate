# WEB-LOGIN-02 — Integración login en web-app (global / backoffice)

**Domain:** `[FRONTEND]` `[WEB-APP]` `[AUTH]` `[REACT-QUERY]`  
**Status:** `done`  
**Depends On:** `01-ui-web-login-components.md`, `tasks/web-app/01-layout-shell-sidebar.md`, `tasks/auth-02-graphql-auth/` (login global en gateway/API)  
**Blocks:** —

---

## Objetivo

Conectar `WebLoginPage` con el **gateway GraphQL** (`login` / `signup` mutations AUTH-02), React Query y rutas protegidas para que el dashboard solo sea accesible con `accessToken` válido.

**No usar login operacional MES** (`loginOperational`, `/api/mes/auth/login`, cédula + PIN). Ese flujo queda para `apps/plant` y terminales de campo.

## API de autenticación

| Operación | GraphQL (gateway `:4000`)                  | Headers HTTP del request GraphQL      | Respuesta                       |
| --------- | ------------------------------------------ | ------------------------------------- | ------------------------------- |
| Login     | `mutation login(input: GlobalLoginInput!)` | `x-tenant-id` (requerido)             | `{ accessToken, refreshToken }` |
| Signup    | `mutation signup(input: SignupInput!)`     | `x-tenant-id` (requerido)             | `{ accessToken, refreshToken }` |
| Logout    | `mutation logout`                          | `Authorization: Bearer {accessToken}` | `true`                          |

El gateway delega a `apps/api` REST (`POST /api/auth/*`). La web-app **no llama REST directo** para auth global; usa `graphqlRequest` → gateway.

El `accessToken` se persiste con `setGraphqlAuthToken` para queries/mutations autenticadas (`authKind: global`).

## Archivos

```txt
apps/web-app/src/
├── features/auth/
│   ├── api/
│   │   ├── auth.api.ts          # graphqlRequest → gateway login/signup/logout
│   │   ├── auth.graphql.ts      # LOGIN_MUTATION, SIGNUP_MUTATION, LOGOUT_MUTATION
│   │   ├── auth.api.test.ts
│   │   └── auth.keys.ts
│   ├── hooks/
│   │   ├── useLogin.ts          # setGraphqlAuthToken(accessToken)
│   │   ├── useLogin.test.tsx
│   │   └── useLogout.ts         # mutation logout + clearGraphqlAuthToken
│   ├── components/
│   │   └── LoginPageView.tsx    # email + password (adaptar props del UI kit)
│   └── types.ts                 # LoginInput { email, password }; LoginResponse tokens
├── pages/LoginPage/
│   ├── LoginPage.tsx
│   └── index.ts
├── routes/
│   ├── RequireAuth.tsx
│   └── RequireAuth.test.tsx
└── App.tsx
```

`Header` usa `useLogout()` → `UserMenu onLogout`.

## UI (tarea 01)

Layout definido en `WebLoginPage`:

- **Desktop:** `WebLoginImagePanel` (izquierda) + `WebLoginFormPanel` con email/contraseña (derecha).
- **Mobile (≤900px):** solo formulario; imagen oculta.

`LoginPageView` pasa `heroImageUrl` y conecta estado email/password al UI kit.

Demo panel: credenciales de seed global (`mes-owner@palos-de-lena.dev` / `TestPass123!`).

## Variables de entorno (`.env.local`)

```env
# Dev: API :3001 + Gateway :4000 + web-app :5173
VITE_TENANT_ID=palos-de-lena
VITE_GRAPHQL_URL=http://localhost:4000/graphql
# VITE_DEMO_EMAIL=mes-owner@palos-de-lena.dev
# VITE_DEMO_PASSWORD=TestPass123!
```

## Flujo

1. Sin token → cualquier ruta del shell redirige a `/login` (`RequireAuth`).
2. `graphqlRequest(LOGIN_MUTATION)` con header `x-tenant-id`, variables `{ input: { email, password } }`.
3. Éxito → `setGraphqlAuthToken(accessToken)` + invalidar `authKeys.all` + navegar a `/` o `state.from`.
4. Logout en menú usuario → `logout` mutation (best-effort) → `clearGraphqlAuthToken` + `/login`.

## Validación cliente

| Campo    | Regla                                      |
| -------- | ------------------------------------------ |
| Email    | Formato email válido                       |
| Password | No vacío (API acepta cualquier string ≥ 1) |

Alinear mensajes de error con respuestas API: credenciales inválidas (401), email no verificado, cuenta inactiva.

## Tipos (`features/auth/types.ts`)

```ts
export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}
```

`useLogin` persiste **`accessToken`**, no `refreshToken` (refresh queda fuera de alcance salvo ticket futuro).

## Tests

```bash
pnpm --filter web-app exec vitest run src/features/auth src/routes/RequireAuth.test.tsx src/App.test.tsx
```

Casos mínimos:

- `auth.api`: mutation `login` / `signup` vía `graphqlRequest` con `x-tenant-id`.
- `useLogin`: guarda `accessToken` en `setGraphqlAuthToken`.
- Errores 401 mapeados a mensaje amigable en español.

## Desarrollo local (login funcional)

El front requiere **API + Gateway** en dev; si ves error de red en login, comprueba `:4000/graphql`.

**Opción A — tres terminales:**

```bash
# Terminal 1 — API
cd apps/api && pnpm dev          # → :3001

# Terminal 2 — Gateway GraphQL
cd apps/gateway && pnpm dev      # → :4000/graphql

# Terminal 3 — Web app
cd apps/web-app && pnpm dev      # → :5173
```

**Opción B — una sola (desde repo root o web-app):**

```bash
cd apps/web-app && pnpm dev:stack   # api + gateway + web-app
```

Seed (una vez): `cd apps/api && pnpm db:seed`

Credenciales globales (tenant `palos-de-lena`, header `x-tenant-id: palos-de-lena`):

| Usuario      | Email                            | Password       |
| ------------ | -------------------------------- | -------------- |
| MES owner    | `mes-owner@palos-de-lena.dev`    | `TestPass123!` |
| MES operator | `mes-operator@palos-de-lena.dev` | `TestPass123!` |

## Fuera de alcance

- Login operacional MES (`loginOperational`, cédula + PIN).
- Refresh token rotation en cliente.
- Signup, verify email, forgot/reset password (mutaciones globales existen en gateway; UI no requerida aquí).

## Checklist

- [x] `LoginPageView` + `LoginPage` con **email** y **password**
- [x] `useLogin` + `auth.api.ts` → gateway GraphQL `login` / `signup` (AUTH-02)
- [x] `RequireAuth` + rutas en `App.tsx`
- [x] Redirect post-login (`state.from`)
- [x] Logout en shell (`useLogout` → mutation `logout` + clear token local)
- [x] Demo credentials vía env (`VITE_DEMO_EMAIL` / `VITE_DEMO_PASSWORD`)
- [x] Tests: `auth.api`, `useLogin`, `RequireAuth`, `App` (auth redirect)
