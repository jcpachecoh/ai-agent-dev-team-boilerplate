# NOM-14 Task 10 — Frontend Novedades (bandeja e histórico)

**Domain:** `[FRONTEND]` `[WEB-APP]`  
**Status:** `pending`  
**Depends on:** [Task 09](./task-09-api-endpoints-dtos.md)  
**Epic:** [NOM-14](./00-epic-and-decisions.md)

---

## Goal

UI de RRHH y supervisores para bandeja de aprobación, listado histórico, registro en nombre del empleado y configuración básica de tipos — opción de menú **Novedades** en Nómina (epic D6).

---

## Scope

### Rutas

- `/payroll/novedades` — pantalla principal NOM-14.
- Mantener `/payroll/novedades/incapacidades` (NOM-13) como ítem hermano en menú.

### Navegación

En `navigation.ts` bajo Nómina:

```typescript
{ id: 'payroll-novedades', label: 'Novedades', path: '/payroll/novedades', icon: ClipboardList }
```

Actualizar `breadcrumbLabels` correspondiente.

### Pantalla `PayrollNovedadesScreen`

**Dos pestañas:**

1. **Bandeja de aprobación**
   - RRHH: registros `PENDIENTE_RRHH`.
   - Supervisor: registros `PENDIENTE_SUPERVISOR` de sus empleados.
   - Acciones: Aprobar / Rechazar (modal con motivo obligatorio).
   - Badge de estado y tipo.

2. **Listado histórico**
   - Todos los estados.
   - Filtros: empleado, tipo, sede, rango de fechas.
   - Paginación cursor-based.

### Componentes

- `NovedadFormModal` — crear (RRHH en nombre del empleado): empleado, tipo, fechas, `isPaid`, notas, adjunto.
- `NovedadRejectModal` — motivo obligatorio.
- `NovedadOverlapWarningDialog` — confirmar si API retorna solapamiento.
- `NovedadTypeConfigPanel` — lectura/edición flags por tipo (modal o drawer).
- `NovedadDetailDrawer` — fechas, soporte descargable, trazabilidad aprobaciones.

Reutilizar: `EmpleadoPage`, `EmpleadoTable`, filtros de sede, CSS Modules, estados loading/error/empty.

### Cliente API

- `apps/web-app/src/features/payroll/api/payroll-novedades.client.ts`
- Hooks: `usePayrollNovedadesQuery`, `usePayrollNovedadMutations`, `useNovedadTypeConfigQuery`
- Query keys en `queryKeys.ts`

### RBAC

- `apps/web-app/src/config/rbac.config.ts` — permisos `payroll-novedades.*`
- Filtrar ítem de menú y acciones según rol.

### UX

- Mostrar alerta `NO_SUPERVISOR_ASSIGNED` cuando API retorna warning.
- Tipos con soporte obligatorio: deshabilitar guardar sin adjunto.
- Rechazos: motivo visible en detalle para trazabilidad RRHH.

---

## Out of scope

- App empleado CONN-07.
- Incapacidades (NOM-13).
- Export PDF/Excel.

---

## Files allowed

- `apps/web-app/src/features/payroll/**` — novedades UI
- `apps/web-app/src/pages/PayrollPage/**` — ruta
- `apps/web-app/src/constants/navigation.ts`
- `apps/web-app/src/config/rbac.config.ts`

---

## Files forbidden

- `apps/api/**`
- `prisma/**`
- `packages/**`

---

## Acceptance criteria

- [ ] Menú **Novedades** visible en módulo Nómina.
- [ ] Pestañas Bandeja e Histórico operativas.
- [ ] RRHH puede crear novedad en nombre del empleado con adjunto.
- [ ] Rechazo exige motivo; se muestra en detalle.
- [ ] Supervisor solo ve bandeja de sus empleados.
- [ ] `pnpm --filter=web-app typecheck` pasa.

---

## Validation commands

```bash
pnpm --filter=web-app typecheck
pnpm --filter=web-app lint
```
