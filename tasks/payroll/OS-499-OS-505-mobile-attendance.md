# OS-499 / OS-505 — Marcaciones móviles (Mobile Attendance)

**Estado:** Implementado — en revisión  
**Módulo:** `attendance/mobile`  
**Tickets Jira:** OS-499, OS-505  
**Autor:** Nicolas Riveros  
**Fecha:** 2026-06-30

---

## Objetivo

Implementar endpoints GraphQL para que empleados registren marcaciones de entrada/salida desde la app móvil, incluyendo validación de geofence en el backend, soporte para foto de asistencia y consultas de historial para el equipo de nómina.

---

## Alcance (MVP)

| Incluido                                   | Excluido                                                                |
| ------------------------------------------ | ----------------------------------------------------------------------- |
| Mutation `registrarMarcacion` (ENTRY/EXIT) | Integración con cálculo de nómina (flujo kiosko sigue siendo la fuente) |
| Validación Haversine backend               | Notificaciones push por marcación rechazada                             |
| Query `misMarcaciones`                     | Query `marcacionesPorEmpleado` avanzada con analytics                   |
| Query `marcacionesPorSede`                 | Migración de lat/lng String→Float (se crearon campos separados)         |
| Query `sedeMarcacionConfig`                |                                                                         |
| Permisos `attendance.mobile.create/read`   |                                                                         |
| Flujo 2 pasos para foto (REST + GraphQL)   |                                                                         |

---

## Decisiones técnicas

### Modelo separado `MobileAttendanceLog`

Se crea un modelo Prisma separado de `AttendanceLog` (kiosko) para evitar contaminar el flujo de cálculo de nómina existente y porque los dos flujos tienen datos distintos (GPS, foto, facial). La integración con nómina queda pendiente hasta confirmar si reemplaza o complementa el kiosko.

### Campos `geoLatitude / geoLongitude` en Location

`Location.latitude` y `Location.longitude` existentes son `String?`. Para no romper datos existentes se crearon campos nuevos `geoLatitude Float?` y `geoLongitude Float?`. El campo `checkInRadiusMeters Int?` también es nuevo. Todos son opcionales para no afectar sedes sin geofence.

### Foto en flujo 2 pasos (REST → GraphQL)

No se usa `graphql-upload` (no instalado, conflictos con Apollo Server 5). El flujo es:

1. `POST /storage/upload` con `domain=PAYROLL` → obtener `storageObjectId` + URL
2. `mutation registrarMarcacion` con `storageObjectId` opcional

El backend valida ownership (`uploadedBy = userId`) y dominio (`PAYROLL`) del `StorageObject`.

### `employeeId` nunca del cliente

El `employeeId` del log siempre se deriva del `userId` del JWT via lookup a `EmployeeDetails`. No se acepta en el input.

### Status de validación sin excepción

Si la marcación es rechazada por distancia, se crea el log con `status=REJECTED` y `rejectionReason='OUTSIDE_RADIUS'`. **No se lanza excepción** — el intento queda en base de datos para auditoría. Solo se lanzan excepciones para errores de autorización/entidad.

### PENDING para sedes sin geofence

Si la sede no tiene `geoLatitude`, `geoLongitude` o `checkInRadiusMeters`, el status es `PENDING` — requiere revisión manual por el equipo de nómina.

---

## Modelo de datos

### Nuevos campos en `Location`

```prisma
geoLatitude         Float?
geoLongitude        Float?
checkInRadiusMeters Int?
```

### Nuevos enums

```prisma
enum MobileAttendanceEventType { ENTRY  EXIT }
enum MobileAttendanceStatus    { VALID  REJECTED  PENDING }
```

### Modelo `MobileAttendanceLog`

```prisma
model MobileAttendanceLog {
  id               String                    @id @default(cuid())
  tenantId         String
  employeeId       String                    // FK → EmployeeDetails
  locationId       String                    // FK → Location
  eventType        MobileAttendanceEventType
  status           MobileAttendanceStatus    @default(PENDING)
  timestamp        DateTime                  @default(now())
  workDate         DateTime
  clientLatitude   Float
  clientLongitude  Float
  distanceMeters   Float?
  radiusMeters     Int?                      // snapshot del radio al momento del registro
  storageObjectId  String?                   // referencia a StorageObject (sin FK Prisma)
  photoUrl         String?
  facialMatchScore  Float?
  facialMatchResult String?
  rejectionReason  String?
  notes            String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  deletedAt        DateTime?
  @@map("mobile_attendance_logs")
}
```

