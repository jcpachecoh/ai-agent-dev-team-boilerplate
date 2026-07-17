# OS-548 — Control Panel: small fixes

**Estado:** Implementado — en revisión
**Módulo:** `attendance` (control-panel)
**Ticket Jira:** OS-548 (subtareas puntuales detectadas en auditoría previa)
**Depende de:** OS-578 (mapeo de `clasificacion` ADMINISTRATIVO / COCINA+SERVICIO)
**Fecha:** 2026-07-02

---

## Objetivo

Cerrar 3 gaps puntuales detectados en la auditoría de cobertura de OS-548 sobre el dashboard
`GET /api/attendance/control-panel`, sin tocar el cálculo principal de asistencia ni construir
funcionaliddad fuera de alcance (mapa, geocerca visual, historial de ubicaciones).

---

## Fixes incluidos

### 1. Selector de `pageSize` (20/50/100)

El backend (`ControlPanelQueryDto`) ya validaba `pageSize` en `[20, 50, 100]` desde la
implementación original de OS-548; el gap era puramente de frontend, que enviaba `pageSize: 20`
hardcodeado.

- `AttendanceDashboardScreen.tsx`: nuevo estado `pageSize` (default `20`) y selector
  `RecetaFilterSelect` junto a la paginación (`Filas por página`).
- Cambiar `pageSize` resetea `page` a `1`.
- Sin cambios de contrato en el backend.

### 2. Filtro `clasificacion` en el Control Panel

OS-578 ya había implementado el filtro `clasificacion` (`administrativo` / `operaciones` / `todos`)
para el endpoint `GET /attendance/locations/:id/monitor-summary`, pero no llegaba al dashboard
`control-panel` (endpoint distinto, mismo dataset de `AttendanceLog` + `MobileAttendanceLog`).

- Se extrajo el mapeo `resolveClasificacionFilter` (antes función privada dentro de
  `attendance-monitor-summary.service.ts`) a un util compartido:
  `apps/api/src/attendance/utils/clasificacion.util.ts`.
  - `administrativo` → `[LaborClassification.ADMINISTRATIVO]`
  - `operaciones` → `[LaborClassification.COCINA, LaborClassification.SERVICIO]`
  - `todos` / omitido → `undefined` (sin filtro)
- `attendance-monitor-summary.service.ts` ahora importa el util compartido (mismo comportamiento,
  cero cambios de contrato en `monitor-summary`).
- `ControlPanelQueryDto` y la interfaz `ControlPanelQuery` ganan el campo opcional `clasificacion`
  con la misma validación (`IsEnum(['administrativo', 'operaciones', 'todos'])`).
- `AttendanceRepository.listControlPanelLogs` / `listMobileLogsForDay` / `listMobileLogsForRange`
  ganan un parámetro opcional `laborClassifications` que agrega
  `where: { employee: { laborClassification: { in: [...] } } }` cuando está presente.
- `AttendanceControlPanelService.getControlPanel` resuelve el filtro una sola vez y lo reenvía a
  **todas** las consultas de logs (día, línea de tiempo, mes, mobile logs) — como todos los KPIs,
  la tabla y las alertas se derivan de esos mismos arrays de logs, el filtro los afecta de forma
  consistente sin duplicar lógica de negocio.
- **No se creó ningún endpoint nuevo** para esto: se reutilizó `GET /attendance/control-panel`
  agregando el query param `clasificacion`.
- El response (`ControlPanelSummaryDto`) devuelve `clasificacion` como eco del filtro aplicado
  (mismo patrón que `monitor-summary`), útil para que el frontend sincronice estado tras refresh.
- Frontend: nuevo `RecetaFilterSelect` "Clasificación" en la sección de filtros (valores UI:
  Todas las clasificaciones / Administrativo / Operaciones), estado default `'todos'`.

### 3. Descarte de alertas persistido (`AlertDismissal`)

Antes, el descarte de alertas vivía solo en `localStorage` del navegador
(`restopsiq.attendance.dismissedAlerts`): no sobrevivía a cambio de dispositivo/navegador y no
distinguía entre usuarios de un mismo tenant.

