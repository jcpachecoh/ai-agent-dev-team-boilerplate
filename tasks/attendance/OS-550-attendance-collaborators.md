# OS-550 — Listado de Colaboradores de Asistencia (búsqueda, filtros, scoping de sede y paginación real)

**Domain:** `[BACKEND]` `[FRONTEND]` `[RBAC]` `[AUDIT]` `[EMAIL]`
**Status:** `implemented` (incluye follow-up: Portal trabajador, exportaciones, historial mínimo)
**Rutas REST:** `GET /api/attendance/collaborators`, `GET /api/attendance/collaborators/supervisors`, `PATCH /api/attendance/collaborators/:employeeDetailsId/portal`, `GET /api/attendance/collaborators/export`, `POST /api/attendance/collaborators/export/email`, `GET /api/attendance/collaborators/:employeeDetailsId/audit`
**Ruta frontend:** `/asistencia/colaboradores`
**Depends on:** OS-582 (convención `ASSIGNED/REST/BASE` de `TurnoAssignment`, reutilizada tal cual para `todayShift`), `UserLocation` (scoping de sede ya usado por OS-582/583), `EmailService` (`packages/email`, adjuntos ya soportados de punta a punta)
**Precede a:** Portal real de autoservicio del trabajador, módulo avanzado de auditoría (ver "Fuera de alcance" del follow-up)

---

## Alcance

`AttendanceCollaboratorsScreen` (`/asistencia/colaboradores`) traía **todos** los empleados del tenant vía el endpoint de Nómina (`listAllPayrollEmployees`, paginado internamente 100 a la vez) y hacía búsqueda, filtros, orden y paginación **100% en el navegador** — sin scoping real de sede en backend (solo restringía el dropdown de sede en el cliente).

Esta implementación:

- Crea un endpoint específico (`GET /attendance/collaborators`) — **no se tocó** `payroll/resolver/employees.resolver.ts` ni `PayrollEmployeesListScreen` (fuera de alcance, para no arriesgar Nómina).
- Búsqueda case+accent insensitive real en backend (nombre, apellidos, documento, email).
- Filtros reales en backend: Especialidad (`positionId`), Contrato, Área, Sede, Supervisor, Clasificación laboral.
- Scoping de sede real en backend (no solo cliente): OWNER/SUPER_ADMIN/NOMINA ven todo el tenant; SUPERVISOR/MANAGER quedan acotados a sus sedes vía `UserLocation`.
- Paginación real con total/activeTotal/inactiveTotal respetando todos los filtros (no solo la página actual).
- Columnas nuevas: Primer apellido, Segundo apellido, Supervisor, Turno (asignación de hoy), Portal trabajador (placeholder).
- Acción "ver tarjeta de asistencia" por fila (antes no existía navegación desde el listado a `AttendanceCardScreen`).
- Botón "Limpiar filtros" y selector de tamaño de página (20/50/100).

### Fuera de alcance de esta primera fase (resuelto en el follow-up más abajo)

- ~~Portal trabajador real~~ → implementado como **flag administrativo** (no autoservicio) en el follow-up.
- ~~Exportaciones Excel/PDF/email~~ → implementadas en el follow-up.
- ~~Historial de auditoría visible~~ → implementado como **historial mínimo** en el follow-up.
- **Supervisor como relación directa**: se mantiene la decisión de producto de no crear `EmployeeDetails.supervisorId` — "Supervisor" se deriva de usuarios con rol SUPERVISOR/MANAGER asignados a la sede del colaborador vía `UserLocation` (sin cambios en el follow-up).

---

## Decisión: nuevo endpoint en `attendance`, no extender `payroll`

`payroll/resolver/employees.resolver.ts` es GraphQL, offset-based, sin scoping de sede, y lo usa `PayrollEmployeesListScreen` (tenant-wide, para Nómina). Extenderlo con scoping por sede habría cambiado su comportamiento para un consumidor fuera de alcance. Se creó en su lugar `AttendanceCollaboratorsRepository`/`Service`/`Controller` dentro del módulo `attendance` ya existente (mismo patrón REST que OS-551/553).

## Decisión: `todayShift` reutiliza la convención `ASSIGNED/REST/BASE` de OS-582

