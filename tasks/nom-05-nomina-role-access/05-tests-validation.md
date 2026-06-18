# NOM-05 Task 05 — Pruebas y validación

**Domain:** `[BACKEND]` `[FRONTEND]` `[QA]` `[E2E]`  
**Status:** `pending`  
**Depends On:** [02-backend-role-guards.md](./02-backend-role-guards.md), [04-frontend-protected-routes.md](./04-frontend-protected-routes.md)

---

## Goal

Cubrir con tests automatizados y checklist manual el aislamiento del rol `NOMINA`.

---

## Scope

### Unit tests backend

- [ ] `roles.guard.spec.ts`:
  - Rechaza `NOMINA` en resolver/controller de inventario → `ForbiddenException`.
  - Permite `NOMINA` en `GET` payroll.
  - Rechaza `NOMINA` en `POST` payroll.
  - Permite `MANAGER` en mutaciones payroll.
- [ ] Validar extracción de `tenantId` en guard (mock request sin tenant → error esperado).

### Unit tests frontend

- [ ] `useModuleAccess.test.ts`: `NOMINA` + `INVENTARIOS` → `false`.
- [ ] `rbac.config.test.ts`: matriz completa para módulos críticos.
- [ ] `ProtectedRoute.test.tsx`: redirección a `/unauthorized`.

### E2E / integración

- [ ] Test API (Jest + supertest o e2e existente):
  - Login usuario `NOMINA` → `GET /api/employees` → 200.
  - Mismo token → `GET /api/supply-items` (o ruta inventario) → 403.
- [ ] Actualizar `postman/restopsiq-api.collection.json` (carpeta opcional `NOMINA RBAC`) con requests negativos.

### Checklist manual (QA)

- [ ] Login `NOMINA` → sidebar solo nómina (3 ítems).
- [ ] Deep link `/proveedores` → `/unauthorized`.
- [ ] Intento crear empleado (UI no visible + API 403 si se fuerza).
- [ ] Login `MANAGER` → sin regresiones en nómina e inventario.

## Out of scope

- Playwright E2E completo del monorepo (salvo que ya exista suite y se agregue un caso).
- Cobertura 80% global del API (solo archivos tocados en epic).

## Files allowed

- `apps/api/src/common/guards/test/**` o `roles.guard.spec.ts`
- `apps/api/test/**` (e2e payroll rbac)
- `apps/web-app/src/hooks/useModuleAccess.test.ts`
- `apps/web-app/src/config/rbac.config.test.ts`
- `apps/web-app/src/components/auth/ProtectedRoute.test.tsx`
- `postman/restopsiq-api.collection.json`

## Files forbidden

- Implementación de features nuevas fuera de tests.
- `schema.prisma`, migraciones.

---

## Acceptance criteria

- [ ] Todos los tests listados pasan en CI.
- [ ] Checklist manual documentado en PR con capturas o notas.
- [ ] Sin regresión en suite `pnpm --filter @restopsiq/api test:cov` (umbrales existentes).
- [ ] `pnpm run typecheck` monorepo en verde.

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter @restopsiq/api test -- --testPathPattern=roles.guard
pnpm --filter @restopsiq/web-app test -- src/hooks/useModuleAccess src/config/rbac.config src/components/auth/ProtectedRoute
pnpm run typecheck
pnpm --filter @restopsiq/api test:cov   # verificar umbral branches
```

## Reporting (SDD)

Al cerrar el epic, reportar:

1. Archivos cambiados por task.
2. Confirmación de archivos forbidden no tocados.
3. Resultado de cada comando de validación.
4. Desviaciones (ej. si Salarios queda visible para MANAGER pero no NOMINA).
