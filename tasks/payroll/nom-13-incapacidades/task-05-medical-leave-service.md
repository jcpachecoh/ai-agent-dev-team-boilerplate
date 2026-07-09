# NOM-13 Task 05 — MedicalLeaveService

**Domain:** `[BACKEND]`  
**Status:** `pending`  
**Depends on:** [Task 03](./task-03-repository.md), [Task 04](./task-04-payment-split.md)  
**Epic:** [NOM-13](./00-epic-and-decisions.md)

---

## Goal

Orquestar registro de incapacidades, cálculo automático de split, transiciones de estado y validaciones de negocio.

---

## Scope

- `apps/api/src/medical-leaves/service/medical-leaves.service.ts`
- `apps/api/src/medical-leaves/test/medical-leaves.service.spec.ts`

### `register`

1. Validar empleado existe y pertenece al `tenantId`.
2. Validar `startDate <= endDate`.
3. Obtener `salaryAmount` del empleado → `dailySalary`.
4. Llamar `calculatePaymentSplit(origin, dates, dailySalary)`.
5. Persistir registro con `status: REGISTRADA` y montos calculados.

### `updateStatus`

Transiciones permitidas (epic D4):

- `REGISTRADA` → `RADICADA_EPS` | `RECHAZADA`
- `RADICADA_EPS` → `RECOBRADA` | `RECHAZADA`

`RECHAZADA` requiere `rejectionReason`. Setear timestamps (`radicatedAt`, `recoveredAt`, `rejectedAt`).

### Validaciones

- No solapamiento duplicado exacto (mismo empleado, mismas fechas, activo) → `ConflictException`.
- Rol `NOMINA` para escritura.

### `getAnnualAccumulatedDays`

Delegar a repository; si >= 180 incluir warning en respuesta de `register` / `findById`.

---

## Out of scope

- Upload de archivo (task 06).
- Liquidación (task 07).
- Controller (task 08).

---

## Files allowed

- `apps/api/src/medical-leaves/service/**`
- `apps/api/src/medical-leaves/test/medical-leaves.service.spec.ts`
- `apps/api/src/medical-leaves/medical-leaves.module.ts` — wire repository + service

---

## Files forbidden

- `apps/api/src/app.module.ts`
- `apps/web-app/**`

---

## Acceptance criteria

- [ ] Registro calcula split sin input manual de montos.
- [ ] Transiciones inválidas → `BadRequestException`.
- [ ] Tests service con repository mock (>80% coverage service).

---

## Validation commands

```bash
pnpm --filter api test medical-leaves.service
node scripts/validate-structure.js
```
