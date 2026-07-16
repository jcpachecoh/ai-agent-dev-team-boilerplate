# CONN-06 Task 05 — Ficha empleado: Rotante bloquea Áreas (OS-531)

**Domain:** `[BACKEND]` `[FRONTEND]` `[WEB-APP]`  
**Status:** `completed`  
**Depends on:** [Task 01](./task-01-schema-migration.md)  
**Epic:** [CONN-06](./00-epic-and-decisions.md)

---

## Goal

Agregar opción "Rotante" al selector Centro de Costos y bloquear completamente el campo Áreas cuando esté seleccionado, en backend (validación) y frontend (OS-531 wizard/form).

---

## Scope

### Backend

- Enum `CostCenter` expuesto en API ya incluye `ROTANTE` tras task 01.
- `CreateEmployeeDto` / `UpdateEmployeeDto`:
  - Si `costCenter === ROTANTE`: `locationId` debe ser `null` o omitido; rechazar sede enviada → `400 Bad Request`.
  - Si `costCenter !== ROTANTE`: `locationId` obligatorio (comportamiento actual).
- `PayrollService.create()` / `.update()`: aplicar reglas antes de persistir.
- Mapper/OpenAPI: documentar `ROTANTE` y nullable `locationId`.

### Frontend (`apps/web-app`)

Archivos probables (ajustar a estructura real OS-563):

- Tipos: `payroll.types.ts` — agregar `ROTANTE` a `CostCenter`.
- Wizard/form: componente Centro de Costos + Áreas en flujo creación/edición empleado.
- Cuando `costCenter === 'ROTANTE'`:
  - Deshabilitar control Áreas (Combobox/select).
  - Limpiar valor `locationId` al cambiar a Rotante.
  - Mostrar helper text: sede se determina por turnos/asistencia diaria.
- Validación Zod: `locationId` opcional solo si rotante; requerido en otros casos.
- Labels existentes: mantener "Áreas" (OS-563).

### packages/ui (si empleado page vive ahí)

- `packages/ui/src/components/empleado/**` — sincronizar select Centro de Costos si el formulario vive en UI package.

> Verificar en implementación si OS-531 usa `web-app/features/payroll` o `packages/ui/empleado-page`; modificar solo archivos del formulario activo.

---

## Out of scope

- Calendario sede diaria (task 06).
- Asignación automática (task 04).
- Informes NOM-24 (task 07).

---

## Files allowed

- `apps/api/src/payroll/controller/dto/create-employee.dto.ts`
- `apps/api/src/payroll/controller/dto/update-employee.dto.ts`
- `apps/api/src/payroll/service/payroll.service.ts`
- `apps/api/src/payroll/test/payroll.service.spec.ts` (casos rotante)
- `apps/web-app/src/features/payroll/types/payroll.types.ts`
- `apps/web-app/src/features/payroll/utils/payroll-employee-create-wizard-validation.ts`
- `apps/web-app/src/features/payroll/utils/payroll-employee-wizard-form-values.ts`
- Componentes wizard/form empleado en `apps/web-app/src/features/payroll/**`
- `packages/ui/src/components/empleado/**` (solo si formulario empleado está aquí)

---

## Files forbidden

- `schema.prisma` (salvo fix task 01)
- Módulo `daily-cost-center/` (tasks 02–04)
- Reports NOM-24

---

## Acceptance criteria

- [x] Selector Centro de Costos muestra "Rotante" junto a las 5 opciones existentes.
- [x] Al seleccionar Rotante, Áreas queda bloqueado y vacío.
- [x] Al cambiar de Rotante a otro centro, Áreas vuelve a ser editable y requerido.
- [x] POST/PATCH con `costCenter=ROTANTE` + `locationId` → 400.
- [x] POST/PATCH con `costCenter≠ROTANTE` sin `locationId` → 400.
- [x] Comportamiento de Incapacidades y demás centros sin cambios.

---

## Validation commands

```bash
pnpm --filter=api test -- payroll.service
pnpm --filter=web-app typecheck
pnpm --filter=web-app lint
```
