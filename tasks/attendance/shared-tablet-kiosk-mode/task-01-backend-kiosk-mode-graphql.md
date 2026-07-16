# Task 01 — Backend GraphQL: Modo Marcación Tablet Compartida

**Domain:** `[BACKEND]`  
**Assigned Agent:** Backend Agent  
**Status:** `pending`  
**Created:** 2026-07-15  
**Depends On:** [Epic](./00-epic-and-decisions.md), ASIS-UNI (`registerEvent`), OS-582 (`TurnoAssignment`), OS-499/500/505 (facial metadata + consent)  
**Blocked by (soft):** [CONN-11](../conn-11-automatic-shift-cutoff/00-epic-and-decisions.md) (corte jornada — `JornadaCutoffService.isBeforeCutoff()`), CONN-12 (same-day — documentar criterio con producto)

---

## Context

El frontend del modo kiosko vive en **otro repositorio**. Este backend debe exponer operaciones GraphQL con auth scoped, lista de empleados con turno del día, marcación con verificación facial/PIN, y corrección auditada pre-corte.

Hoy existen piezas parciales incompatibles con el diseño acordado:

- `kioskAuth` emite JWT **completo** del empleado (`auth.service.ts` → `issueKioskAuthTokens`)
- `registrarMarcacion` requiere JWT del empleado + geolocalización
- `POST /api/attendance/entry|exit` es público sin verificación
- No hay campo `verificationMethod` ni source `KIOSK`

---

## Goal

Entregar el contrato GraphQL completo para modo marcación en tablet compartida, con token de alcance reducido, guards verificables, y persistencia unificada en `AttendanceLog`.

---

## Requirements

### R1 — Schema Prisma

- [ ] Agregar `KIOSK` a `AttendanceLogSource`
- [ ] Agregar enum `AttendanceVerificationMethod { FACIAL_MATCH, PIN, NONE }`
- [ ] Agregar `verificationMethod AttendanceVerificationMethod?` en `AttendanceLog`
- [ ] Agregar `kioskSessionId String?` en `AttendanceLog` (trazabilidad)
- [ ] (Opcional recomendado) Modelo `KioskMarkingSession` para revocación:

```prisma
model KioskMarkingSession {
  id              String    @id @default(cuid())
  tenantId        String
  locationId      String
  activatedByUserId String
  expiresAt       DateTime
  revokedAt       DateTime?
  createdAt       DateTime  @default(now())

  @@index([tenantId, locationId])
  @@map("kiosk_marking_sessions")
}
```

### R2 — Token scoped + guards

- [ ] `AuthService.issueKioskMarkingToken(adminUserId, tenantId, locationId, sessionId)` — TTL 20 min default
- [ ] Claim `tokenType: 'KIOSK_MARKING'` en JWT payload (`auth.interfaces.ts`)
- [ ] Guard `KioskMarkingGuard` — allowlist explícita de resolvers kiosko
- [ ] Guard existente `PermissionsGuard` / `RolesGuard` debe **rechazar** token kiosko en endpoints de aprobación/gestión
- [ ] Permiso seed: `attendance.kiosk.mark` (solo en token kiosko, no en roles admin)

### R3 — Mutations de sesión kiosko

- [ ] `activarModoMarcacionKiosko(input)` — auth JWT admin/supervisor
- [ ] `salirModoMarcacionKiosko(input)` — auth token kiosko + reauth admin (password o PIN supervisor si existe)
- [ ] Revocar `KioskMarkingSession` al salir

### R4 — Queries de selección

- [ ] `empleadosTurnoHoyKiosko` — lista empleados con turno en sede del token
- [ ] `fotoReferenciaEmpleadoKiosko(employeeId)` — URL firmada; 403 si empleado no está en lista del día

### R5 — Mutation de marcación

- [ ] `registrarMarcacionKiosko(input)` — auth token kiosko
- [ ] Flujo: consentimiento → facial metadata → PIN fallback → `registerEvent(source=KIOSK)`
- [ ] `verificarPinEmpleadoKiosko(employeeId, pin)` — endpoint auxiliar opcional si FE separa pasos

### R6 — Corrección supervisor (token admin, no kiosko)

