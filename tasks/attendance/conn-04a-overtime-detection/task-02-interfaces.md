# CONN-04a Task 02 — Interfaces TypeScript

**Domain:** `[BACKEND]`  
**Status:** `completed`  
**Depends on:** [Task 01](./task-01-schema-migration.md)  
**Epic:** [CONN-04a](./00-epic-and-decisions.md)

---

## Goal

Definir contratos TypeScript del dominio overtime (repository + services) sin lógica de negocio.

---

## Scope

### Archivos

- `apps/api/src/overtime/interfaces/overtime.interfaces.ts`
- `apps/api/src/overtime/interfaces/overtime-approval.interfaces.ts` (opcional si el archivo principal crece mucho)

### Tipos mínimos

| Tipo                        | Descripción                                                        |
| --------------------------- | ------------------------------------------------------------------ |
| `OvertimeRequestRecord`     | Entidad persistida mapeada desde Prisma                            |
| `OvertimeApprovalRecord`    | Registro de decisión por nivel                                     |
| `ExitRegisteredPayload`     | Input del hook post-`EXIT`                                         |
| `OvertimeInboxFilters`      | `status`, `payrollPeriod`, `locationId`, `employeeId`, cursor/take |
| `ApproveOvertimeInput`      | `overtimeRequestId`, `comment?`                                    |
| `ObjectOvertimeInput`       | `overtimeRequestId`, `comment` (obligatorio)                       |
| `IOvertimeRepository`       | Contrato data access                                               |
| `IOvertimeDetectionService` | `onExitRegistered(...)`                                            |
| `IOvertimeApprovalService`  | `approve(...)`, `object(...)`, `listInbox(...)`                    |

### Símbolos de inyección

```typescript
export const OVERTIME_REPOSITORY = Symbol('OVERTIME_REPOSITORY');
```

---

## Out of scope

- Implementación repository/service.
- DTOs Swagger (task 08).

---

## Files allowed

- `apps/api/src/overtime/interfaces/**` — create

---

## Files forbidden

- `prisma/schema.prisma`
- `apps/api/src/overtime/repository/**`
- `apps/api/src/overtime/service/**`
- `apps/api/src/app.module.ts`

---

## Acceptance criteria

- [ ] Interfaces exportadas sin `any`.
- [ ] Tipos alineados 1:1 con enums Prisma de task 01.
- [ ] `pnpm typecheck` pasa (módulo aún no wired no debe romper build si no se importa).

---

## Validation commands

```bash
pnpm typecheck
```