- **Modelo nuevo** `AlertDismissal` (migración `20260702180000_os548_alert_dismissal`):

  ```prisma
  model AlertDismissal {
    id          String   @id @default(cuid())
    tenantId    String
    userId      String
    alertKey    String
    dismissedAt DateTime @default(now())
    createdAt   DateTime @default(now())

    @@unique([tenantId, userId, alertKey])
    @@index([tenantId, userId])
    @@map("attendance_alert_dismissals")
  }
  ```

  Sin FK Prisma hacia `User`/`Tenant` — mismo patrón que `MobileAttendanceLog.storageObjectId`
  (referencia lógica sin constraint de integridad, para no acoplar el modelo ni tocar `User`).

- `alertKey` reutiliza el `id` que ya generan las alertas del control-panel (`geo-<mobileLogId>`,
  `no-geo-<attendanceLogId>`) — no se inventó un concepto nuevo de clave.
- **Endpoint nuevo** (el único de este ticket, explícitamente pedido):
  `POST /attendance/control-panel/alerts/dismiss` — body `{ alertKey: string }`.
  Mismo guard que el resto del módulo (`RolesGuard` + `PAYROLL_MODULE_ROLES`); el `userId` se toma
  del JWT (`user.sub`), nunca del body.
- `AttendanceRepository.dismissAlert(tenantId, userId, alertKey)`: `upsert` por la clave compuesta
  `tenantId_userId_alertKey` (idempotente — descartar dos veces la misma alerta no falla).
- `AttendanceRepository.listDismissedAlertKeys(tenantId, userId)`: `Set<string>` de claves
  descartadas por ese usuario en ese tenant.
- `getControlPanel` ahora requiere `userId` (segundo parámetro, antes solo `tenantId` + `query`):
  filtra `alerts` contra `listDismissedAlertKeys(tenantId, userId)` antes de responder. El filtrado
  es **por usuario**, no por tenant completo — una alerta descartada por un supervisor sigue
  visible para otro usuario del mismo tenant.
- Frontend: se eliminaron `getDismissedAlertIds` / `dismissAlertId` / `clearDismissedAlerts` de
  `attendance-storage.ts` (localStorage) y se reemplazaron por `dismissAttendanceAlert(alertKey)`
  en `attendance.client.ts`, que llama al endpoint nuevo. El componente mantiene un
  `Set<string>` en memoria (`dismissingAlertIds`) solo para ocultar la alerta al instante mientras
  el POST + refetch confirman el cambio — no se persiste nada en el navegador; el backend es la
  única fuente de verdad.

---

## Fuera de alcance (explícitamente no implementado)

- Mapa embebido, visualización de geocerca, historial de ubicaciones (backend de geolocalización
  de OS-499/OS-505 no se tocó).
- Hardcodear "Inversiones Llanes S.A.S." en ningún KPI — el tercer indicador sigue usando
  `tenantName` dinámico (comportamiento ya correcto, confirmado en la auditoría).
- Cambios al cálculo de `workingNow` / `attendanceToday` / `overtimeHoursMonth` más allá de aplicar
  el filtro de clasificación sobre los mismos logs ya consultados.
- Refactors de componentes de UI no relacionados (tabla, gráfico comparativo, responsive).

---

## Decisiones técnicas