- [ ] `anularMarcacionKiosko(attendanceLogId, reason)` — pre-corte CONN-11
- [ ] `corregirMarcacionKiosko(input)` — crea MANUAL con `manualParentLogId`; pre-corte only
- [ ] Post-corte → `ConflictException` code `POST_CUTOFF_USE_NOVEDAD`
- [ ] AuditLog completo en ambos casos

### R7 — Deprecaciones documentadas

- [ ] Marcar `kioskAuth` como `@deprecated` en GraphQL description (flujo cédula+PIN individual)
- [ ] No eliminar REST legacy en esta task

---

## Contrato GraphQL (referencia para FE)

### Enums

```graphql
enum AttendanceVerificationMethod {
  FACIAL_MATCH
  PIN
  NONE
}

enum KioskMarkingEventType {
  ENTRY
  EXIT
}
```

### Activar modo

```graphql
input ActivarModoMarcacionKioskoInput {
  locationId: ID!
}

type ModoMarcacionKioskoSession {
  accessToken: String!
  expiresAt: DateTime!
  locationId: ID!
  sessionId: ID!
}

mutation ActivarModoMarcacionKiosko($input: ActivarModoMarcacionKioskoInput!) {
  activarModoMarcacionKiosko(input: $input) {
    accessToken
    expiresAt
    locationId
    sessionId
  }
}
```

**Auth:** `Authorization: Bearer <adminJWT>` + `x-tenant-id`  
**Roles/permisos:** `SUPERVISOR`, `MANAGER`, o permiso `attendance.kiosk.activate` (definir en seed)

### Salir del modo

```graphql
input SalirModoMarcacionKioskoInput {
  adminPassword: String! # o adminPin si producto lo prefiere
}

mutation SalirModoMarcacionKiosko($input: SalirModoMarcacionKioskoInput!) {
  salirModoMarcacionKiosko(input: $input)
}
```

**Auth:** `Authorization: Bearer <kioskMarkingToken>`

### Lista empleados

```graphql
type EmpleadoTurnoKiosko {
  employeeId: ID!
  userId: ID!
  fullName: String!
  turnoLabel: String
  turnoStartTime: String
  turnoEndTime: String
  hasOpenEntry: Boolean!
  suggestedEventType: KioskMarkingEventType # ENTRY si no hay entrada abierta, else EXIT
  hasPinConfigured: Boolean!
  hasFacialReference: Boolean!
  hasBiometricConsent: Boolean!
}

query EmpleadosTurnoHoyKiosko($workDate: String) {
  empleadosTurnoHoyKiosko(workDate: $workDate) {
    employeeId
    fullName
    turnoLabel
    hasOpenEntry
    suggestedEventType
    hasPinConfigured
    hasFacialReference
    hasBiometricConsent
  }
}
```

**Auth:** token kiosko — `locationId` implícito del token, ignorar/redactar param locationId del cliente

**Lógica lista (CONN-12):**

1. Empleados activos de la sede (`EmployeeDetails.locationId`)
2. Con `TurnoAssignment` en `workDate` where `type=ASSIGNED` AND `turnoId != null`
3. UNION empleados con asignación same-day según regla CONN-12 (pendiente definición producto — mínimo: assignments creados/actualizados en `workDate`)
4. Ordenar por `fullName`

### Foto referencia

```graphql
type FotoReferenciaKiosko {
  employeeId: ID!
  photoUrl: String!
  expiresAt: DateTime!
}

query FotoReferenciaEmpleadoKiosko($employeeId: ID!) {
  fotoReferenciaEmpleadoKiosko(employeeId: $employeeId) {
    photoUrl
    expiresAt
  }
}
```

Reutilizar patrón de `MobileAttendanceService.getFacialReference()`.

### Marcación

