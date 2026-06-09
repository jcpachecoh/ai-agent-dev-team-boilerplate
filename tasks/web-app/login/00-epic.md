# Epic: Login Web App (email + password — backoffice global)

**Domain:** `[FRONTEND]` `[WEB-APP]` `[UI]` `[AUTH]` `[REACT-QUERY]`  
**Status:** `done`  
**Entry route (objetivo):** `/login` → post-auth `/` (`DashboardPage` dentro de `AppLayout`)  
**Referencia UX:** split layout — **imagen a la izquierda**, formulario **email + contraseña** a la derecha; en **mobile solo formulario** (sin imagen)  
**UI kit:** `packages/ui/src/components/web-login/*`

---

## Objetivo

Pantalla de acceso para **web-app** (backoffice / centro de comando):

- **Desktop/tablet (≥ 901px):** columna izquierda = imagen full-bleed; columna derecha = login con **email** y **contraseña**.
- **Mobile (≤ 900px):** solo panel de login (formulario centrado), **sin imagen**.
- Login vía **GraphQL gateway** (`mutation login` AUTH-02) con React Query.
- Persistencia del `accessToken` para GraphQL autenticado (`setGraphqlAuthToken`) y redirección al dashboard solo con sesión válida.

## Subtareas

| #   | Archivo                                                              | Descripción                                                        | Depende de |
| --- | -------------------------------------------------------------------- | ------------------------------------------------------------------ | ---------- |
| 1   | [01-ui-web-login-components.md](./01-ui-web-login-components.md)     | Componentes `@restopsiq/ui` + Storybook (imagen + form email/pass) | —          |
| 2   | [02-web-app-login-integration.md](./02-web-app-login-integration.md) | Página, hook `useLogin`, rutas protegidas, token                   | Tarea 1    |

## API de autenticación (global / backoffice)

| Operación | GraphQL (gateway) | Headers HTTP            | Input / respuesta                                    |
| --------- | ----------------- | ----------------------- | ---------------------------------------------------- |
| Login     | `mutation login`  | `x-tenant-id`           | `GlobalLoginInput` → `{ accessToken, refreshToken }` |
| Signup    | `mutation signup` | `x-tenant-id`           | `SignupInput` → tokens                               |
| Logout    | `mutation logout` | `Authorization: Bearer` | `true`                                               |

**No** usar login operacional MES (`loginOperational`, cédula + PIN) — ese flujo es para `apps/plant`.

Web-app llama **GraphQL al gateway** (`:4000/graphql`); el gateway delega a `apps/api` REST. El `accessToken` se reutiliza como Bearer en queries autenticadas.

## Layout visual

```
Desktop (≥901px)                    Mobile (≤900px)
┌──────────────┬─────────────┐      ┌─────────────────┐
│              │  Acceso     │      │    Acceso       │
│   Imagen     │  email      │      │    email        │
│  (cover)     │  password   │      │    password     │
│              │  [Entrar]   │      │    [Entrar]     │
└──────────────┴─────────────┘      └─────────────────┘
```

## Estado actual

- Componentes UI en `@restopsiq/ui` (`WebLoginPage`, `WebLoginImagePanel`, `WebLoginCredentialsForm`).
- Integración web-app: GraphQL gateway (`login` / `signup` / `logout`) + `RequireAuth`.

## Criterios de aceptación (epic)

- [x] Storybook documenta `WebLoginPage` con imagen + formulario email/password.
- [x] Desktop: imagen izquierda + login derecha; mobile: solo login.
- [x] `/login` muestra email + contraseña (sin shell sidebar).
- [x] Login exitoso → `accessToken` persistido → navegación a `/`.
- [x] Sin token → rutas del shell redirigen a `/login`.
- [x] Errores de API visibles en el formulario (credenciales inválidas, cuenta inactiva, etc.).