**Migración:** `20260630220301_add_mobile_attendance`

---

## Estructura de archivos

```
apps/api/src/attendance/
└── mobile/
    ├── interfaces/
    │   └── mobile-attendance.interfaces.ts
    ├── repository/
    │   └── mobile-attendance.repository.ts
    ├── service/
    │   ├── mobile-attendance.service.ts       (Haversine incluido)
    │   └── mobile-attendance.service.spec.ts
    └── resolver/
        └── mobile-attendance.resolver.ts
```

Registrado en `AttendanceModule` (no se crea módulo separado).

---

## Flujo storage (foto)

```
Mobile App
  │
  ├─ 1. POST /storage/upload
  │      Content-Type: multipart/form-data
  │      Authorization: Bearer <jwt>
  │      Body: file=<imagen>, domain=PAYROLL, entityType=mobile_attendance
  │      ← Response: { id, publicUrl, ... }
  │
  └─ 2. mutation registrarMarcacion {
           input: { ..., storageObjectId: "<id del paso 1>" }
         }
         ← Response: { id, status, distanceMeters, rejectionReason, timestamp }
```

---

## Seguridad

| Regla                          | Implementación                                                               |
| ------------------------------ | ---------------------------------------------------------------------------- |
| `tenantId` nunca del cliente   | Extraído del JWT via `CurrentUser` + fallback header                         |
| `employeeId` nunca del cliente | Derivado de `userId` JWT → lookup `EmployeeDetails`                          |
| Solo marcación propia          | `registrarMarcacion` sin `RolesGuard` — cualquier JWT autenticado del tenant |
| Distancia en backend           | `haversineDistanceMeters()` con coordenadas de DB, nunca del cliente         |
| Validación foto                | `storageObj.uploadedBy === userId` + `domain === PAYROLL`                    |
| Sede del tenant                | `findLocationById(id, tenantId)` — scope forzado                             |
| Consultas admin                | `PAYROLL_MODULE_ROLES` + `attendance.mobile.read`                            |
| Facial como dato de auditoría  | `facialMatchScore/Result` guardados pero nunca determinan el status          |

---

## RBAC — permisos agregados

| Código                     | ID                                     | Roles                                                     |
| -------------------------- | -------------------------------------- | --------------------------------------------------------- |
| `attendance.mobile.create` | `cccccccc-0000-0000-0000-000000000037` | OWNER, SUPER_ADMIN, SUPERVISOR, MANAGER, NOMINA, OPERATOR |
| `attendance.mobile.read`   | `cccccccc-0000-0000-0000-000000000038` | OWNER, SUPER_ADMIN, SUPERVISOR, MANAGER, NOMINA           |

**Decisión de RBAC (OS-499 follow-up):** `registrarMarcacion` no usa `RolesGuard` — cualquier JWT autenticado del tenant puede marcar. La asignación explícita de `attendance.mobile.create` a OPERATOR, SUPERVISOR, MANAGER y NOMINA en el seed permite futuros filtros por permiso sin cambiar la API pública. `OPERATIONS_ADMIN` no lo recibe (rol de gestión de planta sin presencia física en sede).

---

## API GraphQL

### `registrarMarcacion` (Mutation)

- Guard: `JwtAuthGuard`
- Input: `locationId, eventType, clientLatitude, clientLongitude, storageObjectId?, facialMatchScore?, facialMatchResult?, timestamp?, notes?`
- Returns: `{ id, status, distanceMeters, rejectionReason, timestamp, workDate }`

### `misMarcaciones` (Query)

- Guard: `JwtAuthGuard`
- Args: `cursor?, take?, dateFrom?, dateTo?`
- Returns: `MobileAttendanceConnection` (cursor pagination)
- Solo devuelve marcaciones del empleado autenticado

### `marcacionesPorSede` (Query)

- Guards: `JwtAuthGuard + RolesGuard + PermissionsGuard`
- Roles: `PAYROLL_MODULE_ROLES` + permiso `attendance.mobile.read`
- Input: `locationId, dateFrom, dateTo, status?, cursor?, take?`

