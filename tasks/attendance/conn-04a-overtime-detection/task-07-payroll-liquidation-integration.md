# CONN-04a Task 07 — Integración liquidación NOM-07 / OS-586

**Domain:** `[BACKEND]` `[PAYROLL]`  
**Status:** `completed`  
**Depends on:** [Task 05](./task-05-approval-cascade-service.md)  
**Epic:** [CONN-04a](./00-epic-and-decisions.md)

---

## Goal

Cerrar `GAP(OS-586)`: solo minutos de tiempo extra con `OvertimeRequest.status === APROBADA` deben liquidarse en NOM-07.

---

## Scope

### Archivos candidatos

- `apps/api/src/reports/service/reports.service.ts` — `buildAttendanceSummary` / `addOvertimeMinutes`
- `apps/api/src/payroll/service/payroll-calculation.service.ts` — consumo de `overtimeEntries`
- `apps/api/src/overtime/repository/overtime.repository.ts` — query `findApprovedMinutesByEmployeeIdsForPeriod`
- Tests en `reports.service.spec.ts` y `payroll-calculation.service.spec.ts`

### Comportamiento

1. Al construir `AttendanceMonthSummary.overtimeEntries` para un período, cruzar con solicitudes `APROBADA` del mismo `payrollPeriod`.
2. Minutos detectados en marcaciones pero **sin** solicitud aprobada → **excluir** de `overtimeEntries` (o marcar `excludedReason: 'PENDING_APPROVAL'` en debug interno — no exponer en API pública MVP).
3. Solicitud `OBJETADA` → minutos excluidos.
4. Solicitud parcialmente aprobada no aplica — MVP: todo el acumulado de la solicitud se paga o no se paga junto.

### Cierre de período (OS-380) — solo advertencia (D8)

- Endpoint `GET /attendance/overtime-requests/summary?payrollPeriod=...` retorna conteos.
- Respuesta incluye `pendingCount` para banner de advertencia en wizard de cierre.
- **No bloquear** liquidación si `pendingCount > 0`.
- Minutos no aprobados excluidos de `overtimePay` aunque el usuario continúe el cierre.

---

## Out of scope

- Cambiar tasas legales OS-586.
- CONN-04b.
- UI wizard de cierre (solo contrato API).

---

## Files allowed

- `apps/api/src/reports/service/reports.service.ts` — modify
- `apps/api/src/payroll/service/payroll-calculation.service.ts` — modify (si aplica)
- `apps/api/src/overtime/repository/overtime.repository.ts` — modify
- `apps/api/src/overtime/interfaces/**` — modify
- `apps/api/src/reports/test/**` — modify
- `apps/api/src/payroll/test/**` — modify

---

## Files forbidden

- `prisma/schema.prisma` (salvo bug crítico)
- `apps/web-app/**`
- `apps/api/src/app.module.ts`

---

## Acceptance criteria

- [ ] HE detectada sin aprobación **no** incrementa `overtimePay`.
- [ ] HE con solicitud `APROBADA` sí liquida.
- [ ] HE con solicitud `OBJETADA` no liquida.
- [ ] Test de regresión OS-586 sigue pasando para HE aprobada.
- [ ] Documentar resolución de `GAP(OS-586)` en comentario de código.

---

## Validation commands

```bash
pnpm --filter=api test -- reports.service
pnpm --filter=api test -- payroll-calculation
```
