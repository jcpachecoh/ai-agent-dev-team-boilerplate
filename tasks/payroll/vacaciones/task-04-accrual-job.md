# OS-589 Task 04 — Job mensual de acumulación (proporcional a `hireDate`)

**Domain:** `[BACKEND]` `[BULLMQ]`  
**Status:** `pending`  
**Depends on:** [Task 03](./task-03-repository.md)  
**Epic:** [OS-589](./00-epic-and-decisions.md)

---

## Goal

Implementar un **job mensual idempotente** que acredite días de vacaciones **proporcionales a `EmployeeDetails.hireDate`** (prorrateo por días calendario del mes) y actualice `VacationBalance.lastAccrualDate` al último mes procesado.

---

## Scope

### Archivos propuestos

- `apps/api/src/vacations/jobs/vacation-accrual.processor.ts` — processor BullMQ
- `apps/api/src/vacations/jobs/vacation-accrual.scheduler.ts` — registro cron mensual (día 1, 02:00 America/Bogota — documentar TZ)
- `apps/api/src/vacations/service/vacation-accrual.service.ts` — lógica de acumulación
- `apps/api/src/vacations/utils/vacation-accrual.utils.ts` — helper puro `calculateMonthlyAccrual(hireDate, accrualMonth)`
- `apps/api/src/vacations/test/vacation-accrual.utils.spec.ts` — tests del helper (casos borde)
- `apps/api/src/vacations/test/vacation-accrual.service.spec.ts`

### Helper puro (`vacation-accrual.utils.ts`)

Exportar función testeable según **D3** del epic:

```typescript
/**
 * @param hireDate — fecha de ingreso (EmployeeDetails.hireDate)
 * @param accrualMonth — cualquier fecha dentro del mes calendario a acreditar
 * @returns días a acreditar (2 decimales, half-up); 0 si hireDate es posterior al mes
 */
export function calculateMonthlyAccrual(hireDate: Date, accrualMonth: Date): number;
```

Reglas:

- `daysInMonth` = días calendario del mes de `accrualMonth`.
- `workStart` = `max(hireDate @ 00:00, primer día del mes)`.
- `workEnd` = último día del mes.
- `daysWorked` = días **inclusivos** entre `workStart` y `workEnd`.
- Si `workStart > workEnd` → `0`.
- Si no → `MONTHLY_ACCRUAL_DAYS * (daysWorked / daysInMonth)`.

### Lógica (`VacationAccrualService.accrueForTenant`)

1. Listar empleados activos con `hireDate`: `EmployeeDetails` con `tenantId`, `isActive: true`, `deletedAt: null`.
2. `accrualThroughMonth` = **mes calendario anterior** al de la corrida (nunca acreditar el mes en curso).
3. Por cada empleado:
   - Leer o crear `VacationBalance` (saldo inicial en 0).
   - `firstMonthToProcess` = mes de `hireDate` si no hay `lastAccrualDate`; si hay, mes **siguiente** a `lastAccrualDate`.
   - Iterar mes a mes desde `firstMonthToProcess` hasta `accrualThroughMonth` (inclusive):
     - `delta = calculateMonthlyAccrual(hireDate, month)`.
     - Si `delta > 0`: `accruedDays += delta`.
     - Actualizar `lastAccrualDate` al primer día de ese mes (`YYYY-MM-01`).
   - Si no hay meses pendientes → **skip** (idempotencia).
4. Log estructurado: `tenantId`, empleados procesados, meses acreditados, días totales, skips, errores.

### Método reutilizable (`syncEmployeeBalance`)

Exportar en el mismo service para uso en task 05:

```typescript
syncEmployeeBalance(tenantId: string, employeeId: string, hireDate: Date): Promise<VacationBalanceRecord>;
```

Misma lógica de catch-up que el job, pero para **un** empleado. Permite saldo correcto al consultar antes del próximo cron.

### Idempotencia

- Re-ejecutar el job en el mismo mes **no** debe duplicar días ya acreditados.
- `lastAccrualDate` = primer día del **último mes calendario** procesado (no `now()`).
- Test explícito: segunda corrida sin meses nuevos → `accruedDays` sin cambio.

### Tests del helper (obligatorios)

| Caso                       | hireDate   | Mes                | Esperado              |
| -------------------------- | ---------- | ------------------ | --------------------- |
| Mes completo               | 2024-01-01 | 2024-06            | `1.25`                |
| Ingreso día 15 (31 días)   | 2024-03-15 | 2024-03            | `(17/31)×1.25 ≈ 0.69` |
| Ingreso día 15 (30 días)   | 2024-04-15 | 2024-04            | `(16/30)×1.25 ≈ 0.67` |
| Ingreso después del mes    | 2024-05-10 | 2024-04            | `0`                   |
| Ingreso último día del mes | 2024-02-29 | 2024-02 (bisiesto) | `(1/29)×1.25`         |

### Tests del service

- Empleado nuevo con 3 meses desde `hireDate` → catch-up de 3 meses en primera corrida.
- Empleado con ingreso a mitad del primer mes → primer mes prorrateado, siguientes a `1.25`.
- Segunda corrida mismo mes → sin cambio.
- Crea balance si el empleado no tenía registro previo.

### Wiring

- Registrar queue/processor en `vacations.module.ts` **solo si** esta task lo permite; si `app.module.ts` es forbidden, documentar que task 08 completa el registro del módulo.
- Reutilizar patrón BullMQ existente en el repo (buscar processors en `apps/api/src/`).

---

## Out of scope

- Solicitudes y aprobaciones (task 05).
- Notificaciones al empleado.
- UI.
- Importación manual / CSV de saldos históricos.

---

## Files allowed

- `apps/api/src/vacations/jobs/**` — create
- `apps/api/src/vacations/service/vacation-accrual.service.ts` — create
- `apps/api/src/vacations/utils/vacation-accrual.utils.ts` — create
- `apps/api/src/vacations/test/vacation-accrual.utils.spec.ts` — create
- `apps/api/src/vacations/test/vacation-accrual.service.spec.ts` — create
- `apps/api/src/vacations/vacations.module.ts` — modify (solo providers de job, si ya existe desde task anterior)

---

## Files forbidden

- `prisma/schema.prisma`
- `prisma/migrations/**`
- `package.json` / `pnpm-lock.yaml`
- `apps/api/src/app.module.ts`
- `apps/web-app/**`

---

## Acceptance criteria

- [ ] Acumulación **proporcional a `hireDate`** (prorrateo por días calendario del mes).
- [ ] Mes completo trabajado → exactamente **1.25** días.
- [ ] Catch-up automático desde mes de ingreso hasta mes anterior al actual.
- [ ] Segunda ejecución sin meses pendientes no duplica acumulación.
- [ ] `lastAccrualDate` almacena `YYYY-MM-01` del último mes acreditado.
- [ ] `syncEmployeeBalance` exportado para task 05.
- [ ] Tests del helper y del service con Prisma/repository mockeados.
- [ ] `pnpm --filter=api test -- vacation-accrual` pasa.

---

## Validation commands

```bash
pnpm --filter=api test -- vacation-accrual
```
