# Task: auth module — JWT guard + login resolver

**Domain:** `[BACKEND]`  
**Assigned Agent:** backend-developer  
**Status:** `pending`  
**Created:** 2026-06-02  
**Depends On:** `01-bootstrap.md`

---

## Context

The current gateway has a standalone `authenticate()` function that parses a Bearer JWT
and populates `req.user`. Services live in `src/services/auth.service.ts`.

This task introduces a proper NestJS auth module with:

- A JWT strategy (Passport) that verifies tokens signed with `env.JWT_SECRET`
- A `GqlAuthGuard` applied globally via `APP_GUARD`
- A `login` GraphQL mutation matching the **exact existing shape**:
  ```graphql
  mutation Login($cedula: String!, $pin: String!, $tenantId: String!) {
    login(cedula: $cedula, pin: $pin, tenantId: $tenantId) {
      token
      user {
        id
        role
        tenantId
        sedeId
        isActive
      }
    }
  }
  ```

The existing `GatewayAuthService` logic (Prisma queries, bcrypt, JWT sign) must be
preserved — only the wiring changes.

---

## Requirements

- [ ] Install: `@nestjs/passport`, `@nestjs/jwt`, `passport`, `passport-jwt`, `bcryptjs`
- [ ] `src/auth/auth.module.ts` — imports `JwtModule.registerAsync` using config service
- [ ] `src/auth/strategies/jwt.strategy.ts` — validates `sub` / `tenantId` / `role` claims
- [ ] `src/auth/guards/gql-auth.guard.ts` — extends `AuthGuard('jwt')`, extracts request
      from GraphQL execution context
- [ ] `src/auth/decorators/current-user.decorator.ts` — `@CurrentUser()` param decorator
- [ ] `src/auth/decorators/public.decorator.ts` — `@Public()` skip-auth decorator
- [ ] `src/auth/interfaces/auth.interfaces.ts` — `IAuthService`, `LoginInput`, `LoginResult`,
      `AuthUser` (interfaces only, no classes)
- [ ] `src/auth/repository/auth.repository.ts` — Prisma queries only, no HTTP exceptions
- [ ] `src/auth/service/auth.service.ts` — business logic, throws `UnauthorizedException`
- [ ] `src/auth/resolver/auth.resolver.ts` — `login` mutation marked `@Public()`
- [ ] Unit tests in `src/auth/test/auth.service.spec.ts` covering happy path + wrong PIN +
      inactive user
- [ ] `GqlAuthGuard` registered as `APP_GUARD` in `AppModule` (or `AuthModule`)

---

## Acceptance Criteria

- [ ] `POST /graphql` with the `login` mutation returns `{ token, user }` for valid credentials
- [ ] Any resolver without `@Public()` returns `401` when no Bearer token is provided
- [ ] `auth.service.spec.ts` has tests for: valid login, wrong pin, inactive user, unknown tenant
- [ ] No `accessToken` field anywhere — shape is `{ token, user }` throughout

---

## Files to Create or Modify

- `apps/gateway/src/auth/auth.module.ts`
- `apps/gateway/src/auth/strategies/jwt.strategy.ts`
- `apps/gateway/src/auth/guards/gql-auth.guard.ts`
- `apps/gateway/src/auth/decorators/current-user.decorator.ts`
- `apps/gateway/src/auth/decorators/public.decorator.ts`
- `apps/gateway/src/auth/interfaces/auth.interfaces.ts`
- `apps/gateway/src/auth/repository/auth.repository.ts`
- `apps/gateway/src/auth/service/auth.service.ts`
- `apps/gateway/src/auth/resolver/auth.resolver.ts`
- `apps/gateway/src/auth/test/auth.service.spec.ts`
