# OS-583 — Asignación masiva de Turnos (plantilla Excel + importación)

**Domain:** `[BACKEND]` `[FRONTEND]` `[RBAC]` `[AUDIT]`
**Status:** `implemented`
**Rutas REST:** `/api/turnos/asignaciones/template`, `/api/turnos/asignaciones/import`
**Ruta frontend:** `/asistencia/turnos/asignacion` (modal "Asignación masiva de Turnos")
**Depends on:** OS-582 (`TurnoAssignment`, `TurnoAssignmentsService.assign/remove/resolveScope`)
**Precedido por:** OS-582 (Asignación de Turnos — vista semanal).

---

## Alcance

Permite generar una plantilla Excel (`.xlsx`) con el rango de fechas y colaboradores seleccionados en la grilla de OS-582, y luego importar ese mismo archivo (editado por el usuario) para crear/actualizar asignaciones en lote.

### Decisión cerrada: la sección 1 del modal NO asigna directamente

El modal tiene dos secciones independientes:

1. **Configurar y descargar plantilla** — rango de fechas + días de semana + colaboradores (los ya seleccionados en la grilla, vía checkboxes de OS-582). Solo genera y descarga el `.xlsx`. No hay selector de turno ni botón "Asignar" en esta sección.
2. **Importar archivo** — sube el `.xlsx` (editado por el usuario, con las siglas de turno por celda) y crea/actualiza las asignaciones reales.

No existe una vía de "asignación directa sin archivo" — toda escritura masiva pasa por el archivo Excel.

### Fuera de alcance

- Asignación masiva directa sin archivo (fue explícitamente descartada en las decisiones de este ticket).
- Lectura/historial avanzado de importaciones pasadas (qué archivo generó qué asignaciones, quién importó cuándo) — solo queda el rastro en `AuditLog` vía las mismas operaciones de OS-582 (`ASSIGN`), no hay una entidad "ImportJob" ni un endpoint para listarlas.
- Plantilla/import para "descanso rotativo" o reglas de patrón (ej. "cada 6 días") — cada celda de fecha se resuelve independientemente.

---

## Flujo funcional

```
Grilla OS-582 (colaboradores con checkbox) → "Asignación masiva" (deshabilitado sin selección)
  → BulkAssignmentModal
      Sección 1: Desde/Hasta + días de semana (Lun-Vie preseleccionado) → "Descargar plantilla"
        → GET /turnos/asignaciones/template?from&to&weekdays&employeeIds → .xlsx
      Sección 2: seleccionar archivo (.xlsx/.xls, máx 5MB) → "Importar"
        → POST /turnos/asignaciones/import (multipart) → BulkImportResult
        → refresca la query semanal de OS-582 (misma invalidación de React Query)
```

El botón "Asignación masiva" en `AsignacionTurnosScreen` está deshabilitado cuando `selectedIds.size === 0` (reutiliza el mismo estado de selección de checkboxes que ya existía como shell visual en OS-582).

---

## Backend

Extiende el mismo módulo `apps/api/src/turnos/` (no se creó módulo nuevo):

- `service/turno-assignments-template.service.ts` — genera el `.xlsx`.
- `service/turno-assignments-import.service.ts` — procesa el `.xlsx` importado.
- `pipes/excel-file-validation.pipe.ts` — valida extensión, MIME y magic numbers del archivo subido.
- `interfaces/turno-assignments-bulk.interfaces.ts` — `GenerateTemplateOptions`, `BulkImportResult`, `BulkImportRowError`, `BulkEmployeeInfo`.
- `controller/dto/get-bulk-template-query.dto.ts`, `controller/dto/bulk-import-result.dto.ts`.

### Endpoints

| Método | Ruta                                                             | Descripción                                                                                       |
| ------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `GET`  | `/turnos/asignaciones/template?from=&to=&weekdays=&employeeIds=` | Genera y descarga la plantilla `.xlsx` para los colaboradores/fechas indicados.                   |
| `POST` | `/turnos/asignaciones/import` (multipart, campo `file`)          | Procesa el `.xlsx` importado y crea/actualiza/revierte asignaciones. Devuelve `BulkImportResult`. |

