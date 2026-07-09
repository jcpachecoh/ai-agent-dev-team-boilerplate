# NOM-13 Task 09 — Frontend Novedades (registro RRHH)

**Domain:** `[FRONTEND]` `[WEB-APP]`  
**Status:** `pending`  
**Depends on:** [Task 08](./task-08-api-endpoints-dtos.md)  
**Epic:** [NOM-13](./00-epic-and-decisions.md)

---

## Goal

UI para que RRHH registre incapacidades, consulte el historial, cambie estados y adjunte el soporte médico dentro del módulo **Novedades** (NOM-13).

---

## Scope

### Rutas

- `/payroll/novedades/incapacidades` (o tab `incapacidades` en shell Novedades si existe).
- Entrada en `navigation.ts` bajo Nómina → Novedades.

### Pantallas / componentes

- `MedicalLeavesScreen` — listado con filtros (sede, empleado, estado, mes).
- `MedicalLeaveFormModal` — crear: empleado, origen (COMUN/LABORAL), fechas, adjunto.
- Vista de solo lectura del split calculado (días empleador / EPS-ARL y montos) tras guardar o en preview antes de confirmar.
- Acciones de estado: Radicar EPS, Marcar recobrada, Rechazar (modal motivo).
- Descarga de soporte médico.
- Reutilizar `EmpleadoPage`, `EmpleadoTable`, `RecetaFilterSelect`, CSS Modules.

### Cliente API

- `apps/web-app/src/features/payroll/api/medical-leaves.client.ts`
- Hooks: `useMedicalLeavesQuery`, `useMedicalLeaveMutations`
- Query keys en `queryKeys.ts`

### UX

- Mostrar badges de estado (`REGISTRADA`, `RADICADA_EPS`, etc.).
- Origen común vs laboral con etiquetas claras.
- Loading / error / empty states obligatorios.

---

## Out of scope

- Alerta 180 días (task 10 — puede consumir flag del API).
- Autoservicio empleado.
- Export PDF/Excel.

---

## Files allowed

- `apps/web-app/src/features/payroll/**` — medical leaves UI
- `apps/web-app/src/pages/PayrollPage/**` — ruta
- `apps/web-app/src/constants/navigation.ts`
- `apps/web-app/src/config/rbac.config.ts` — si aplica permiso

---

## Files forbidden

- `apps/api/**`
- `prisma/**`
- `packages/**`

---

## Acceptance criteria

- [ ] RRHH puede registrar incapacidad común y laboral.
- [ ] Split visible sin editar montos manualmente.
- [ ] Adjunto sube y descarga correctamente.
- [ ] Filtro por mes (un solo selector, patrón vacaciones aprobaciones).

---

## Validation commands

```bash
pnpm --filter web-app typecheck
pnpm --filter web-app test medical-leave
```
