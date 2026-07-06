# ASIS-UNI — Modelo único de asistencia (fuente de verdad)

**Domain:** `[BACKEND]` `[FRONTEND]` `[WEB-APP]` `[MOBILE]` `[ATTENDANCE]` `[PAYROLL]`  
**Status:** `pending`  
**Tickets Jira:** OS-379, OS-499, OS-500, OS-505, OS-547, OS-548, OS-551, OS-554, NOM-07, CONN-04a, CONN-04b  
**Módulo NestJS:** `apps/api/src/attendance/` (extender; no duplicar módulos)  
**Depends on:** OS-379, OS-499, OS-500, OS-505, OS-554  
**Blocks:** CONN-04a, CONN-04b, NOM-07 (liquidación con recargos/horas extra)

---

## Nota de alcance

La captura de asistencia se realiza **únicamente** a través de:

1. **App móvil de marcación** (OS-379, integrada con OS-499, OS-500 y OS-505 para reconocimiento facial y geolocalización).
2. **Registro manual** desde el panel de administración (OS-554).

**Fuera de alcance:** integración con dispositivos biométricos físicos independientes (kiosko hardware, relojes checadores, etc.).

> **Deuda actual:** NOM-03 introdujo marcación por kiosko (`AttendanceLog.source = DEVICE`) y OS-499/OS-505 crearon `MobileAttendanceLog` como tabla paralela. Este epic **consolida** en un solo `AttendanceLog` y elimina tablas/canales duplicados alineados con el alcance anterior.

---

## Historia de usuario

**Como** sistema,  
**quiero** un único modelo de datos de asistencia que reciba marcaciones desde cualquier canal (app móvil facial/geo, registro manual del administrador),  
**para que** el panel de asistencia (OS-547) y la liquidación de nómina lean siempre la misma fuente de verdad.

---

## Objetivo

Unificar captura, persistencia y lectura de marcaciones en **`AttendanceLog`** con un único servicio de registro (`AttendanceService.registerEvent()`), de modo que OS-551 (tarjeta), OS-548 (panel de control), NOM-06 (monitor) y NOM-07 (liquidación) consulten **solo** esa tabla.

---

## Estado actual (codebase)

| Área                    | Hoy                                                                           | Gap                                                                                          |
| ----------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `AttendanceLog`         | Kiosko + manual admin (OS-551); `source`: `DEVICE` \| `MANUAL`                | Renombrar/ampliar `source`; absorber campos móvil (geo, foto, facial)                        |
| `MobileAttendanceLog`   | Tabla paralela (OS-499/OS-505) con geo, foto, `status` VALID/REJECTED/PENDING | **Eliminar** tras migración de datos y refactor de mutations GraphQL                         |
| `AttendanceCardService` | `createManualMarking` inserta en `AttendanceLog`                              | Debe delegar en `registerEvent()`                                                            |
| Mobile GraphQL          | `registrarMarcacion` escribe en `MobileAttendanceLog`                         | Debe escribir en `AttendanceLog` vía `registerEvent()`                                       |
| OS-548 control panel    | Lee `AttendanceLog` + `MobileAttendanceLog`                                   | Leer solo `AttendanceLog`                                                                    |
| NOM-07 liquidación      | Por confirmar fuente; puede divergir si usa `MobileAttendanceLog`             | Forzar lectura exclusiva de `AttendanceLog`                                                  |
| Kiosko NOM-03           | `source=DEVICE`                                                               | **Retirar** del producto final o mapear legacy → `APP_MOVIL` en migración (decisión Task 01) |

### Archivos relevantes

- `apps/api/prisma/schema.prisma` — `AttendanceLog`, `MobileAttendanceLog`, `AttendanceLogSource`
- `apps/api/src/attendance/service/attendance-card.service.ts`
- `apps/api/src/attendance/mobile/` — resolvers/servicios móvil
- `apps/api/src/attendance/service/attendance-control-panel.service.ts`
- `apps/web-app/src/features/attendance/` — tarjeta, monitor, panel
- `tasks/payroll/OS-499-OS-505-mobile-attendance.md` — decisión histórica de tabla separada (a revertir)
- `tasks/attendance/OS-551-attendance-card.md` — `MANUAL` + inmutabilidad

---

## Decisiones de diseño

### 1. Fuente de verdad única

- **Una tabla:** `AttendanceLog`.
- **Ningún** módulo de nómina, panel o reporte mantiene copia propia de marcaciones.
- Tras este epic, **no debe existir** `MobileAttendanceLog` ni lecturas duales en servicios.

### 2. Campo `source`

```prisma
enum AttendanceLogSource {
  APP_MOVIL   // Marcación desde app móvil (facial + geo)
  MANUAL      // Registro/corrección por administrador (OS-554 / tarjeta OS-551)
  // DEVICE — solo si se conserva data legacy migrada; no aceptar nuevos DEVICE en producto
}
```

- Visible en UI (tarjeta OS-551, panel OS-548) para distinguir origen.
- `MANUAL` conserva semántica OS-551: insert-only, `manualParentLogId`, `manualReason`, `createdByUserId`.
- `APP_MOVIL` conserva metadata de OS-499/OS-505: coordenadas, distancia, foto (`storageObjectId`), scores faciales, `validationStatus` (VALID/REJECTED/PENDING).

### 3. `AttendanceService.registerEvent()`

Punto único de entrada para **toda** marcación:

```typescript
registerEvent(params: {
  tenantId: string;
  employeeId: string;
  locationId: string;
  eventType: 'ENTRY' | 'EXIT';
  source: 'APP_MOVIL' | 'MANUAL';
  timestamp: Date;
  actorUserId?: string;        // MANUAL
  manualReason?: string;       // MANUAL
  manualParentLogId?: string;  // MANUAL
  clientLatitude?: number;     // APP_MOVIL
  clientLongitude?: number;    // APP_MOVIL
  storageObjectId?: string;    // APP_MOVIL (foto)
  facialMatchScore?: number;   // APP_MOVIL
  // ...
}): Promise<AttendanceLog>
```

**Validaciones compartidas** (sin importar canal):

- Turno activo / secuencia ENTRY–EXIT coherente.
- Duplicados en ventana configurable.
- Geocerca (Haversine) para `APP_MOVIL`; reglas de `workDate` (turno nocturno) ya documentadas en schema.
- `tenantId` + `employeeId` + `locationId` siempre validados.

Los controllers/resolvers GraphQL y REST **no** insertan en Prisma directamente: delegan en `registerEvent()`.

### 4. Lectores (solo lectura de `AttendanceLog`)

| Consumidor            | Ticket          | Acción                                                                |
| --------------------- | --------------- | --------------------------------------------------------------------- |
| Tarjeta de asistencia | OS-551          | Ya lee `AttendanceLog`; mostrar `source` como `APP_MOVIL` \| `MANUAL` |
| Panel de control      | OS-548          | Dejar de unir `MobileAttendanceLog`                                   |
| Monitor sedes         | OS-547 / NOM-06 | Agregaciones solo sobre `AttendanceLog`                               |
| Liquidación nómina    | NOM-07          | Recargos/horas extra **exclusivamente** desde `AttendanceLog`         |

### 5. Migración de datos

- Script idempotente: copiar filas válidas de `MobileAttendanceLog` → `AttendanceLog` con `source=APP_MOVIL`.
- Mapear `DEVICE` legacy (kiosko) → `APP_MOVIL` o flag de migración documentado en Task 01.
- Tras validación en staging: drop `mobile_attendance_logs` en migración final (Task 05).

---

## Criterios de aceptación (producto)

- [ ] Una marcación hecha por la app móvil y una registrada manualmente por un administrador aparecen en la **misma Tarjeta de Asistencia** (OS-551) sin distinción de tabla.
- [ ] El campo `source` es **visible** en el panel para diferenciar el origen de cada registro (`APP_MOVIL` / `MANUAL`).
- [ ] Los cálculos de NOM-07 (recargos/horas extra) usan **exclusivamente** `AttendanceLog`.
- [ ] **No existe** ninguna tabla de asistencia paralela en el código resultante (`MobileAttendanceLog` eliminado).
- [ ] Tests: marcación manual y marcación de app móvil para el mismo empleado el mismo día **no generan conflicto** (conviven en la misma tabla con reglas de secuencia/duplicados).

---

## Desglose de tareas (SDD)

| #   | Archivo                                                                                | Objetivo                                                                                          |
| --- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 01  | [task-01-schema-unified-attendance-log.md](./task-01-schema-unified-attendance-log.md) | Extender `AttendanceLog`, enum `source`, campos móvil; plan migración desde `MobileAttendanceLog` |
| 02  | [task-02-register-event-service.md](./task-02-register-event-service.md)               | Implementar `AttendanceService.registerEvent()` y refactor manual                                 |
| 03  | [task-03-mobile-channel-unified.md](./task-03-mobile-channel-unified.md)               | GraphQL móvil escribe vía `registerEvent()`; deprecar `MobileAttendanceLog`                       |
| 04  | [task-04-readers-panel-card-payroll.md](./task-04-readers-panel-card-payroll.md)       | OS-548, OS-551, NOM-06, NOM-07 leen solo `AttendanceLog`; UI `source`                             |
| 05  | [task-05-migration-tests-cleanup.md](./task-05-migration-tests-cleanup.md)             | Migración datos, tests cruzados APP_MOVIL+MANUAL, drop tabla paralela, Postman                    |

---

## Dependencias

```
OS-379 ──┐
OS-499 ──┼──► ASIS-UNI (este epic) ──► CONN-04a, CONN-04b
OS-500 ──┤                              NOM-07
OS-505 ──┤
OS-554 ──┘
```

**Pre-requisitos mínimos antes de Task 03:** mutations móvil estables (OS-499/OS-505).  
**Pre-requisitos mínimos antes de Task 04:** OS-551 manual marking en producción (ya implementado).

---

## Validación global (post-epic)

```bash
pnpm --filter=@restopsiq/api exec prisma validate
pnpm --filter=@restopsiq/api test -- --testPathPattern="attendance"
pnpm --filter=web-app test -- attendance
node scripts/validate-structure.js
```

---

## Riesgos

| Riesgo                                    | Impacto | Mitigación                                                                              |
| ----------------------------------------- | ------- | --------------------------------------------------------------------------------------- |
| Datos históricos en `MobileAttendanceLog` | Alto    | Migración idempotente + verificación conteos por tenant antes de drop                   |
| Kiosko NOM-03 (`DEVICE`) en producción    | Medio   | Decidir en Task 01: migrar a `APP_MOVIL` o mantener enum legacy sin nuevos registros    |
| Reglas geo distintas entre canales        | Medio   | Solo `APP_MOVIL` aplica geocerca; `MANUAL` omite geo pero comparte secuencia/duplicados |
| NOM-07 ya implementado con otra fuente    | Alto    | Task 04 audita y corrige antes de habilitar liquidación                                 |