Ambos endpoints reutilizan el mismo guard dual y los mismos permisos de escritura de OS-582 (`TURNO_ASSIGNMENTS_WRITE_ROLES` / `attendance.turnos.assignment.write`) — no se crearon permisos nuevos, ya que generar/importar la plantilla es, en esencia, una forma de escritura masiva de asignaciones.

### Plantilla Excel (`GET /template`)

**Validaciones** (`TurnoAssignmentsTemplateService.generateTemplate`):

- `to >= from` (400 si no).
- Rango máximo `BULK_TEMPLATE_MAX_RANGE_DAYS = 90` días (400 si se supera).
- Al menos 1 `weekday` y al menos 1 `employeeId` (400 si no).
- `from` en el pasado bloqueado con 403 salvo `OWNER`/`SUPER_ADMIN` (mismo criterio que OS-582).
- Colaboradores deben existir en el tenant (404 si falta alguno), estar activos (409 si hay inactivos), y — si el actor es `SUPERVISOR`/`MANAGER` — pertenecer a una sede permitida (`TurnoAssignmentsService.resolveScope`, ahora público) (403 si hay alguno fuera de sede).

**Estructura del archivo** (`buildWorkbook`):

- Hoja **"Turnos"**: columnas `Documento`, `Nombre Colaborador`, `Employee ID` (oculta) + una columna por fecha (`YYYY-MM-DD`, usada también como header — el importador la reconoce por nombre de columna, no por posición, así el usuario puede reordenar columnas sin romper el import). Una fila por colaborador seleccionado.
- Hoja **"Turnos Disponibles"**: `Nombre`/`Sigla`/`Hora Inicio`/`Hora Fin`/`Jornada` de cada turno activo del tenant, más dos filas sintéticas `BASE` (revertir a base) y `DESCANSO` (descanso explícito).
- Cada celda de fecha en "Turnos" tiene una validación de datos tipo lista (`dataValidations.add`) que apunta al rango de siglas de "Turnos Disponibles" (incluye siglas reales + `BASE` + `DESCANSO`).
- Nombre de archivo: `plantilla_turnos_<from>_<to>.xlsx`.
- Se registra `AuditAction.EXPORT` vía `assignmentsRepository.logTemplateExportAudit` (from/to/weekdays/cantidad de colaboradores y fechas).

### Importación (`POST /import`)

**Validación de archivo** (`ExcelFileValidationPipe`, nuevo — el `FileValidationPipe` existente solo permite imágenes/PDF):

- Extensión `.xlsx`/`.xls`.
- MIME whitelist (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `application/vnd.ms-excel`, `application/octet-stream`).
- Máximo `BULK_IMPORT_MAX_FILE_BYTES = 5MB`.
- Magic numbers: ZIP (`50 4B 03 04` / `50 4B 05 06`) para `.xlsx`, OLE2/CFB (`D0 CF 11 E0 A1 B1 1A E1`) para `.xls` — cruzado contra la extensión declarada.

**Procesamiento** (`TurnoAssignmentsImportService.importFromExcel`):

1. Lee la hoja `"Turnos"` (400 si no existe).
2. Detecta columnas por nombre de header: `Documento`, `Employee ID`, y columnas de fecha (regex `YYYY-MM-DD`). 400 si faltan ambas columnas de identificación de colaborador, o si no hay ninguna columna de fecha.
3. Resuelve el scope de sede del actor una sola vez (`resolveScope`, reutilizado de OS-582).
4. Valida que el total de celdas accionables (no vacías) no supere `BULK_IMPORT_MAX_ASSIGNMENTS = 5000` (400 si se supera).
5. Por cada fila con datos:
   - Resuelve el colaborador **preferentemente por `Employee ID`**, con fallback a `Documento`. Si no se encuentra → error de fila (`errorCount++`), se saltan todas las celdas de esa fila.
   - Si el colaborador está fuera de la sede permitida del actor → **excluido** (`excluded++`, no cuenta como error), se saltan todas las celdas de esa fila.
   - Si el colaborador está inactivo → error de fila.
   - Por cada celda de fecha no vacía:
     - Vacía → no-op (se ignora, no genera fila en `errors`).
     - `BASE` → si existe una asignación explícita para esa fecha, se elimina (`TurnoAssignmentsService.remove`) → `returnedToBase++`. Si no existía, no-op.
     - `DESCANSO`/`REST` → `TurnoAssignmentsService.assign(..., type: REST)` → `restDays++`.
     - Cualquier otro valor → se busca como sigla de turno activo (`turnosRepository.findBySigla`). Si no existe o está inactivo → error de celda. Si existe → `TurnoAssignmentsService.assign(..., turnoId)` → `createdOrUpdated++`.
