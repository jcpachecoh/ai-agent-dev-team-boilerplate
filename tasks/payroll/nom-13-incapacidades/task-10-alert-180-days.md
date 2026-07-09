# NOM-13 Task 10 — Alerta 180 días acumulados

**Domain:** `[BACKEND]` `[FRONTEND]`  
**Status:** `pending`  
**Depends on:** [Task 05](./task-05-medical-leave-service.md), [Task 09](./task-09-frontend-novedades.md)  
**Epic:** [NOM-13](./00-epic-and-decisions.md)

---

## Goal

Alertar cuando un empleado supera **180 días acumulados** de incapacidad en el año calendario (epic PC-3).

---

## Scope

### Backend

- En `register` y `getById`, incluir en respuesta:
  ```typescript
  annualAccumulatedDays: number;
  exceeds180DayThreshold: boolean;
  ```
- Año calendario = `startDate.getUTCFullYear()` del nuevo registro (MVP; ver Q1 epic).
- Suma `totalDays` de incapacidades activas (`deletedAt: null`) del empleado en ese año.

### Frontend

- Banner de advertencia en formulario y ficha cuando `exceeds180DayThreshold === true`.
- Copy sugerido: _"Este colaborador supera los 180 días acumulados de incapacidad en el año. Revisión legal requerida."_
- No bloquear registro en MVP (solo alerta); documentar si producto exige bloqueo.

### Tests

- Service: empleado con 170 días + nueva de 15 → flag true.
- Empleado con 50 días → flag false.

---

## Out of scope

- Notificación email/push.
- Workflow de aprobación especial post-180.

---

## Files allowed

- `apps/api/src/medical-leaves/service/**`
- `apps/api/src/medical-leaves/controller/dto/**` — response fields
- `apps/web-app/src/features/payroll/**` — banner
- Tests correspondientes

---

## Files forbidden

- `prisma/schema.prisma`
- `packages/**`

---

## Acceptance criteria

- [ ] Flag correcto al cruzar umbral 180.
- [ ] UI muestra alerta visible (no solo tooltip).
- [ ] Tests unitarios del umbral.

---

## Validation commands

```bash
pnpm --filter api test medical-leaves.service
pnpm --filter web-app test
```
