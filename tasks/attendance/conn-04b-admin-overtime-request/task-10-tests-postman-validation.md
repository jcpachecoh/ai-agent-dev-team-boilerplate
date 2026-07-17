# CONN-04b Task 10 — Tests, Postman y validación final

**Domain:** `[BACKEND]` `[FRONTEND]` `[POSTMAN]`  
**Status:** `done`  
**Depends on:** Tasks 01–09  
**Epic:** [CONN-04b](./00-epic-and-decisions.md)

---

## Goal

Cerrar la validación de OS-606: cobertura de tests de regresión, colección Postman CONN-04b y checklist de acceptance del epic.

---

## Scope (entregado)

### Tests BE

- Create batch, tx, medianoche, duplicado/overlap, motivo inactivo, 403 sede — `overtime-admin-create.service.spec.ts` + controller/repo.
- Cascada / objeción — approval specs + create status inicial Ops.
- CONN-04a detection sin regresiones — `overtime-detection.service.spec.ts`.
- pending-salary / variable-average — Task-09 specs.
- NOM-07 intersección — `reports.service.spec.ts` + `liquidable-overtime-intervals.util.spec.ts`.

### Tests FE

- Inbox create + columna origen — `OvertimeInboxScreen` / modal / table specs.
- Card origen/estado — mapper + `AttendanceCardScreen` specs.
- Mocks de ruta: `AttendancePage.test.tsx` / `PayrollPage.test.tsx` actualizados (OvertimeInbox + EmployeeCatalogAdmin).

### Postman

Carpeta oficial: **`OS-606 / CONN-04b — Solicitud administrativa de extensión`**

1. Login Admin sede / Ops / GG
2. GET motivos `OVERTIME_REASON`
3. POST create administrative (2 empleados)
4. GET inbox período
5. Approve Ops → Approve GG
6. Object Ops (segunda fila del batch)
7. Tarjeta OS-551 + payroll NOM-07 + detail

Variables `accessTokenOvertimeOps` / `accessTokenOvertimeGG` reutilizadas.  
`postman/README.md` + `local.environment.json` actualizados (diff quirúrgico).

---

## Out of scope

- Features nuevas no listadas en el epic.
- Email real.
- Crear DB / alterar `.env` local para smoke.

---

## Acceptance criteria

- [x] AC del epic marcables en verde (P1–P3 cerrados Task-08; P4 documentado = NOMINA no crea).
- [x] Postman runnable en local con seed demo (colección lista; ejecución newman pendiente de API+DB).
- [x] Comandos de validación abajo OK (API full; web attendance + page tests).
- [x] Sin regresiones CONN-04a detection/cascade (suites overtime verdes).

---

## Validation commands (ejecutados)

```bash
cd apps/api && pnpm exec jest src/overtime/test src/reports/test/reports.service.spec.ts \
  src/payroll/test/pending-salary.service.spec.ts src/payroll/test/variable-average.service.spec.ts \
  src/payroll/test/approved-overtime-money.util.spec.ts \
  src/payroll/test/employee-catalog.*.spec.ts --runInBand
# → 17 suites / 256 passed

cd apps/api && pnpm exec jest --coverage --coverageReporters=text-summary --runInBand
# → 335 suites / 4052 passed · stmts 92.82% / branches 80.03% / lines 93.02%

cd apps/api && pnpm run typecheck && pnpm run build
node scripts/validate-structure.js   # ✅ 42 modules

cd apps/web-app && pnpm run typecheck && pnpm run build
cd apps/web-app && pnpm exec vitest run src/features/attendance --passWithNoTests
# → 17 files / 112 passed

cd apps/api && pnpm exec jest --config prisma/seeds/jest.config.js --runInBand
# → 11 passed
```

### Smoke E2E / CI remoto

- Smoke newman **no** ejecutado: API local detenida; `DATABASE_URL` → DB `restopsiq_os606_seed_tmp` inexistente.
- CI remoto **no** consultable: sin upstream; `gh` auth inválido.

---

## Files changed (Task-10)

- `postman/restopsiq-api.collection.json`
- `postman/README.md`
- `postman/local.environment.json`
- `apps/web-app/src/pages/AttendancePage/AttendancePage.test.tsx` (mock OvertimeInbox)
- `apps/web-app/src/pages/PayrollPage/PayrollPage.test.tsx` (mock catalog + screens)
- `apps/api/src/reports/service/reports.service.ts` (`prefer-const` adminWindows)
- `tasks/OS-606.md`, este archivo, epic AC

---

## Reporting (SDD)

1. Files changed — ver arriba + diff OS-606 Tasks 01–09 en working tree
2. Why — Postman/validación/cierre; mocks de ruta rotos por exports OS-606
3. No unrelated product features added
4. Forbidden (`package.json`, lockfile) no tocados
5. Validation — ver tabla en `tasks/OS-606.md`
6. Deviations — smoke live y CI remoto pendientes de entorno/auth