6. Si **todas** las filas fallaron (`totalAssignments === 0 && errorCount > 0`) → `400 BulkImportAllFailedException`, cuyo body incluye el mismo `BulkImportResult` completo (para que el frontend pueda mostrar el detalle de errores incluso en el caso "todo falló").

**No se duplica validación de negocio**: cada escritura real (`assign`/`remove`) delega en `TurnoAssignmentsService`, el mismo service de OS-582 — turno activo, `turnoId` requerido/ausente según `type`, fecha pasada bloqueada salvo admin, scope de sede. La única lógica nueva en el import es la resolución de colaborador (por ID/documento) y la clasificación de excepciones (`SCOPE_FORBIDDEN_MESSAGE`/`PAST_DATE_FORBIDDEN_MESSAGE`, exportadas desde `turnos.constants.ts` para no depender de string-matching frágil).

**Resultado** (`BulkImportResult`):

```typescript
{
  totalRows: number; // filas con datos de colaborador
  totalAssignments: number; // celdas procesadas con éxito (createdOrUpdated + returnedToBase + restDays)
  createdOrUpdated: number;
  returnedToBase: number;
  restDays: number;
  excluded: number; // filas fuera de sede del actor (no cuenta como error)
  errorCount: number; // errores genuinos (fila o celda)
  errors: Array<{ row: number; employee?: string; date?: string; reason: string }>;
}
```

`errors[]` es la fuente única de "qué no se procesó" — incluye tanto errores genuinos como exclusiones por sede; `errorCount` y `excluded` se incrementan por separado para que el resumen distinga ambos casos.

---

## RBAC / Permisos

No se agregaron permisos nuevos. Ambos endpoints usan los mismos guards/roles/permiso de escritura que OS-582:

| Rol                      | Template | Import | Scoping                             |
| ------------------------ | -------- | ------ | ----------------------------------- |
| `OWNER` / `SUPER_ADMIN`  | ✅       | ✅     | Todas las sedes                     |
| `SUPERVISOR` / `MANAGER` | ✅       | ✅     | Solo colaboradores de sus sedes     |
| `NOMINA`                 | ❌       | ❌     | Sin acceso (solo lectura en OS-582) |
| `OPERATOR`               | ❌       | ❌     | Sin acceso                          |

---

## AuditLog

- **Template**: `AuditAction.EXPORT` por cada descarga (`logTemplateExportAudit`), con from/to/weekdays/cantidad de colaboradores y fechas en `newValue`.
- **Import**: no se registra una entrada de auditoría "de importación" per se — cada asignación/reversión/descanso creado durante el import genera su propia entrada `AuditAction.ASSIGN` a través de `TurnoAssignmentsService.assign`/`.remove`, exactamente igual que si se hubiera hecho manualmente desde la grilla (mismo mecanismo de trazabilidad de OS-582, sin duplicar lógica).

---

## Frontend

- `AsignacionTurnosScreen`: el botón "Descargar formato" (antes deshabilitado con tooltip "Disponible en OS-583") se reemplazó por **"Asignación masiva"**, habilitado solo cuando hay al menos un colaborador seleccionado (`selectedIds.size > 0`) y el actor tiene permiso de escritura. Abre `BulkAssignmentModal` pasando `selectedEmployeeIds`.
- `BulkAssignmentModal` (`components/turno-assignments/BulkAssignmentModal.tsx`):
  - **Sección 1**: campos Desde/Hasta (`InventarioDateField`), checkboxes de día de semana (Lun–Dom, Lun–Vie preseleccionado), resumen dinámico (colaboradores seleccionados, fechas afectadas, rango, días), validaciones en vivo (hasta < desde, rango > 90 días, sin días seleccionados, fecha pasada sin permiso de override) y botón "Descargar plantilla" (deshabilitado si hay error de validación o no hay colaboradores).
  - **Sección 2**: `FileUpload` de `@restopsiq/ui` (sin las props `accept`/`maxSize` — ese componente descarta en silencio los archivos que no cumplen esas props sin exponer el motivo; la validación de extensión/tamaño se hace manualmente en `handleFileSelect` para poder mostrar el mensaje de error), botón "Importar" con estado de carga, panel de resumen (asignadas/actualizadas, devueltas a base, descansos, excluidos, errores) y lista de errores por fila/fecha cuando aplica.
  - Al importar con éxito, `useImportAssignmentsMutation` invalida la query de asignaciones semanales (mismo query key que usan `useAssignTurnoMutation`/`useDeleteAssignmentMutation` de OS-582) — la grilla se refresca automáticamente sin cerrar el modal, para que el usuario vea el resumen de la importación.
