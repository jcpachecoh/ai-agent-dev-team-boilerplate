# Task 01 — Schema & Migración: AttendanceLog + Enums + PIN de empleado

## Objetivo

Extender el schema de Prisma con los modelos necesarios para el control de asistencia:
`AttendanceLog` (registro de eventos entrada/salida) y los enums asociados.
Agregar `pinHash` a `EmployeeDetails` para habilitar autenticación por cédula+PIN en el kiosko
sin duplicar el modelo `OperationalUser` del MES.

---

## Contexto del análisis previo

### Qué existe hoy que NOM-03 puede reutilizar

| Artefacto                                        | Ubicación              | Relevancia                                                    |
| ------------------------------------------------ | ---------------------- | ------------------------------------------------------------- |
| `User` (cedula, documentType, tenantId)          | `schema.prisma` l. 329 | Ancla de identidad del empleado                               |
| `EmployeeDetails` (userId, tenantId, locationId) | `schema.prisma` l. 409 | Relación 1-1 con User, ya tiene sede                          |
| `Location` (id, tenantId, code, name)            | `schema.prisma` l. 391 | FK objetivo del kiosko                                        |
| `OperationalUser.cedulaHash`                     | `schema.prisma` l. 524 | Patrón HMAC-SHA256 de cédula (reusar algoritmo, NO el modelo) |
| `OperationalUser.pinHash`                        | `schema.prisma` l. 525 | Patrón bcrypt para PIN (reusar algoritmo, NO el modelo)       |
| `ProductionShift` (MORNING/AFTERNOON/NIGHT)      | `schema.prisma` l. 686 | Enum reutilizable para turno de asistencia                    |
| `SMLV_2025`, validaciones Colombia               | `payroll.constants.ts` | Referencia para cálculo de horas extra                        |

### Qué NO existe y debe crearse

- Ningún modelo `attendance`, `shift`, `schedule`, `clockIn/Out` existe en el schema.
- `EmployeeDetails` no tiene `pinHash` — los empleados no pueden autenticarse con PIN hoy.
- `Location` no tiene relación con asistencia.

### Decisión de PIN: por qué no reutilizar `OperationalUser`

`OperationalUser` es el perfil de operario de planta MES (roles: OWNER/SUPERVISOR/MANAGER/OPERATOR).
Los empleados de nómina son entidades `User + EmployeeDetails`. Reutilizar `OperationalUser`
requeriría crear un perfil operacional para cada empleado y mezclar semánticas.

**Decisión:** Agregar `pinHash String?` a `EmployeeDetails`. El PIN se setea al crear o
actualizar el empleado (NOM-02 ya gestiona esa operación). El algoritmo de hashing es idéntico
al de `OperationalUser` (bcrypt, SALT_ROUNDS = 12).

---

## Scope

### Modelos nuevos

```prisma
// ─── NOM-03: CONTROL DE ASISTENCIA ───────────────────────────────────────────

enum AttendanceEventType {
  ENTRY
  EXIT
}

// Reutilizar ProductionShift no es posible semánticamente (MES vs Nómina).
// Se define un enum propio para independencia de dominio.
enum AttendanceShift {
  MORNING    // 06:00 – 14:00
  AFTERNOON  // 14:00 – 22:00
  NIGHT      // 22:00 – 06:00
}

model AttendanceLog {
  id          String              @id @default(cuid())
  tenantId    String
  userId      String
  locationId  String
  eventType   AttendanceEventType
  shift       AttendanceShift?
  timestamp   DateTime            @default(now())
  workDate    DateTime            // Date (sin hora) para agrupación diaria
  notes       String?
  isActive    Boolean             @default(true)
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt

  user     User     @relation(fields: [userId], references: [id])
  location Location @relation(fields: [locationId], references: [id])

  @@index([tenantId, userId, workDate])
  @@index([tenantId, locationId, workDate])
  @@index([tenantId, workDate])
  @@map("attendance_logs")
}
```

### Modificaciones a modelos existentes

```prisma
// En EmployeeDetails — agregar:
pinHash String?   // bcrypt, mismo SALT_ROUNDS = 12 que OperationalUser

// En User — agregar relación inversa:
attendanceLogs AttendanceLog[]

// En Location — agregar relación inversa:
attendanceLogs AttendanceLog[]
```

### Índices justificados

- `(tenantId, userId, workDate)` — consulta diaria por empleado (cálculo horas).
- `(tenantId, locationId, workDate)` — vista del kiosko (quién está en la sede hoy).
- `(tenantId, workDate)` — reportes consolidados por tenant.

---

## Archivos permitidos

```
apps/api/prisma/schema.prisma          ← agregar enums + model AttendanceLog + campos
apps/api/prisma/migrations/            ← una sola migración generada por prisma migrate dev
apps/api/prisma/seed.ts                ← opcional: seed fixture de AttendanceLog para Postman
```

## Archivos prohibidos

```
apps/api/src/**                        ← ningún código de aplicación en esta task
apps/web-app/**                        ← frontend bloqueado
apps/web/**                            ← frontend bloqueado
apps/plant/**                          ← frontend bloqueado
package.json / pnpm-lock.yaml          ← no tocar dependencias
```

---

## Criterios de aceptación

1. `prisma validate` pasa sin errores.
2. `prisma generate` completa sin errores — cliente TypeScript incluye `AttendanceLog`, `AttendanceEventType`, `AttendanceShift`.
3. Una **sola** migración generada, nombre: `add_attendance_log_nom03`.
4. `EmployeeDetails` incluye `pinHash String?` en el schema y en la migración.
5. `AttendanceLog` tiene FK a `User` y `Location` (ambas con índice).
6. La migración es **aditiva pura** — zero `DROP`, zero `ALTER` destructivo sobre tablas existentes.
7. `prisma migrate deploy` aplicable sobre la DB local sin errores.

---

## Validaciones

```bash
# Desde apps/api/
pnpm exec prisma validate
pnpm exec prisma generate
pnpm exec prisma migrate dev --name add_attendance_log_nom03
pnpm exec prisma migrate deploy   # verificar idempotencia
```

---

## Riesgos / Gaps

| Riesgo                                                                                    | Impacto | Estrategia                                                                                                   |
| ----------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------ |
| `pinHash` nullable en EmployeeDetails: empleados sin PIN no pueden usar el kiosko         | Medio   | Task 02 valida que `pinHash` exista al momento del check-in; NOM-02 `update` añadirá campo PIN opcional      |
| `workDate` requiere normalización a medianoche UTC o zona Colombia (UTC-5)                | Alto    | Task 02 debe normalizar `workDate = startOfDay(timestamp, 'America/Bogota')` — dejar explícito en el service |
| Turnos nocturnos cruzan medianoche: un turno puede tener ENTRY en día D y EXIT en día D+1 | Alto    | `workDate` se asigna por la fecha del ENTRY, no del EXIT. Dejar documentado en el modelo                     |
| No existe calendario de festivos colombianos en el sistema                                | Alto    | Task 02 calcula solo horas totales del día; el recargo por festivo queda como **gap explícito** para NOM-04  |
| `AttendanceShift` vs `ProductionShift`: dos enums paralelos                               | Bajo    | Justificado por independencia de dominio; documentar en el schema con comentario                             |