En vez de inventar un shape nuevo, `todayShift: { type: 'ASSIGNED'|'REST'|'BASE', turno: {...} | null }` reutiliza exactamente la convención ya probada en `turno-assignment-response.dto.ts`/`TurnoAssignmentsService.buildCell`. `BASE` significa "no hay fila `TurnoAssignment` para hoy" (fallback calculado, no persistido). El frontend muestra `"{sigla} {horaInicio}-{horaFin}"` si `ASSIGNED`, `"Descanso"` si `REST`, `"Turno Base"` si `BASE`.

## Decisión: scoping de sede + filtro Supervisor

- `resolveScope(tenantId, actor)` en `AttendanceCollaboratorsService` es una copia del patrón ya establecido en `TurnoAssignmentsService.resolveScope` — `null` para OWNER/SUPER_ADMIN/NOMINA (sin restricción), array de `locationId` para SUPERVISOR/MANAGER (vía `UserLocationsService.getActiveUserLocations`, sin cambios).
- El filtro `supervisorUserId` valida que el usuario objetivo tenga rol SUPERVISOR/MANAGER en el tenant (`BadRequestException` si no), resuelve sus sedes asignadas, y **intersecta** con el scope del caller autenticado — una intersección vacía se pasa como array vacío a Prisma (`locationId: { in: [] }`), lo que devuelve 0 filas de forma natural (nunca se "ignora" el filtro).

## Decisión: búsqueda case+accent insensitive sin extensión de Postgres

No hay `unaccent`/`citext`/`pg_trgm` habilitada en las migraciones existentes. En vez de agregar una extensión nueva (riesgo de infraestructura, permisos variables según el hosting), `AttendanceCollaboratorsRepository.findMatchingIdsBySearch` usa una query `$queryRaw` parametrizada (`Prisma.sql`, nunca interpolación de strings) con la función **nativa** de Postgres `translate()` para normalizar tildes comunes del español antes de comparar con `LIKE`. Los ids resultantes se pasan como `id: { in: [...] }` a la query principal de Prisma, que sigue aplicando el resto de filtros normalmente.

## Decisión: clasificación laboral se movió a backend

El filtro de clasificación laboral (COCINA/SERVICIO/ADMINISTRATIVO) ya existía en pantalla como un store global (`attendance-labor-filter.store.ts`, compartido con `AttendanceMonitorScreen`/`AttendanceLocationDetailScreen`, sin tocar). Antes se aplicaba **client-side** sobre la lista completa; con paginación real del servidor eso rompería el total/paginación mostrados. Ahora viaja como query param `laborClassification` (`administrativo` → `EmployeeDetails.laborClassification = ADMINISTRATIVO`; `operaciones` → `IN (COCINA, SERVICIO)`), usando el campo real de Prisma en vez de la heurística basada en `area`/`department` de `utils/labor-classification.ts` (esa heurística se mantiene intacta y sigue siendo usada, sin cambios, por `AttendanceMonitorScreen`/`AttendanceLocationDetailScreen` vía `useLaborClassificationLookup`, que ahora obtiene su propia lista completa directamente de `listAllPayrollEmployees` en vez de depender del hook que se reemplazó en este ticket).

## Decisión: `pageSize` inválido devuelve 400, nunca normaliza

`ListAttendanceCollaboratorsQueryDto.pageSize` usa `@IsIn(ATTENDANCE_COLLABORATORS_PAGE_SIZES)` (`[20, 50, 100]`). El `ValidationPipe` global (`whitelist: true, forbidNonWhitelisted: true`, ya configurado en `main.ts`) rechaza automáticamente cualquier valor fuera del set con 400 — no hay normalización silenciosa a un valor permitido.

## Decisión: ordenamiento por columna se preserva (ya no es client-side)

El listado anterior tenía columnas sorteables (Empleado/Cargo/Ingreso) aplicadas en memoria sobre la lista completa. Con paginación real del servidor, ordenar solo la página visible sería incorrecto/engañoso. Se agregó `sortBy`/`sortDir` a la query pública, mapeado en el repositorio a `orderBy: { name | position | hireDate }` (default `createdAt: 'desc'` si no se especifica), preservando exactamente el mismo affordance de UI que ya existía (`toggleEmpleadoSort` de `@restopsiq/ui`).