- `utils/week.utils.ts`: se agregaron `toIsoWeekday`, `daysBetween`, `expandDatesInRange` (mismas funciones que el backend, usadas para el cálculo en vivo de "fechas afectadas" en el modal).

---

## Límites y convenciones

| Constante                                | Valor             | Motivo                                                       |
| ---------------------------------------- | ----------------- | ------------------------------------------------------------ |
| `BULK_TEMPLATE_MAX_RANGE_DAYS`           | 90                | Evitar plantillas/archivos desproporcionados                 |
| `BULK_IMPORT_MAX_ASSIGNMENTS`            | 5000              | Límite de celdas accionables por archivo importado           |
| `BULK_IMPORT_MAX_FILE_BYTES`             | 5 MB              | Límite de tamaño de archivo subido                           |
| Formato de columnas de fecha             | `YYYY-MM-DD`      | Coincide con `DATE_ONLY_REGEX`, permite reordenar columnas   |
| Convención de día de semana (`weekdays`) | ISO (1=Lun…7=Dom) | Coincide con el ejemplo del ticket (`"1,2,3,4,5"` = Lun-Vie) |

---

## Riesgos / decisiones documentadas

1. No existe entidad "ImportJob" ni endpoint para listar importaciones pasadas — el único rastro es el conjunto de entradas `AuditAction.ASSIGN` generadas por cada asignación/reversión individual (mismo mecanismo que una edición manual). Si en el futuro se necesita "ver qué importó fulano el día X", habría que correlacionar por rango de tiempo en `AuditLog`, no hay agrupación explícita.
2. El límite de 5000 asignaciones se valida sobre celdas no vacías totales del archivo, no distingue por tipo de valor (turno/BASE/DESCANSO) — una plantilla con muchas celdas `BASE` (no-op si no hay asignación previa) cuenta igual para el límite.
3. La resolución de colaborador prioriza `Employee ID` sobre `Documento`; si el usuario edita manualmente la columna oculta `Employee ID` con un valor incorrecto pero deja el `Documento` correcto, el import usará el `Employee ID` (posiblemente incorrecto) y no caerá al fallback por documento.

---

## QA — casos a validar manualmente

- Botón "Asignación masiva" deshabilitado sin colaboradores seleccionados; se habilita al marcar al menos un checkbox.
- Descargar plantilla con 2+ colaboradores seleccionados y rango de 1 semana → archivo `.xlsx` con hoja "Turnos" (filas = colaboradores, columnas = fechas Lun-Vie) y hoja "Turnos Disponibles" con los turnos activos + BASE + DESCANSO.
- Editar una celda con una sigla válida → importar → la celda de la grilla de OS-582 muestra el turno asignado.
- Editar una celda con `DESCANSO` → importar → la celda marca descanso explícito.
- Editar una celda con `BASE` sobre una fecha que ya tenía asignación explícita → importar → la celda vuelve a "Descanso + Turno Base".
- Editar una celda con una sigla inexistente → importar → el resto de filas/celdas válidas igual se procesan; el resumen muestra 1 error con la fila/fecha/motivo.
- Como `SUPERVISOR`, incluir en el archivo un colaborador fuera de sus sedes → esa fila se reporta como "excluida", no como error, y no se procesa.
- Archivo donde todas las filas fallan (ej. todas con sigla inválida) → `400` con el detalle completo (`BulkImportResult`) visible en el modal.
- Subir un archivo `.csv` o de más de 5MB → rechazado en el frontend antes de llamar a la API, con mensaje de error visible.
