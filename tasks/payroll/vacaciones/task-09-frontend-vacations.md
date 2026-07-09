# OS-589 Task 09 — Frontend: Mi perfil + aprobación de vacaciones

**Domain:** `[FRONTEND]` `[WEB-APP]`  
**Status:** `pending`  
**Depends on:** [Task 08](./task-08-api-endpoints-dtos.md)  
**Epic:** [OS-589](./00-epic-and-decisions.md)

---

## Goal

Implementar la UI de **vacaciones** en dos superficies distintas:

1. **Módulo nuevo "Mi perfil"** — autoservicio del empleado: información personal, vacaciones, dotación y futuras secciones propias.
2. **Bandeja de aprobación** (Nómina) — doble filtro Supervisor + RRHH, calendario por sede y descarga de carta PDF.

**No** agregar vacaciones al **Perfil de Empleado** de RRHH (`PayrollEmployeeProfileScreen` / OS-535). Ese perfil sigue siendo vista administrativa de RRHH.

---

## Scope

### Convenciones visuales (obligatorias)

Reutilizar el mismo patrón que **Empleados** y **Colaboradores (asistencia)**:

| Elemento                     | Componente `@restopsiq/ui`                                  | Referencia                                                     |
| ---------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------- |
| Layout de página             | `EmpleadoPage`, `EmpleadoPageHeader`, `EmpleadoPageSection` | `PayrollEmployeesListScreen`, `AttendanceCollaboratorsScreen`  |
| Toolbar (filtros + acciones) | `EmpleadoListToolbar` — **fuera** de la tabla               | Misma estructura: filtros a la izquierda, botones a la derecha |
| Tabla                        | `EmpleadoTable` + `EmpleadoTableItem`                       | Columnas, sorting y paginación igual que empleados             |
| Filtros                      | `RecetaFilterSelect`                                        | `size="md"`                                                    |
| Botones de acción            | `EmpleadoActionButton` / `InventarioPrimaryButton`          | `size="md"`                                                    |
| Métricas resumen             | `RecetaMetricCard`                                          | Saldo de vacaciones (acumulado, disfrutado, etc.)              |
| Estados async                | `LoadingState`, skeleton, error con retry, empty            | En todas las vistas con datos remotos                          |
| Estilos                      | CSS Modules + tokens SCSS del proyecto                      | Sin inline styles                                              |

**Regla de layout:** filtros y botones primarios **nunca** van dentro de `EmpleadoTable`; van en `EmpleadoListToolbar` encima de la sección de tabla.

---

### 1. Módulo nuevo: Mi perfil

**Ruta base:** `/mi-perfil`  
**Carpeta:** `apps/web-app/src/features/my-profile/`  
**Acceso:** cualquier usuario autenticado con empleado vinculado (todos los roles operativos). Documentar en RBAC como módulo propio o ruta transversal (no requiere rol NOMINA).

**Navegación:** entrada en sidebar (ej. "Mi perfil", icono `User` o similar) — visible para todos los roles con acceso al módulo.

**Estructura:** pantalla con **tabs** ordenados (misma jerarquía visual que tabs del perfil RRHH, pero contenido de solo lectura / autoservicio):

#### Tab A — Información personal

- Datos del empleado autenticado (`useMe` + query de empleado propio).
- Solo lectura en MVP: nombre, cédula, cargo, sede, contacto, etc. (campos ya expuestos por API existente).
- Sin acciones administrativas de RRHH (editar contrato, desactivar, etc.).

#### Tab B — Vacaciones

**Métricas** (`RecetaMetricCard` en fila superior):

| Campo                | Fuente                                                    |
| -------------------- | --------------------------------------------------------- |
| Días acumulados      | `accruedDays`                                             |
| Días disfrutados     | `takenDays`                                               |
| Días compensados     | `compensatedDays`                                         |
| **Saldo disponible** | `accruedDays - takenDays - compensatedDays`               |
| Fecha de ingreso     | `hireDate` (solo lectura; contexto del derecho acumulado) |
| Última acumulación   | `lastAccrualDate` (último mes calendario acreditado)      |

