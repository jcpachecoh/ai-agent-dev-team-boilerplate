# CONN-05 Task 03 — Servicio de provisionamiento automático

**Domain:** `[BACKEND]`  
**Status:** `pending`  
**Depends on:** [Task 02](./task-02-schema-link-fields.md)  
**Epic:** [CONN-05](./00-epic-and-decisions.md)

---

## Goal

Al crear una marcación manual con motivo de nómina, provisionar automáticamente `PayrollNovedad` o `MedicalLeave` en la misma unidad de trabajo, sin duplicar lógica de negocio de NOM-13/NOM-14.

---

## Scope

### Servicio nuevo

- `apps/api/src/attendance/service/manual-marking-provision.service.ts` (nombre ajustable)
- Implementa `IManualMarkingProvisionService`

### Flujo

```
createManualMarking() [AttendanceCardService]
  → registerEvent (log MANUAL)
  → si reason.target === ATTENDANCE_ONLY → fin
  → si PAYROLL_NOVEDAD → PayrollNovedadesService.submit(...) o método RRHH dedicado
  → si MEDICAL_LEAVE → MedicalLeavesService.register(...)
  → persistir sourceAttendanceLogId en registro creado
```

### Reglas

| Motivo                 | Acción                                                                          |
| ---------------------- | ------------------------------------------------------------------------------- |
| `CORRECCION_MARCACION` | **No** provisionar                                                              |
| `NovedadType.*`        | Crear `PayrollNovedad`; `startDate`/`endDate` = `workDate`; `requestedBy: RRHH` |
| `INCAPACIDAD_*`        | Crear `MedicalLeave`; `origin` COMUN/LABORAL; días desde `workDate`             |

### Errores

- Actor sin permiso nómina + motivo nómina → `ForbiddenException`
- Fallo en provision después de crear log → documentar compensación (rollback transaccional Prisma `$transaction`)

### Tests (service)

- `CORRECCION_MARCACION` → no llama payroll/medical services
- `PERMISO_REMUNERADO` → crea `PayrollNovedad` con vínculo
- `INCAPACIDAD_COMUN` → crea `MedicalLeave`
- Permiso insuficiente → 403

---

## Out of scope

- Controller / DTO (task 04).
- UI.
- Eliminación en cascada al borrar marcación (D6).

---

## Files allowed

- `apps/api/src/attendance/service/manual-marking-provision.service.ts` — create
- `apps/api/src/attendance/interfaces/**` — modify (tipos input)
- `apps/api/src/attendance/test/manual-marking-provision.service.spec.ts` — create
- `apps/api/src/attendance/attendance.module.ts` — modify (wiring)

---

## Files forbidden

- `prisma/schema.prisma` (salvo fix crítico)
- `apps/web-app/**`
- `packages/ui/**`

---

## Acceptance criteria

- [ ] Provision atómico o rollback documentado.
- [ ] Reutiliza servicios NOM-13/NOM-14 (no SQL directo duplicado).
- [ ] Cobertura service ≥ 80% en archivo nuevo.

---

## Validation commands

```bash
pnpm --filter=api test -- manual-marking-provision
node scripts/validate-structure.js
```