### `marcacionesPorEmpleado` (Query)

- Guards: `JwtAuthGuard + RolesGuard + PermissionsGuard`
- Roles: `PAYROLL_MODULE_ROLES` + permiso `attendance.mobile.read`
- Input: `employeeId, dateFrom, dateTo, status?, cursor?, take?`

### `sedeMarcacionConfig` (Query)

- Guard: `JwtAuthGuard`
- Args: `locationId`
- Returns: `{ locationId, name, geoLatitude, geoLongitude, checkInRadiusMeters, requiresPhoto }`

---

## Datos de seed QA

> **Prerequisito:** ejecutar `pnpm prisma db seed` antes de probar NOM-05.
> No es necesario volver a hacer login — `PermissionsGuard` consulta permisos en DB en cada request.

### Sede PL-01 con geofence

| Campo                 | Valor                                                                 |
| --------------------- | --------------------------------------------------------------------- |
| `locationId`          | `{{locationId}}` (env capturado del seed — ver consola al hacer seed) |
| `geoLatitude`         | `4.6097`                                                              |
| `geoLongitude`        | `-74.0817`                                                            |
| `checkInRadiusMeters` | `100`                                                                 |

Sedes PL-02 a PL-10 **no tienen geofence** → producen `status=PENDING`.

### Empleados demo

| Usuario  | Email                            | Role     | EmployeeDetails  |
| -------- | -------------------------------- | -------- | ---------------- |
| OWNER    | `mes-owner@palos-de-lena.dev`    | OWNER    | Asociado a PL-01 |
| OPERATOR | `mes-operator@palos-de-lena.dev` | OPERATOR | Asociado a PL-01 |

Contraseña global: `TestPass123!`. Header `x-tenant-id: palos-de-lena`.

---

## Variables Postman (NOM-05)

| Variable                       | Valor por defecto | Descripción                                                                |
| ------------------------------ | ----------------- | -------------------------------------------------------------------------- |
| `locationId`                   | `<ID de PL-01>`   | Capturado del seed — usar en `registrarMarcacion` y consultas              |
| `accessToken`                  | ``                | JWT del empleado que marca (OWNER o OPERATOR)                              |
| `accessTokenOwner`             | ``                | JWT OWNER — requerido para `marcacionesPorSede` / `marcacionesPorEmpleado` |
| `accessTokenOperator`          | ``                | JWT OPERATOR — para probar caso 403                                        |
| `attendanceEmployeeId`         | ``                | `EmployeeDetails.id` capturado de NOM-03 kiosk-auth                        |
| `mobileStorageObjectId`        | ``                | ID del StorageObject de la foto — request 1                                |
| `mobileAttendanceId`           | ``                | ID del MobileAttendanceLog — request 2                                     |
| `mobileClientLatitude`         | `4.6097`          | Latitud DENTRO del radio de PL-01 → status=VALID                           |
| `mobileClientLongitude`        | `-74.0817`        | Longitud DENTRO del radio de PL-01                                         |
| `mobileClientLatitudeOutside`  | `4.7100`          | Latitud FUERA del radio (~11 km al norte) → status=REJECTED                |
| `mobileClientLongitudeOutside` | `-74.0817`        | Longitud del punto fuera del radio                                         |
| `mobileFacialMatchScore`       | `0.97`            | Score facial (0.0–1.0) — solo informativo                                  |
| `mobileFacialMatchResult`      | `match`           | Resultado facial — solo informativo                                        |

---

## Estados VALID / REJECTED / PENDING

| Status     | Condición                                                              | Qué usar en Postman                                                                                 |
| ---------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `VALID`    | La sede tiene geofence y el cliente está dentro del radio              | `{{mobileClientLatitude}}` / `{{mobileClientLongitude}}` con `{{locationId}}` (PL-01)               |
| `REJECTED` | La sede tiene geofence y el cliente está fuera del radio               | `{{mobileClientLatitudeOutside}}` / `{{mobileClientLongitudeOutside}}` con `{{locationId}}` (PL-01) |
| `PENDING`  | La sede no tiene `geoLatitude`, `geoLongitude` o `checkInRadiusMeters` | Usar `locationId` de PL-02 a PL-10                                                                  |

Las marcaciones `REJECTED` y `PENDING` **se guardan en DB** para auditoría — no se lanza excepción.

