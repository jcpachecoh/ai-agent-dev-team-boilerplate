# Epic: Login Web App (cédula + PIN)

**Domain:** `[FRONTEND]` `[WEB-APP]` `[UI]` `[AUTH]` `[REACT-QUERY]`  
**Status:** `done` (UI + integración web-app)  
**Entry route (objetivo):** `/login` → post-auth `/` (`DashboardPage` dentro de `AppLayout`)  
**Referencia UX:** mock FogonMind (panel hero + formulario); credenciales como `apps/plant` (`/api/mes/auth/login`)  
**UI kit:** `packages/ui/src/components/web-login/*`

---

## Objetivo

Pantalla de acceso para **web-app** (backoffice / centro de comando): layout de dos columnas, campos **cédula** y **PIN**, login vía API con **React Query**, persistencia del JWT para GraphQL (`setGraphqlAuthToken`) y redirección al dashboard solo cuando hay sesión válida.

## Subtareas

| #   | Archivo                                                              | Descripción                                      | Depende de |
| --- | -------------------------------------------------------------------- | ------------------------------------------------ | ---------- |
| 1   | [01-ui-web-login-components.md](./01-ui-web-login-components.md)     | Componentes `@restopsiq/ui` + Storybook          | —          |
| 2   | [02-web-app-login-integration.md](./02-web-app-login-integration.md) | Página, hook `useLogin`, rutas protegidas, token | Tarea 1    |

## API de autenticación (existente)

| Endpoint                   | Headers       | Body              |
| -------------------------- | ------------- | ----------------- |
| `POST /api/mes/auth/login` | `x-tenant-id` | `{ cedula, pin }` |

Misma semántica que `apps/plant` (`loginOperator` en `auth.service.ts`). Web-app llamará a la **API REST** (no GraphQL) para login; el **accessToken** devuelto se guarda con `setGraphqlAuthToken` para el gateway.

## Referencia visual

Captura FogonMind (hero + formulario). Sustituir email/password por **cédula** y **PIN**.

Copiar opcionalmente a `tasks/web-app/design-references/login/`.

## Estado actual

- `App.tsx` monta todas las rutas bajo `AppLayout` **sin** guard de auth.
- `DashboardPage` es placeholder del shell.
- `auth-token.ts` ya soporta token en `localStorage` + override `.env`.
- Plant tiene flujo completo con keypad; web-app usará **inputs** al estilo del mock.

## Criterios de aceptación (epic)

- [x] Storybook documenta `WebLoginPage` en dark.
- [x] `/login` muestra cédula + PIN y no el shell con sidebar.
- [x] Login exitoso → token persistido → navegación a `/`.
- [x] Sin token → rutas del shell redirigen a `/login`.
- [x] Errores de API visibles en el formulario (cédula/PIN incorrecto, cuenta bloqueada).
