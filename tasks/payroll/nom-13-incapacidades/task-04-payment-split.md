# NOM-13 Task 04 — Cálculo `calculatePaymentSplit`

**Domain:** `[BACKEND]`  
**Status:** `pending`  
**Depends on:** [Task 02](./task-02-interfaces.md)  
**Epic:** [NOM-13](./00-epic-and-decisions.md)

---

## Goal

Implementar la lógica pura de reparto de días y montos entre empleador, EPS (común) y ARL (laboral).

---

## Scope

### Archivos

- `apps/api/src/medical-leaves/utils/medical-leave-payment.utils.ts`
- `apps/api/src/medical-leaves/test/medical-leave-payment.utils.spec.ts`

### Reglas (epic D2)

**COMUN** — por cada día ordinal `d` del evento (1..N):

| Día    | Pagador   | % base diaria                    |
| ------ | --------- | -------------------------------- |
| 1–2    | Empleador | 100%                             |
| 3–90   | EPS       | 66.67%                           |
| 91–180 | EPS       | 50%                              |
| >180   | —         | warning; no asignar a EPS en MVP |

**LABORAL** — todos los días → ARL 100%, empleador 0.

### Helpers

- `calculateInclusiveCalendarDays(start, end)` — reutilizar patrón de vacaciones si existe en shared util.
- `resolveDailySalary(salaryAmount: Decimal): Decimal` — `salaryAmount / 30`, redondeo half-up 2 decimales.

### Casos de test obligatorios

1. Común 5 días → 2 empleador, 3 EPS (66.67%).
2. Común 95 días → 2 empleador + 88 EPS al 66.67% + 5 EPS al 50%.
3. Laboral 10 días → 0 empleador, 10 ARL al 100%.
4. Común 200 días → warning por exceder 180.
5. Un solo día común → 1 día empleador.

---

## Out of scope

- Persistencia.
- Prorrateo por período de nómina (task 07).

---

## Files allowed

- `apps/api/src/medical-leaves/utils/**`
- `apps/api/src/medical-leaves/test/medical-leave-payment.utils.spec.ts`

---

## Files forbidden

- `prisma/**`
- `apps/api/src/reports/**`
- `apps/web-app/**`

---

## Acceptance criteria

- [ ] Montos y días cuadran con tablas del epic.
- [ ] Cobertura > 90% en utils.
- [ ] Sin dependencias de Prisma en utils (función pura).

---

## Validation commands

```bash
pnpm --filter api test medical-leave-payment.utils
```