## Decisión: métricas de resumen (Total/Activos/Inactivos) son agregados reales, no de la página actual

La pantalla anterior calculaba estas 3 métricas sobre la lista completa filtrada en memoria. Con paginación real, `items` solo contiene la página actual — se agregó `summary: { total, active, inactive }` a la respuesta (2 counts adicionales con el mismo `where` que la página, forzando `isActive: true`/`false`), calculados en paralelo (`Promise.all`) junto al `total`/`rows` ya existentes.

---

## Backend

Todo nuevo bajo el módulo ya existente `apps/api/src/attendance/` (sin migración de Prisma — todos los campos ya existían):

- `attendance-collaborators.constants.ts` — roles con scoping de sede/supervisor, page sizes permitidos.
- `interfaces/attendance-collaborators.interfaces.ts` — reutiliza `ActorContext`/`AssignmentCellType`/`AssignmentTurnoSummary` de `turnos/interfaces/turno-assignments.interfaces.ts` en vez de duplicar tipos.
- `repository/attendance-collaborators.repository.ts`:
  - `findPage()` — filtros estructurados + búsqueda vía `$queryRaw`, `count()` en paralelo (total/activeTotal/inactiveTotal), `orderBy` mapeado desde `sortBy`/`sortDir`.
  - `findSupervisorsForLocations()` — una query batched (`UserLocation` + `Role.code IN (SUPERVISOR, MANAGER)`) para todas las sedes de la página, agrupada en memoria — evita N+1.
  - `findTodayAssignments()` — una query batched a `TurnoAssignment` para todos los `employeeId` de la página en la fecha de hoy (Bogotá, vía `normalizeWorkDate` reutilizado de `attendance.repository.ts`).
  - `findSupervisorUser()` / `findSupervisorOptions()` — validación y catálogo para el filtro Supervisor.
- `service/attendance-collaborators.service.ts` — `resolveScope`, intersección de scope con `supervisorUserId`, orquestación de las 3 queries batched, cálculo de `pagination`/`summary`.
- `controller/dto/list-attendance-collaborators-query.dto.ts` + `attendance-collaborator-response.dto.ts`.
- `attendance.module.ts` — importa `LocationsModule` (para `UserLocationsService`), registra el nuevo repository/service.
- `attendance.controller.ts` — nueva sección `GET /attendance/collaborators` y `GET /attendance/collaborators/supervisors`, ambos con `@Roles(...PAYROLL_MODULE_ROLES)` (solo lectura).

`GET /attendance/collaborators/supervisors` **no reutiliza** `/admin/users`: ese endpoint exige el permiso `admin.users.read` (RBAC granular, típicamente solo OWNER/SUPER_ADMIN), que rompería el filtro para SUPERVISOR/MANAGER/NOMINA.

---

## Frontend

Todo dentro de `apps/web-app/src/features/attendance/`:

- **Nuevo**: `hooks/useAttendanceCollaboratorsQuery.ts`, `hooks/useAttendanceCollaboratorSupervisorsQuery.ts`.
- **Reemplazado**: `hooks/useAttendanceCollaboratorsEmployeesQuery.ts` (eliminado) → `useAttendanceCollaboratorsQuery.ts` server-paginado.
- **Reescrito**: `hooks/useAttendanceCollaboratorsFilters.ts` — agrega `positionId`, `supervisorUserId`, `setPageSize` (`ATTENDANCE_COLLABORATORS_PAGE_SIZE_OPTIONS = [20, 50, 100]`), `resetFilters`. La clasificación laboral **no** vive aquí — sigue en el store global compartido, combinada en el sitio de uso vía `buildQueryFilters(laborFilter)`.
- **Reescrito**: `screens/AttendanceCollaboratorsScreen.tsx` — elimina la cadena client-side de filtro/orden/paginado. El flujo de creación/edición/desactivación (`PayrollEmployeeCreateModal`/`EditDrawer`/`DeactivateDialog`) se mantiene intacto: como esos componentes requieren el objeto `PayrollEmployee` completo (salario, EPS, ARL, etc. — no presente en la proyección liviana de colaboradores), al hacer clic en "Editar"/"Activar-Desactivar" se resuelve el empleado completo bajo demanda vía `usePayrollEmployeeQuery(userId)` (hook ya existente, reutilizado sin cambios) antes de abrir el drawer/diálogo — mismo patrón que ya usaba `PayrollEmployeeWizard` (`if (!open || (isEditMode && !employee)) return null`).
- **Arreglado**: `hooks/useLaborClassificationLookup.ts` dependía del hook eliminado; ahora llama directamente a `listAllPayrollEmployees` (sin pasar por el wrapper de colaboradores) — sigue siendo consumido sin cambios por `AttendanceMonitorScreen`/`AttendanceLocationDetailScreen`, fuera de alcance de este ticket.
- **`packages/ui` — extendido, no forkeado** (compartido con `PayrollEmployeesListScreen`):
  - `empleado-columns.ts`: nuevo parámetro `showAttendanceColumns` en `getEmpleadoColumns`/`getEmpleadoGridTemplate`/`buildEmpleadoHeaderColumns`/`getEmpleadoTableMinWidthPx`, default `false` (sin cambios para Payroll). Inserta `primerApellido`/`segundoApellido` justo después de `cedula`, y `supervisor`/`turno`/`portalTrabajador` justo antes de `actions` — el orden debe coincidir exactamente con las celdas del grid CSS.
  - `EmpleadoTable.tsx`, `EmpleadoTableRow.tsx`, `EmpleadoTableCard.tsx`: nuevo prop `showAttendanceColumns` + props de datos opcionales (`primerApellido`, `segundoApellido`, `supervisorsLabel`, `turnoLabel`, `portalTrabajadorLabel`) y `viewLabel` (override del aria-label del botón "ver", usado para "Ver tarjeta de asistencia").

---

## Riesgos

- **Costo de 3 `count()` por página** (`total`, `activeTotal`, `inactiveTotal`) en `findPage` — aceptable para el volumen esperado por tenant, pero si el listado crece mucho valdría la pena revisar si conviene cachear o simplificar el resumen.
- **Búsqueda `translate()` cubre tildes comunes del español**, no una normalización Unicode completa (no cubre todos los diacríticos posibles de otros idiomas) — suficiente para el caso de uso actual (nombres en español).
- **`todayShift` siempre calculado para "hoy"** — no hay forma de ver el turno de otro día desde este listado (por diseño, ver decisión de producto).
- **Portal trabajador y exportaciones son puramente visuales/placeholder** — cualquier expectativa de funcionalidad real ahí debe ir a un ticket nuevo.

## Tests

- Backend: `test/attendance-collaborators.repository.spec.ts`, `test/attendance-collaborators.service.spec.ts` (nuevos — scoping por rol, intersección de supervisor, búsqueda, filtros, ordenamiento, `todayShift` en sus 3 ramas, `summary` agregado). `test/attendance.controller.spec.ts` extendido con las 2 rutas nuevas.
- Frontend: `screens/AttendanceCollaboratorsScreen.test.tsx` (nuevo) — columnas nuevas, estados de `todayShift`, empty state, navegación "ver tarjeta", "Limpiar filtros", cambio de page size.

## Postman

Carpeta `OS-550 Attendance Collaborators` agregada a `postman/restopsiq-api.collection.json`: list sin filtros, búsqueda con tildes, cada filtro individual, `pageSize` 50/100, `pageSize` inválido → 400, `supervisorUserId` inválido → 400, catálogo de supervisores.

---

# OS-550 follow-up — Portal trabajador, exportaciones e historial mínimo

**Status:** `implemented`

## Alcance

Cierra los tres pendientes documentados arriba:

1. **Portal trabajador** como flag administrativo (`EmployeeDetails.portalWorkerEnabled`, no autoservicio real).
2. **Exportaciones Excel/PDF** del listado filtrado completo (no solo la página actual) + **envío por correo** con el archivo adjunto.
3. **Historial mínimo de auditoría** por colaborador, visible solo para OWNER/SUPER_ADMIN.

### Fuera de alcance (documentado explícitamente, no implementado)

