# EMP-POS-01 Task 11 — Documentación, Postman y rollout

## Goal

Documentar la nueva estructura, actualizar colección Postman y validar rollout en staging.

**Depends on:** Tasks 01–10.

---

## Scope

- Actualizar `postman/restopsiq-api.collection.json` con endpoints `employee-positions`.
- Notas de migración/backfill para equipo.
- Checklist de QA manual.

---

## Out of scope

- Código de aplicación nuevo.

---

## Files allowed

- `postman/restopsiq-api.collection.json` — add folder `Employee Positions`
- `tasks/employee-positions/00-epic.md` — marcar criterios completados al cerrar epic

---

## Postman folder (requests)

1. `List Employee Positions`
2. `Get Employee Position by ID`
3. `Create Employee Position`
4. `Update Employee Position`
5. `Deactivate Employee Position`
6. `Get Employee Position History`
7. `Create Employee with positionId` (existing employees folder)

Variables: `{{tenantId}}`, `{{accessToken}}`, `{{positionId}}`, `{{employeeDetailsId}}`.

---

## QA checklist manual

- [ ] Crear cargo "Contador" en área "Finanzas".
- [ ] Listar cargos — aparece activo.
- [ ] Crear empleado asignando ese cargo.
- [ ] Consultar historial — 1 entrada con `effectiveTo = null`.
- [ ] Cambiar cargo del empleado — historial muestra 2 entradas (primera cerrada).
- [ ] Intentar desactivar cargo con empleado activo — error 409.
- [ ] Reasignar empleados y desactivar cargo — éxito.
- [ ] Dropdown FE muestra solo cargos activos.

---

## Validation commands (release gate)

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test:cov
pnpm --filter=@restopsiq/web-app typecheck
pnpm --filter=@restopsiq/web-app test
```

---

## Acceptance criteria

- [ ] Postman collection incluye carpeta Employee Positions.
- [ ] QA checklist ejecutado en staging.
- [ ] Epic acceptance criteria marcados en PR.