| Decisión                                                                                              | Razón                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resolveClasificacionFilter` se movió a un util compartido en vez de duplicarlo                       | Evita que OS-548 y OS-578 diverjan si el mapeo cambia (ej. se agrega una tercera categoría)                                                                             |
| El filtro de clasificación se aplica en la capa de repositorio (`where.employee.laborClassification`) | Reutiliza el índice `@@index([tenantId, laborClassification])` de `EmployeeDetails`; no requiere post-filtrado en memoria                                               |
| `AlertDismissal` sin FK Prisma                                                                        | Mismo patrón ya aceptado en el codebase (`MobileAttendanceLog.storageObjectId`); evita tocar `User`/`Tenant` para un caso de uso de bajo riesgo                         |
| Descarte por `(tenantId, userId, alertKey)` en vez de solo `(tenantId, alertKey)`                     | El ticket pide explícitamente que la alerta no reaparezca "para el mismo usuario" pero sí para otros — descartar a nivel de tenant ocultaría la alerta a todo el equipo |
| `getControlPanel` gana un parámetro `userId` en vez de leerlo de un contexto implícito                | Mantiene el servicio testeable con mocks simples (mismo patrón que el resto de servicios del módulo, que reciben `tenantId` explícito)                                  |
| `dismissingAlertIds` en frontend es solo optimista (memoria, no `localStorage`)                       | El backend ya es la fuente de verdad tras el primer refetch; persistir en el navegador sería redundante y podría desincronizarse del estado real                        |

---

## QA

### Manual

1. `pnpm prisma db seed` (si la migración `attendance_alert_dismissals` no se aplicó todavía en la
   base local, correr `pnpm --filter api run db:migrate` antes).
2. Iniciar sesión como un usuario con rol de nómina (`OWNER`, `SUPERVISOR`, etc.) y abrir
   `/payroll/attendance` (Control Panel).
3. **pageSize:** cambiar el selector "Filas por página" entre 20/50/100 y verificar que la tabla
   y el contador "Página X de Y" se actualizan; la página vuelve a 1 al cambiar el tamaño.
4. **Clasificación:** cambiar el filtro entre Todas / Administrativo / Operaciones y verificar que
   los KPIs superiores, la tabla y el panel de alertas cambian de forma consistente entre sí (no
   solo la tabla).
5. **Descarte de alertas:** descartar una alerta, refrescar la página (F5) y confirmar que no
   reaparece. Iniciar sesión con **otro** usuario del mismo tenant y confirmar que esa misma alerta
   sigue visible para él.

### Automatizada (backend)

- `apps/api/src/attendance/utils/clasificacion.util.spec.ts` — mapeo de clasificación.
- `apps/api/src/attendance/test/attendance.repository.spec.ts` — filtros `laborClassifications` en
  `listControlPanelLogs` / `listMobileLogsForRange`; `dismissAlert` / `listDismissedAlertKeys`.
- `apps/api/src/attendance/test/attendance-control-panel.service.spec.ts` — pageSize 20/50/100,
  clasificacion todos/administrativo/operaciones (forwarding a logs y mobile logs), `dismissAlert`,
  alerta descartada no reaparece para el mismo usuario / sí aparece para otro usuario.
- `apps/api/src/attendance/test/attendance.controller.spec.ts` — `getControlPanel` delega con
  `userId` del JWT; nuevo endpoint `dismissControlPanelAlert`.

### Postman

Nueva carpeta `OS-548 Control Panel — small fixes` dentro de `NOM-03 Attendance`:
pageSize 20/50/100, clasificacion todos/administrativo/operaciones (+ caso 400 inválido),
captura de `alertKey` real, dismiss y verificación de no reaparición.

---

## Pendientes / riesgos

- La migración `attendance_alert_dismissals` no se aplicó contra una base de datos real en esta
  sesión (no había conexión a DB disponible) — se validó con `prisma generate` (no requiere DB) y
  la migración SQL sigue el mismo estilo que las migraciones previas del módulo. Debe correrse
  `pnpm --filter api run db:migrate` (o `db:migrate:deploy` en staging) antes de desplegar.
- El filtro `clasificacion` no se propagó al endpoint de comparativo
  (`GET /attendance/control-panel/comparison`, usado por el gráfico de barras) porque no forma
  parte del mismo dataset/servicio y no estaba en el alcance de este ticket — si negocio lo pide,
  es una subtarea aparte.
- `dismissingAlertIds` en frontend es un `Set` en memoria: si el usuario recarga la página justo
  entre el POST de dismiss y el refetch, podría ver la alerta reaparecer brevemente hasta que el
  siguiente poll de 60s la excluya de nuevo (ventana muy corta, aceptado como MVP).