- **Portal real de autoservicio/login del trabajador** — el flag es únicamente administrativo; no habilita ningún acceso real de la persona colaboradora a un portal.
- **Módulo avanzado de auditoría** — no hay filtros de fecha/acción/actor, ni paginación del historial, ni exportación de auditoría. Solo los últimos 50 registros de la entidad, sin filtros.
- **Filtros complejos sobre el historial de auditoría** — mismo punto anterior.
- **Rediseño del listado de colaboradores** más allá de lo descrito aquí (columnas/toolbar existentes se extendieron, no se rediseñaron).

## Decisión: migración escrita a mano (Postgres local sin sesión interactiva)

`pnpm prisma migrate dev` requiere una sesión interactiva no disponible en este entorno de agente. Se escribió la migración `20260706150000_os550_portal_worker_enabled` a mano (solo `ALTER TABLE employee_details ADD COLUMN portalWorkerEnabled BOOLEAN NOT NULL DEFAULT false`) y se aplicó con `prisma migrate deploy` (no interactivo) contra el Postgres local ya corriendo — sin el drift preexistente que afectó a OS-551, esta migración se aplicó limpia.

## Decisión: exportación reutiliza `AttendanceCollaboratorsService.list()`, no un método paralelo

`exportFile()`/`emailExport()` llaman internamente a `list()` con los mismos filtros de la query pública pero `page: 1, pageSize: ATTENDANCE_COLLABORATORS_EXPORT_MAX_ROWS` (5000) — la misma lógica de scoping de sede, búsqueda, intersección de supervisor y enriquecimiento (`supervisors`/`todayShift`/`portalWorkerEnabled`) se ejecuta una sola vez, evitando cualquier divergencia entre lo que ve el listado y lo que se exporta. Si el resultado viene vacío, `BadRequestException` (400) antes de generar cualquier archivo. El cap de 5000 trunca silenciosamente si se excede — no hay AC que pida error explícito por exceso de filas, solo por cero.

## Decisión: formateo de columnas se calcula una sola vez

`AttendanceCollaboratorsService` mapea `AttendanceCollaboratorItem[]` → `CollaboratorExportRow[]` (con `supervisorsLabel`/`turnoLabel`/`portalLabel` ya como strings, reutilizando la misma lógica de formateo que ya existía) **antes** de pasarlo a `AttendanceCollaboratorsExcelService`/`PdfService` — ninguno de los dos generadores duplica lógica de formateo.

## Decisión: `EmailService` ya soportaba adjuntos, no se extendió

`packages/email/src/types.ts` (`SendEmailOptions.attachments: EmailAttachment[]`) y el pipeline completo (`EmailService.send()` → BullMQ → `EmailWorker` → `ResendClient.sendEmail()`) ya pasaban `attachments` de punta a punta. Solo se agregó un nuevo caso `'collaborators-export'` al discriminated union `EmailTemplate` (`packages/email/src/types.ts`) + su render inline en `template-registry.tsx` (mismo patrón que el caso `stock-alert` ya existente — sin archivo `.tsx` de plantilla dedicado, porque el patrón inline ya cubre casos simples como este). **`packages/email` requiere `pnpm build` (tsup) para que sus tipos/dist se reflejen en `apps/api`** — a diferencia de `packages/ui`, que apunta directo a `src/`.

## Decisión: auditoría de lectura es un método genérico nuevo, no un módulo

`AuditRepository`/`AuditService` eran solo de escritura. Se agregó `findByEntity`/`findRecentByEntity` (genérico, reutilizable por cualquier `entityType` futuro) en vez de construir un módulo de auditoría completo. La ruta de lectura vive en `attendance.controller.ts` bajo `/attendance/collaborators/:employeeDetailsId/audit` (no bajo `/audit`, que sigue sin rutas) porque el AC pide específicamente el historial del colaborador, no un endpoint de auditoría genérico.

## Decisión RBAC

- `PATCH .../portal` y `GET .../audit` → `@Roles(...SYSTEM_ADMIN_ROLES)` (solo OWNER/SUPER_ADMIN, 403 para el resto vía `RolesGuard`).
- `GET .../export` y `POST .../export/email` → `@Roles(...PAYROLL_MODULE_ROLES)` (mismo acceso que el listado), reutilizando el mismo scoping de sede que ya aplica `list()` — un SUPERVISOR/MANAGER solo puede exportar/enviar por correo colaboradores de sus propias sedes.

## Decisión: AuditLog en export por correo guarda destinatarios y formato, no el archivo