```graphql
input RegistrarMarcacionKioskoInput {
  employeeId: ID!
  eventType: KioskMarkingEventType!
  storageObjectId: ID! # foto capturada en tablet
  facialMatchScore: Float # 0..1, calculado en cliente
  facialMatchResult: String # ej. "MATCH" | "NO_MATCH" | "LOW_CONFIDENCE"
  pin: String # requerido si facial falla o sin consentimiento
  notes: String
  timestamp: DateTime
}

type MarcacionKioskoResult {
  id: ID!
  eventType: KioskMarkingEventType!
  workDate: String!
  timestamp: DateTime!
  verificationMethod: AttendanceVerificationMethod!
  status: String! # "REGISTERED"
}

mutation RegistrarMarcacionKiosko($input: RegistrarMarcacionKioskoInput!) {
  registrarMarcacionKiosko(input: $input) {
    id
    eventType
    workDate
    verificationMethod
  }
}
```

**Reglas servicio (`KioskMarkingService`):**

| Condición                                           | Acción                                                           |
| --------------------------------------------------- | ---------------------------------------------------------------- |
| Empleado no en lista del día                        | `ForbiddenException`                                             |
| Sin consentimiento biométrico                       | Ignorar facial; exigir `pin`                                     |
| `facialMatchScore >= KIOSK_FACIAL_THRESHOLD` (0.85) | Registrar `verificationMethod=FACIAL_MATCH`                      |
| Score bajo / sin score                              | Exigir `pin`; `bcrypt.compare` vs `EmployeeDetails.pinHash`      |
| PIN incorrecto                                      | `UnauthorizedException` — no bloquear tablet, permitir reintento |
| PIN no configurado y facial falló                   | `UnprocessableEntityException('PIN no configurado')`             |
| Double-entry / exit sin entry                       | Mismas reglas que `registerEvent()`                              |

Persistir:

```typescript
await registerEvent({
  source: 'KIOSK',
  employeeId,
  locationId: token.locationId,
  eventType,
  storageObjectId,
  facialMatchScore,
  facialMatchResult,
  verificationMethod,
  kioskSessionId: token.sessionId,
  validationStatus: 'VALID',
  createdByUserId: token.sub, // admin que activó modo
});
```

### Corrección (supervisor — fuera del token kiosko)

```graphql
input CorregirMarcacionKioskoInput {
  attendanceLogId: ID!
  eventType: KioskMarkingEventType!
  timestamp: DateTime!
  reason: String!
  notes: String
}

mutation AnularMarcacionKiosko($attendanceLogId: ID!, $reason: String!) {
  anularMarcacionKiosko(attendanceLogId: $attendanceLogId, reason: $reason) {
    id
    isActive
  }
}

mutation CorregirMarcacionKiosko($input: CorregirMarcacionKioskoInput!) {
  corregirMarcacionKiosko(input: $input) {
    id
    manualParentLogId
  }
}
```

**Pre-corte:** delegar a `JornadaCutoffService.isBeforeCutoff(tenantId, employeeId, workDate)` — ver [CONN-11](../conn-11-automatic-shift-cutoff/00-epic-and-decisions.md).

**Post-corte:**

```json
{
  "errors": [
    {
      "message": "La jornada ya fue cerrada. Use el flujo de novedades.",
      "extensions": { "code": "POST_CUTOFF_USE_NOVEDAD" }
    }
  ]
}
```

---

## Acceptance Criteria

- [ ] Token kiosko → `registrarMarcacionKiosko` ✅; token kiosko → `approveOvertimeRequest` (o similar) ❌ 403
- [ ] `activarModoMarcacionKiosko` sin rol admin → 403
- [ ] `salirModoMarcacionKiosko` sin password admin correcto → 401
- [ ] Lista incluye solo empleados con turno ASSIGNED del día en la sede
- [ ] Marcación facial exitosa: `source=KIOSK`, `verificationMethod=FACIAL_MATCH`
- [ ] Marcación facial fallida + PIN correcto: `verificationMethod=PIN`
- [ ] Admin no aparece en ningún flujo de aprobación de identidad
- [ ] Anulación pre-corte genera `AuditLog` con motivo y actor
- [ ] Corrección post-corte retorna `POST_CUTOFF_USE_NOVEDAD`
- [ ] `pnpm --filter=@restopsiq/api run typecheck` pasa
- [ ] `node scripts/validate-structure.js` pasa
- [ ] Tests en `apps/api/src/attendance/test/kiosk-marking.*.spec.ts` cubren casos del epic

---

## Tests obligatorios