**Toolbar** (fuera de tabla):

- Botón primario `size="md"`: **"Solicitar vacaciones"** → abre modal/drawer con formulario.
- Filtros opcionales: estado de solicitud, rango de fechas (`RecetaFilterSelect` `size="md"`).

**Tabla** (`EmpleadoTable`): historial de **mis** solicitudes.

- Columnas sugeridas: fechas, tipo (`DISFRUTE` / `COMPENSACION`), días, estado (badge), acción descargar carta si `APROBADA` / `RECHAZADA`.
- Badges: `SOLICITADA`, `APROBADA_NIVEL_1`, `APROBADA`, `RECHAZADA`.

**Formulario solicitud** (modal):

- Campos: `startDate`, `endDate`, `type`.
- Preview `daysRequested`; advertencia si excede saldo (pre-check; validación final en BE).
- `react-hook-form` + `zod`; mutation `requestVacation`.
- Toast éxito / error.

#### Tab C — Dotación

- Tabla `EmpleadoTable` con **mis** entregas de dotación (reutilizar API/hooks de `features/payroll` filtrando por empleado autenticado).
- Solo lectura en MVP (sin registrar entregas — eso queda en `/payroll/dotaciones` para RRHH).
- Mismos filtros fuera de tabla si aplica (periodo, ítem).

#### Extensibilidad

- Dejar estructura de tabs preparada para futuras secciones (documentos, beneficios, etc.) sin implementarlas en esta task.

---

### 2. Bandeja de aprobación (Supervisor + RRHH)

**Ruta:** `/payroll/vacations` (sub-ruta de Nómina)  
**Carpeta:** `apps/web-app/src/features/payroll/screens/` + componentes en `features/payroll/components/`

- Acceso según rol: L1 (`SUPERVISOR` / `MANAGER`), L2 (`NOMINA`).
- `EmpleadoPage` + `EmpleadoListToolbar` con filtros: sede, estado, rango de fechas — todos `size="md"`, **fuera** de la tabla.
- `EmpleadoTable` con solicitudes del scope del aprobador.
- Acciones por fila según rol y estado:
  - `SOLICITADA` → "Aprobar (Supervisor)" / "Rechazar" (L1).
  - `APROBADA_NIVEL_1` → "Aprobar (RRHH)" / "Rechazar" (L2 / `NOMINA`).
- Modal rechazo: `rejectionReason` obligatorio.
- **Calendario por sede** (vista mensual): solicitudes aprobadas/pendientes — reutilizar patrón OS-582 si existe.
- Botón **"Descargar carta"** en filas `APROBADA` / `RECHAZADA` con carta generada (URL prefirmada).

---

### Archivos propuestos

**Mi perfil (nuevo módulo):**

- `apps/web-app/src/features/my-profile/screens/MyProfileScreen.tsx`
- `apps/web-app/src/features/my-profile/screens/MyProfilePersonalTab.tsx`
- `apps/web-app/src/features/my-profile/screens/MyProfileVacationsTab.tsx`
- `apps/web-app/src/features/my-profile/screens/MyProfileDotacionTab.tsx`
- `apps/web-app/src/features/my-profile/components/VacationRequestModal.tsx`
- `apps/web-app/src/features/my-profile/components/MyVacationRequestsTable.tsx`
- `apps/web-app/src/features/my-profile/components/MyDotacionTable.tsx`
- `apps/web-app/src/features/my-profile/hooks/useMyVacationBalance.ts`
- `apps/web-app/src/features/my-profile/hooks/useMyVacationRequests.ts`
- `apps/web-app/src/features/my-profile/hooks/useMyDotacion.ts`
- `apps/web-app/src/features/my-profile/api/vacations.graphql.ts` (o REST)
- `apps/web-app/src/pages/MyProfilePage/MyProfilePage.tsx`

**Aprobación (Nómina):**