`payload: { recipients, format, rowCount }` — el AC pide explícitamente registrar "destinatarios y formato"; "sin datos sensibles innecesarios" se interpretó como no persistir el buffer/adjunto en el log, no como omitir los emails.

---

## Backend

Sin migración adicional más allá del campo `portalWorkerEnabled` (ver arriba). Todo nuevo dentro de `apps/api/src/attendance/` salvo el método genérico de auditoría:

- `attendance-collaborators.constants.ts` — `ATTENDANCE_COLLABORATORS_EXPORT_MAX_ROWS` (5000), `ATTENDANCE_COLLABORATORS_EXPORT_MAX_RECIPIENTS` (10), mensajes de error.
- `interfaces/attendance-collaborators.interfaces.ts` — `portalWorkerEnabled` pasa de `null` fijo a `boolean` real en `CollaboratorRecord`/`AttendanceCollaboratorItem`; nuevos tipos `CollaboratorExportRow`, `CollaboratorExportFormat`, `AuditHistoryEntry`.
- `repository/attendance-collaborators.repository.ts` — `portalWorkerEnabled` agregado al `select`/mapeo de `findPage`; nuevos `findEmployeeForPortalToggle`/`updatePortalWorkerEnabled`.
- `service/attendance-collaborators.service.ts` — nuevos `setPortalWorkerEnabled` (404 si no existe en tenant, `AuditLog` con `oldValue`/`newValue`), `buildExportRows`/`exportFile`/`emailExport` (reutilizan `list()`), `getAuditHistory` (valida existencia, delega a `AuditService.findRecentByEntity`).
- `service/attendance-collaborators-excel.service.ts` (nuevo) — mismo patrón exceljs que `reports/service/report-excel.service.ts`: columnas Documento/Primer apellido/Segundo apellido/Nombre/Especialidad/Área/Supervisor/Contrato/Turno/Portal trabajador.
- `service/attendance-collaborators-pdf.service.ts` (nuevo) — mismo patrón pdfkit (chunks vía eventos, tabla dibujada manualmente, paginación) que `reports/service/report-pdf.service.ts`, adaptado a las columnas de colaboradores.
- `audit/repository/audit.repository.ts` + `audit/service/audit.service.ts` — nuevo `findByEntity`/`findRecentByEntity` (`include: { actor: { select: { email, employeeDetails: { name } } } }`, `orderBy: createdAt desc`, `take` configurable, default 50). `actorName` cae a `email` si el actor no tiene `EmployeeDetails.name` (mismo fallback que "Supervisor" en la fase anterior).
- DTOs nuevos: `patch-portal-worker.dto.ts`, `export-collaborators-query.dto.ts` (reutiliza `ListAttendanceCollaboratorsQueryDto` vía `OmitType` para no duplicar validadores), `email-export-collaborators.dto.ts` (`recipients` con `@IsEmail({}, {each:true})`/`@ArrayMaxSize(10)`, `filters` anidado con `@ValidateNested`/`@Type`), `attendance-collaborator-audit-response.dto.ts`.
- `attendance.controller.ts` — 4 rutas nuevas bajo `// ── OS-550 follow-up ──`; `GET .../export` usa el mismo patrón `@Res() res: Response` + `Content-Type`/`Content-Disposition` que `ReportsController.exportPayrollReport`.
- `attendance.module.ts` — importa `EmailModule`, registra los 2 nuevos servicios de export.

## Frontend

