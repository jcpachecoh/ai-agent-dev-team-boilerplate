# OS-589 Task 11 — Tests, validación y rollout

**Domain:** `[BACKEND]` `[FRONTEND]` `[QA]`  
**Status:** `pending`  
**Depends on:** Tasks [01](./task-01-schema-migration.md)–[10](./task-10-payroll-compensation.md)  
**Epic:** [OS-589](./00-epic-and-decisions.md)

---

## Goal

Consolidar cobertura de tests, validar los **criterios de aceptación del epic** end-to-end y documentar comandos de verificación para PR.

---

## Scope

### Tests backend (complementar gaps)

| Área                     | Mínimo                                                                |
| ------------------------ | --------------------------------------------------------------------- |
| `VacationsService`       | Cobertura ≥ 80% (saldo, doble aprobación, rechazos, compensación 50%) |
| `VacationAccrualService` | Prorrateo por `hireDate`, catch-up, idempotencia mensual              |
| `VacationLetterService`  | Generación y storage mockeados                                        |
| Asistencia integración   | PC-1 + D6 (task 07)                                                   |
| Controller/Resolver      | Delegación y guards                                                   |
| Payroll compensación     | Ítem en liquidación (task 10)                                         |

### Tests frontend

- `VacationRequestModal` — validación fechas y tipos (Mi perfil).
- `MyVacationRequestsTable` — estados y descarga carta.
- `VacationApprovalTable` — acciones visibles por estado/rol.
- Hook `useMyVacationBalance` — estados loading/error.

### E2E (opcional si infra disponible)

Flujo feliz en `apps/api/src/**/test/*.e2e-spec.ts` (smoke REST ya cubierto por Postman en [task 08](./task-08-api-endpoints-dtos.md)):

1. Consultar saldo empleado seed.
2. Crear solicitud DISFRUTE.
3. Aprobar nivel 1 (supervisor).
4. Aprobar nivel 2 (RRHH).
5. Verificar carta PDF disponible.
6. Intentar marcación en rango → **409/403**.
7. Verificar empleado **no** aparece como ausente en monitor.

### Checklist criterios de aceptación (epic)

Reproducir y marcar cada ítem del epic sección "Criterios de aceptación":

- [ ] Acumulación proporcional a `hireDate` (prorrateo por días del mes; catch-up desde ingreso)
- [ ] No aprobar si excede saldo
- [ ] **PC-2** doble aprobación Supervisor + segundo cargo
- [ ] Carta PDF en aprobar/rechazar
- [ ] **PC-1** vacaciones no cuentan como ausencia
- [ ] Marcación bloqueada en rango DISFRUTE
- [ ] Compensación en siguiente liquidación
- [ ] Empleado ve saldo y solicita vacaciones en **Mi perfil** (`/mi-perfil`)
- [ ] Vacaciones **no** aparecen en Perfil de Empleado RRHH
- [ ] Multi-tenant en todas las queries

### Documentación

- Postman: cubierto en [task 08](./task-08-api-endpoints-dtos.md) (carpeta `OS-589 Vacations`).
- Notas de rollout: job mensual debe estar activo en staging; permisos L1/L2 en seed.

---

## Out of scope

- Nuevas features fuera del epic.
- Performance/load testing.
- Migración de datos históricos.

---

## Files allowed

- `apps/api/src/vacations/test/**` — modify/create
- `apps/api/src/attendance/test/**` — modify (tests integración)
- `apps/api/src/payroll/test/**` — modify
- `apps/web-app/src/features/payroll/**/*.test.tsx` — create/modify

---

## Files forbidden

- `prisma/schema.prisma`
- `package.json` / `pnpm-lock.yaml`
- Refactors no relacionados

---

## Acceptance criteria

- [ ] Todos los tests de vacaciones en verde.
- [ ] Cobertura service vacaciones ≥ 80%.
- [ ] Checklist epic completo o desviaciones documentadas.
- [ ] Pipeline local pasa:

```bash
pnpm lint
pnpm typecheck
pnpm --filter=api test -- vacations
pnpm --filter=web-app test -- Vacation
node scripts/validate-structure.js
```

---

## Validation commands

```bash
pnpm lint
pnpm typecheck
pnpm --filter=api test -- vacations --coverage
pnpm --filter=web-app test -- Vacation
node scripts/validate-structure.js
```

---

## Known deviations template

Si algún criterio no se cumple en MVP, documentar aquí antes de cerrar el epic:

| Criterio         | Estado         | Motivo                      | Follow-up |
| ---------------- | -------------- | --------------------------- | --------- |
| Q1 segundo cargo | Resuelto       | Recursos Humanos (`NOMINA`) | —         |
| Q5 días hábiles  | MVP calendario | Sin festivos CO             | OS-\_\_\_ |