---

## Flujo QA en Postman (NOM-05)

```
1. Seed + Login
   pnpm prisma db seed
   POST /api/auth/login  email=mes-owner@palos-de-lena.dev  → accessTokenOwner
   POST /api/auth/login  email=mes-operator@palos-de-lena.dev  → accessToken

2. Foto (opcional)
   1 — Upload foto marcación  (accessToken, domain=PAYROLL)  → mobileStorageObjectId

3. ENTRY dentro del radio → VALID
   2 — registrarMarcacion (ENTRY)
   → status=VALID, distanceMeters≈0

4. EXIT dentro del radio → VALID
   3 — registrarMarcacion (EXIT)
   → status=VALID

5. ENTRY fuera del radio → REJECTED
   ❌ registrarMarcacion — fuera del radio (REJECTED)
   (lat=4.7100 lng=-74.0817 — ~11 km al norte de PL-01)
   → status=REJECTED, rejectionReason=OUTSIDE_RADIUS

6. Historial propio
   4 — misMarcaciones
   → edges con las 3 marcaciones anteriores

7. Consulta por sede con OWNER → debe funcionar
   5 — marcacionesPorSede  (accessTokenOwner)
   → 200 + edges

8. Consulta por empleado con OWNER → debe funcionar
   6 — marcacionesPorEmpleado  (accessTokenOwner, attendanceEmployeeId)
   → 200 + edges

9. Sin JWT → 401
   ❌ registrarMarcacion — sin JWT (401)
   → GraphQL UNAUTHENTICATED

10. OPERATOR en consulta admin → 403
    ❌ marcacionesPorSede — OPERATOR (permiso insuficiente)  (accessToken del OPERATOR)
    → PERMISSION_DENIED
```

---

## Root cause: permission denied con OWNER

`PermissionsGuard` consulta la DB en cada request (no el JWT). La secuencia de fallos es:

1. Se agrega `attendance.mobile.read` a `PERMISSION_SEEDS` en seed.ts.
2. Se ejecuta `pnpm prisma db seed`.
3. El rol OWNER queda asociado al permiso en `RolePermission` table.
4. **No hace falta re-login** — el guard usa `user.roleId` del JWT para buscar permisos en DB en cada llamada.

Si el seed NO fue ejecutado después del último cambio de permisos → el permiso no existe en DB → `PERMISSION_DENIED`.

**Fix:** `pnpm prisma db seed` → reintentar el request sin volver a autenticarse.

---

## QA / Postman (resumen rápido — legacy)

```
# Seed (prerequisito)
pnpm prisma db seed

# Login como OWNER (para accessTokenOwner)
POST /api/auth/login  x-tenant-id: palos-de-lena
  body: { "email": "mes-owner@palos-de-lena.dev", "password": "TestPass123!" }

# Login como OPERATOR (para accessToken)
POST /api/auth/login  x-tenant-id: palos-de-lena
  body: { "email": "mes-operator@palos-de-lena.dev", "password": "TestPass123!" }
```

---

## Riesgos y pendientes

| #   | Riesgo                                                                                                                                                                                                  | Estado                                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| 1   | Sedes existentes con datos en `latitude`/`longitude` (String) no se migran automáticamente a `geoLatitude`/`geoLongitude` — requiere script de migración de datos manual                                | Pendiente operaciones                 |
| 2   | `storageObjectId` sin FK Prisma — sin constraint de integridad en DB                                                                                                                                    | Aceptado MVP — validación en service  |
| 3   | Rol del empleado móvil: se decidió que cualquier JWT válido del tenant puede marcar. `attendance.mobile.create` asignado a OPERATOR, SUPERVISOR, MANAGER, NOMINA en seed para futura expansión de RBAC. | Resuelto OS-499 follow-up             |
| 4   | Marcaciones móviles no se integran con `payroll-calculation.service` (cálculo de nómina sigue usando `AttendanceLog` del kiosko)                                                                        | Fuera de alcance MVP                  |
| 5   | Lockout/replay: el check de timestamp de 5 min previene replay obvio, pero no hay rate limiting por empleado                                                                                            | Pendiente NOM-04 hardening            |
| 6   | `facialMatchResult` es campo libre String — la app móvil puede enviar cualquier valor                                                                                                                   | Aceptado; campo puramente informativo |