- `types/attendance.types.ts` — `AttendanceCollaborator.portalWorkerEnabled` pasa de `null` a `boolean` real; nuevos tipos `AttendanceCollaboratorExportFormat`, `AttendanceCollaboratorEmailExportInput`, `AttendanceCollaboratorAuditEntry`.
- `api/attendance.client.ts` — nuevo `attendanceFetchBlob` (mismo patrón que `payrollFetchBlob`), `patchAttendanceCollaboratorPortal`, `exportAttendanceCollaborators`, `emailAttendanceCollaboratorsExport`, `getAttendanceCollaboratorAudit`.
- `hooks/useAttendanceCollaboratorMutations.ts` (nuevo) — `useTogglePortalWorkerMutation` (invalida `[...attendanceKeys.all, 'collaborators']`), `useExportAttendanceCollaboratorsMutation`, `useEmailAttendanceCollaboratorsExportMutation`.
- `hooks/useAttendanceCollaboratorAuditQuery.ts` (nuevo).
- **`packages/ui` — extendido de nuevo, de forma aditiva**:
  - `EmpleadoTableRowProps`/`CardProps`: `portalTrabajadorLabel?: string` reemplazado por `portalWorker?: { checked, disabled?, loading?, onChange? }` — renderiza un `Switch` real (`@restopsiq/ui`); si se omite, cae al texto "Pendiente" (compatibilidad hacia atrás).
  - `EmpleadoRowActionButton`: nuevo variant `'history'` (ícono `History` de lucide-react) + nuevo prop `onHistory`/acción "Historial" en `EmpleadoTableRow`/`Card`, mismo patrón aditivo que `onView`.
- `screens/AttendanceCollaboratorsScreen.tsx`:
  - Portal trabajador: `Switch` conectado a `useTogglePortalWorkerMutation`, deshabilitado si `!isSystemAdmin` (`SYSTEM_ADMIN_ROLES` de `@/config/rbac.config`), loading solo en la fila que se está actualizando.
  - Botones "Exportar Excel"/"Exportar PDF" en el toolbar → `downloadBlob` (reutilizado de `features/attendance/api/turnos.api.ts`, mismo patrón que `TurnosListScreen`).
  - Modal "Enviar por correo" (`Modal` + `RolTextarea` + `RecetaFilterSelect` de `@restopsiq/ui`) — destinatarios separados por coma/salto de línea, validados client-side (regex + máx. 10) antes de habilitar "Enviar"; usa los `queryFilters` activos del listado, sin UI de filtros propia en el modal.
  - Acción "Historial" por fila (solo `isSystemAdmin`) → modal simple con lista plana (fecha, actor, acción, valores anterior/nuevo formateados con `formatAuditValue`, sin `ResponsiveTableCard` ni filtros).

## Riesgos

- **`packages/email` requiere rebuild (`pnpm build`) tras cambios de tipos** — a diferencia de `packages/ui`. Si un desarrollador edita `packages/email/src/types.ts` sin reconstruir, `apps/api` seguirá viendo los tipos viejos vía `dist/`.
- **Cap de exportación de 5000 filas trunca silenciosamente** — si un tenant supera ese volumen, la exportación no lo indica explícitamente (no había AC para ese caso).
- **Historial de auditoría sin paginación** — últimos 50 registros fijos; si un colaborador acumula más cambios que eso, los más antiguos no son visibles desde esta UI (por diseño, "no construir módulo avanzado").
- **Formato de "Anterior/Nuevo" en el historial es básico** (`key: value` concatenado) — legible pero no especializado por tipo de cambio.

## Tests

- Backend: `test/attendance-collaborators.service.spec.ts` extendido (`setPortalWorkerEnabled`, `getAuditHistory`, `exportFile`, `emailExport` — éxito, 404, 400 sin datos, scoping de sede reutilizado); `test/attendance-collaborators.repository.spec.ts` extendido (`findEmployeeForPortalToggle`, `updatePortalWorkerEnabled`); `test/attendance-collaborators-excel.service.spec.ts` y `test/attendance-collaborators-pdf.service.spec.ts` (nuevos, generación real de buffers válidos); `audit/test/audit.repository.spec.ts` y `audit/test/audit.service.spec.ts` extendidos (`findByEntity`/`findRecentByEntity`); `test/attendance.controller.spec.ts` extendido con las 4 rutas nuevas.
- Frontend: `screens/AttendanceCollaboratorsScreen.test.tsx` extendido — toggle de portal visible/deshabilitado según rol, exportación Excel/PDF llama al endpoint con los filtros activos y descarga el blob, modal de email valida destinatarios antes de habilitar el envío, modal de historial carga/muestra registros y el mensaje vacío, botón de historial oculto para roles no superusuario.

## Postman

Carpeta `OS-550 Attendance Collaborators` extendida: PATCH portal (true/false + rol no autorizado), GET export excel/pdf (con filtros, sin datos → 400), POST export/email (válido, email inválido → 400, >10 destinatarios → 400), GET audit (rol no autorizado, tenant isolation → 404).
