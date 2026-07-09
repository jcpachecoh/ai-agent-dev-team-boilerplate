# NOM-13 Task 03 — Repository

**Domain:** `[BACKEND]`  
**Status:** `pending`  
**Depends on:** [Task 02](./task-02-interfaces.md)  
**Epic:** [NOM-13](./00-epic-and-decisions.md)

---

## Goal

Implementar `MedicalLeavesRepository` con acceso Prisma multi-tenant y soft delete.

---

## Scope

- `apps/api/src/medical-leaves/repository/medical-leaves.repository.ts`
- Implementa `IMedicalLeavesRepository`.
- **Siempre** `where: { tenantId, deletedAt: null }` en lecturas.
- Soft delete: `update({ deletedAt: new Date() })`, nunca `prisma.delete`.
- `sumActiveDaysInCalendarYear`: suma `totalDays` de registros cuyo `startDate` cae en el año dado (o prorrateo por intersección — documentar elección en PR; MVP: sumar `totalDays` si `startDate` year = año).
- `findOverlappingForPayrollPeriod`: incapacidades que intersectan `[periodStart, periodEnd]`.
- `listSummaries`: join empleado + sede para nombre en UI.
- Tests: `apps/api/src/medical-leaves/test/medical-leaves.repository.spec.ts`

---

## Out of scope

- Cálculo de montos (task 04).
- Lógica de negocio HTTP.

---

## Files allowed

- `apps/api/src/medical-leaves/repository/**`
- `apps/api/src/medical-leaves/test/medical-leaves.repository.spec.ts`

---

## Files forbidden

- `prisma/schema.prisma` (salvo bugfix de task 01)
- `apps/api/src/app.module.ts`
- `apps/web-app/**`

---

## Acceptance criteria

- [ ] Repository no lanza excepciones HTTP.
- [ ] Tests con mocks de Prisma (AAA).
- [ ] Filtro `tenantId` en todos los métodos.

---

## Validation commands

```bash
pnpm --filter api test medical-leaves.repository
node scripts/validate-structure.js
```