| Caso                                | Expectativa                     |
| ----------------------------------- | ------------------------------- |
| Token kiosko en endpoint aprobación | 403 Forbidden                   |
| Activar modo sin permiso            | 403                             |
| Salir modo password incorrecto      | 401                             |
| Lista empleados — solo con turno    | count correcto                  |
| Marcación facial score alto         | `FACIAL_MATCH`, sin PIN         |
| Marcación facial baja + PIN ok      | `PIN`                           |
| Marcación facial baja + PIN mal     | 401, sin log                    |
| Anulación pre-corte                 | `isActive=false` + audit        |
| Corrección post-corte               | error `POST_CUTOFF_USE_NOVEDAD` |

---

## Files to Create or Modify

### Create

- `apps/api/src/attendance/kiosk/` — submódulo (resolver, service, interfaces, guard)
  - `kiosk-marking.resolver.ts` — todas las operaciones GraphQL
  - `kiosk-marking.service.ts` — lógica marcación + lista
  - `kiosk-marking-session.service.ts` — activar/salir/revocar
  - `kiosk-marking.guard.ts`
  - `interfaces/kiosk-marking.interfaces.ts`
  - `test/kiosk-marking.service.spec.ts`
  - `test/kiosk-marking.resolver.spec.ts`
  - `test/kiosk-marking.guard.spec.ts`
- Consumir `JornadaCutoffService` de [CONN-11 task 03](../conn-11-automatic-shift-cutoff/task-03-jornada-cutoff-service-and-scheduler.md) — no duplicar
- `apps/api/prisma/migrations/*_kiosk_marking_mode/` — migración schema

### Modify

- `apps/api/prisma/schema.prisma` — enums + campos + session model
- `apps/api/src/auth/service/auth.service.ts` — `issueKioskMarkingToken`
- `apps/api/src/auth/interfaces/auth.interfaces.ts` — payload type
- `apps/api/src/attendance/service/attendance.service.ts` — `registerEvent` acepta KIOSK + verificationMethod
- `apps/api/src/attendance/interfaces/attendance.interfaces.ts` — tipos extendidos
- `apps/api/src/attendance/repository/attendance.repository.ts` — persistir nuevos campos
- `apps/api/src/attendance/attendance.module.ts` — registrar providers
- `apps/api/src/common/guards/permissions.guard.ts` — rechazar kiosko token fuera de allowlist
- `apps/api/prisma/seed.ts` — permiso `attendance.kiosk.mark`, `attendance.kiosk.activate`
- `postman/restopsiq-api.collection.json` — carpeta "Kiosk Marking Mode"

### Forbidden

- `apps/web-app/**`
- `packages/**` (salvo `packages/shared` si se agrega enum compartido — coordinar)
- `apps/api/src/app.module.ts` (salvo instrucción explícita)
- Eliminar `kioskAuth` o REST entry/exit legacy

---

## Validation

```bash
pnpm --filter=@restopsiq/api run typecheck
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api test -- --testPathPattern=kiosk-marking
```

---

## Notas / preguntas abiertas para producto

1. **CONN-12:** ¿Cómo se distingue una asignación "same-day" de la planeación semanal? ¿Flag en `TurnoAssignment`, tabla separada, o `updatedAt = workDate`?
2. **CONN-11:** ¿Hora exacta del corte por sede/turno? ¿Timezone siempre Bogotá?
3. **Reauth salida modo:** ¿Password del admin o PIN de 4 dígitos del supervisor?
4. **Umbral facial:** ¿0.85 global o configurable por tenant?
5. **Upload foto:** ¿FE usa mutation GraphQL existente de storage o REST? Documentar endpoint actual para el otro repo.

---

## Resumen para el equipo FE (otro repo)

El otro repo necesita implementar:

1. Pantalla bloqueada con flujo: **Admin activa modo** → **Lista empleados** → **Captura foto** → **Match local** → **PIN si falla** → **Marcación** → **Vuelta a lista**
2. Header `Authorization: Bearer <kioskToken>` en todas las calls del modo
3. No usar `kioskAuth` ni `registrarMarcacion` del flujo móvil
4. Correcciones las hace supervisor en app admin normal (token completo), no en modo kiosko