- `apps/web-app/src/features/payroll/screens/VacationApprovalsScreen.tsx`
- `apps/web-app/src/features/payroll/components/VacationApprovalTable.tsx`
- `apps/web-app/src/features/payroll/components/VacationLocationCalendar.tsx`
- `apps/web-app/src/features/payroll/components/VacationRejectModal.tsx`
- `apps/web-app/src/features/payroll/hooks/useVacationApprovals.ts`

**Routing y navegación:**

- `apps/web-app/src/App.tsx` — ruta `/mi-perfil`
- `apps/web-app/src/pages/PayrollPage/PayrollPage.tsx` — sub-ruta `/vacations` (si aplica)
- `apps/web-app/src/constants/navigation.ts` — "Mi perfil" + "Vacaciones" (aprobación) en menú Nómina
- `apps/web-app/src/config/rbac.config.ts` — acceso `/mi-perfil` para roles con empleado

### Convenciones FE

- Apollo Client / React Query hooks (no `fetch` directo) — seguir convención del módulo que consuma.
- CSS Modules + tokens SCSS.
- `react-hook-form` + `zod` en formularios.

---

## Out of scope

- Vacaciones en **Perfil de Empleado** RRHH (`PayrollEmployeeProfileScreen` / OS-535) — **prohibido** en esta task.
- Creación/edición administrativa de empleados.
- Registrar entregas de dotación desde Mi perfil (solo consulta).
- Notificaciones push/email.
- Firma electrónica en UI.
- Cambios en `packages/ui` (solo consumir componentes existentes).

---

## Files allowed

- `apps/web-app/src/features/my-profile/**` — create
- `apps/web-app/src/pages/MyProfilePage/**` — create
- `apps/web-app/src/features/payroll/screens/VacationApprovalsScreen.tsx` — create
- `apps/web-app/src/features/payroll/components/Vacation*.tsx` — create (solo aprobación)
- `apps/web-app/src/features/payroll/hooks/useVacationApprovals.ts` — create
- `apps/web-app/src/pages/PayrollPage/**` — modify (sub-ruta vacaciones)
- `apps/web-app/src/App.tsx` — modify (ruta mi-perfil)
- `apps/web-app/src/constants/navigation.ts` — modify
- `apps/web-app/src/config/rbac.config.ts` — modify (acceso mi-perfil)

---

## Files forbidden

- `apps/web-app/src/features/payroll/screens/PayrollEmployeeProfileScreen.tsx` — **no modificar** (sin tab Vacaciones)
- `prisma/schema.prisma`
- `apps/api/**` (salvo consumir API de task 08)
- `package.json` / `pnpm-lock.yaml`
- `packages/**` (salvo uso de componentes existentes sin modificar)

---

## Acceptance criteria

- [ ] **Mi perfil** accesible en `/mi-perfil` con tabs ordenados: Personal, Vacaciones, Dotación.
- [ ] Empleado ve saldo (acumulado / disfrutado / compensado / disponible) en tab Vacaciones de **Mi perfil**.
- [ ] Empleado puede crear solicitud desde Mi perfil; historial en `EmpleadoTable`.
- [ ] Tab Dotación muestra entregas propias (solo lectura) con misma estructura visual.
- [ ] Filtros y botones **fuera** de tablas; controles `size="md"`.
- [ ] **No** hay sección de vacaciones en Perfil de Empleado RRHH.
- [ ] Supervisor aprueba/rechaza L1; RRHH aprueba/rechaza L2 en `/payroll/vacations` (PC-2).
- [ ] Calendario por sede en bandeja de aprobación.
- [ ] Descarga de carta PDF en solicitudes terminales.
- [ ] Loading, error y empty states en todas las vistas async.
- [ ] Tests: formulario solicitud, tabla aprobación, tab vacaciones Mi perfil.

---

## Validation commands

```bash
pnpm --filter=web-app test -- Vacation
pnpm --filter=web-app test -- MyProfile
pnpm --filter=web-app typecheck
```
