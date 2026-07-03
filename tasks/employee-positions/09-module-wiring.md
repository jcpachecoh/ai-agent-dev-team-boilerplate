# EMP-POS-01 Task 09 — Module wiring + validate-structure

## Goal

Registrar providers y controllers/resolvers en `PayrollModule`. Validar estructura NestJS.

**Depends on:** Tasks 03–08.

---

## Scope

- Modificar `apps/api/src/payroll/payroll.module.ts`.
- Ejecutar `node scripts/validate-structure.js`.

---

## Out of scope

- Cambios a `app.module.ts` (PayrollModule ya importado).

---

## Files allowed

- `apps/api/src/payroll/payroll.module.ts`

---

## Implementation notes

Agregar a `providers`:

```typescript
EmployeePositionsRepository,
EmployeePositionsService,
```

Agregar a `controllers`:

```typescript
EmployeePositionsController,
```

Agregar a `providers` (resolver):

```typescript
EmployeePositionsResolver,
```

Exportar `EmployeePositionsService` si otros módulos lo necesitan.

---

## Acceptance criteria

- [ ] `PayrollModule` registra repository, service, controller, resolver.
- [ ] `node scripts/validate-structure.js` exit 0.
- [ ] `pnpm --filter=@restopsiq/api test -- --testPathPattern=employee-positions` pasa.

---

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api test -- --testPathPattern=employee-positions
```
