# Task 02 — Backend REST: AttendanceModule, Kiosk Auth, Entry/Exit, Horas trabajadas

## Objetivo

Implementar `AttendanceModule` con:

1. Endpoint público de kiosko para autenticación por cédula+PIN (sin JWT, scoped por tenant+sede).
2. Endpoints REST para registro de entrada/salida.
3. Lógica de cálculo de horas trabajadas diarias y detección de horas extra.
4. Endpoints de consulta y reporte (por empleado, por sede, por fecha).

---

## Decisiones de diseño

### Auth del kiosko — No duplicar MES auth

El kiosko autentica a empleados (modelo `User + EmployeeDetails`), no a operarios de planta
(`OperationalUser`). El flujo reutiliza **el algoritmo** de MES auth, no el endpoint ni el modelo:

```
POST /api/attendance/kiosk-auth   (público, sin JWT)
  body: { cedula, pin, locationId }
  header: x-tenant-id

  1. Hash cedula con HMAC-SHA256 (mismo CEDULA_HMAC_SECRET env var)
  2. Buscar User por tenantId + cedula (campo raw cedula en User)
  3. Buscar EmployeeDetails por userId + locationId (validar que es de esa sede)
  4. bcrypt.compare(pin, employeeDetails.pinHash)
  5. Retornar: { userId, nombre, locationId, shift? }   — sin emitir JWT
```

El kiosko retiene este `userId` en estado local para registrar ENTRY/EXIT en la misma sesión.
No se emite token — la sesión del kiosko es efímera y de corta duración (tiempo entre
que el empleado ingresa la cédula y el servidor registra el evento).

### Por qué no emitir JWT

- El kiosko es un dispositivo compartido — un JWT de empleado en el cliente sería riesgo de seguridad.
- El flujo es: autenticar → registrar evento → limpiar — todo en segundos.
- Si en el futuro se requiere sesión de kiosko más larga, se puede emitir un token de corta vida (Task 04).

### Cálculo de horas trabajadas

```
Para un userId + workDate:
  - Obtener todos los AttendanceLog del día ordenados por timestamp
  - Aparear ENTRY → EXIT (primera entrada con primera salida, etc.)
  - Si hay ENTRY sin EXIT: horas = tiempo desde ENTRY hasta ahora (turno abierto)
  - totalMinutos = suma de todos los pares
  - overtimeMinutes = max(0, totalMinutos - 480)   // 480 min = 8 horas
  - isOvertimeNocturno = si algún par cruza las 21:00 hora Colombia
```

**Gap explícito — festivos:** No existe calendario de festivos en el sistema.
El recargo diferencial por trabajo en festivo (75% diurno, 150% nocturno según Código Sustantivo
del Trabajo colombiano) queda fuera del scope de esta task. Se calcula solo el tiempo total
y se marca `overtimeMinutes`. La multiplicación de la tarifa queda para NOM-04 o un microservicio
de liquidación.

---

## Scope

### Estructura de módulo

```
apps/api/src/attendance/
  attendance.module.ts
  attendance.constants.ts          ← REGULAR_DAY_MINUTES = 480, NOCTURNO_HOUR = 21
  interfaces/
    attendance.interfaces.ts
  controller/
    attendance.controller.ts
    dto/
      kiosk-auth.dto.ts
      register-event.dto.ts
      list-attendance-query.dto.ts
      attendance-summary.response.ts
  service/
    attendance.service.ts          ← lógica de negocio + cálculo horas
  repository/
    attendance.repository.ts       ← queries Prisma
  test/                            ← vacío, poblado en Task 03
```

### Endpoints

| Método | Path                                   | Auth                  | Descripción                                             |
| ------ | -------------------------------------- | --------------------- | ------------------------------------------------------- |
| `POST` | `/api/attendance/kiosk-auth`           | Público (`@Public()`) | Valida cédula+PIN, retorna userId+nombre                |
| `POST` | `/api/attendance/entry`                | Público (kiosko)      | Registra ENTRY para userId+locationId                   |
| `POST` | `/api/attendance/exit`                 | Público (kiosko)      | Registra EXIT — requiere ENTRY abierto en el día        |
| `GET`  | `/api/attendance`                      | JWT (`JwtAuthGuard`)  | Lista logs filtrados (userId, locationId, fecha, shift) |
| `GET`  | `/api/attendance/summary/:userId`      | JWT                   | Resumen diario/semanal: horas totales + overtime        |
| `GET`  | `/api/attendance/location/:locationId` | JWT                   | Vista de sede: quién está actualmente en la sede        |

### Validaciones de negocio en `AttendanceService`

1. **Double-entry guard:** No registrar ENTRY si ya hay un ENTRY abierto (sin EXIT) para ese userId en ese workDate.
2. **Exit sin entry:** Rechazar EXIT si no hay ENTRY abierto — `BadRequestException`.
3. **Location scope:** userId debe tener `EmployeeDetails.locationId === locationId` del evento. Un empleado no puede registrar asistencia en una sede que no es la suya (salvo override de supervisor — fuera de scope).
4. **workDate normalization:** `workDate = startOfDay(timestamp, 'America/Bogota')`. No usar UTC para evitar desfase a medianoche.
5. **Turno nocturno:** Si ENTRY es en día D después de las 22:00, workDate sigue siendo día D. EXIT en día D+1 (antes de las 06:00) mantiene la asociación al día D por el ENTRY.
6. **PIN no configurado:** Si `EmployeeDetails.pinHash` es null, retornar `UnprocessableEntityException('PIN no configurado para este empleado')`.
7. **Lockout de kiosko:** Después de 3 intentos fallidos de PIN para un userId, bloquear por 15 minutos. Usar misma lógica que `MesAuthService` (`loginAttempts` en EmployeeDetails o en memoria — ver riesgos).

### `attendance.constants.ts`

```typescript
export const REGULAR_DAY_MINUTES = 480; // 8 horas
export const NOCTURNO_START_HOUR = 21; // 21:00 Colombia
export const NOCTURNO_END_HOUR = 6; // 06:00 Colombia
export const KIOSK_MAX_ATTEMPTS = 3;
export const KIOSK_LOCK_DURATION_MS = 15 * 60 * 1000;
export const COLOMBIA_TZ = 'America/Bogota';
```

---

## Archivos permitidos

```
apps/api/src/attendance/**            ← módulo completo nuevo
apps/api/src/app.module.ts            ← registro de AttendanceModule
apps/api/prisma/seed.ts               ← seed fixture AttendanceLog (opcional, para e2e)
```

## Archivos prohibidos

```
apps/api/prisma/schema.prisma         ← schema cerrado (Task 01 ya terminó)
apps/api/prisma/migrations/           ← sin migraciones nuevas
apps/api/src/payroll/**               ← no modificar payroll
apps/api/src/mes/**                   ← no modificar MES auth
apps/web-app/**                       ← frontend bloqueado
apps/web/**                           ← frontend bloqueado
apps/plant/**                         ← frontend bloqueado
package.json / pnpm-lock.yaml         ← no tocar dependencias
```

---

## Criterios de aceptación

1. `POST /api/attendance/kiosk-auth` retorna 200 con `{ userId, fullName, locationId }` para cédula+PIN válidos.
2. `POST /api/attendance/kiosk-auth` retorna 401 para PIN incorrecto y 422 si `pinHash` es null.
3. `POST /api/attendance/entry` crea `AttendanceLog` con `eventType: ENTRY` y workDate normalizado a Colombia.
4. `POST /api/attendance/entry` retorna 409 si ya existe ENTRY abierto.
5. `POST /api/attendance/exit` crea `AttendanceLog` con `eventType: EXIT` y retorna resumen del día (horas trabajadas, overtimeMinutes).
6. `POST /api/attendance/exit` retorna 400 si no hay ENTRY abierto.
7. `GET /api/attendance/summary/:userId` retorna pares ENTRY-EXIT con `totalMinutes` y `overtimeMinutes` por día.
8. `GET /api/attendance/location/:locationId` retorna empleados con ENTRY abierto en ese momento.
9. `pnpm run typecheck` pasa sin errores en `apps/api/`.
10. `validate-structure.js` pasa (módulo tiene interfaces, service, repository, controller).

---

## Validaciones

```bash
pnpm --filter=@restopsiq/api run typecheck
node scripts/validate-structure.js
# Unit tests en Task 03
```

---

## Riesgos / Gaps

| Riesgo                                                                              | Impacto | Estrategia                                                                                                                |
| ----------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Lockout de kiosko sin Redis:** bloqueo de intentos PIN requiere estado persistido | Medio   | Persistir `loginAttempts` y `lockedUntil` en `EmployeeDetails` (mismo patrón que `OperationalUser` en schema) — sin Redis |
| **Turnos nocturnos cross-midnight:** EXIT puede llegar el día siguiente             | Alto    | `workDate` del EXIT se asocia al ENTRY abierto (buscar por userId + workDate del ENTRY, no del EXIT)                      |
| **Múltiples jornadas en un día:** salida a almorzar + reingreso                     | Medio   | Soportado — los pares ENTRY/EXIT se acumulan. El summary suma todos los pares del día                                     |
| **Festivos colombianos:** sin catálogo, no se puede calcular recargo                | Alto    | `overtimeMinutes` se calcula siempre como tiempo > 8h. Recargo diferencial = gap explícito para NOM-04                    |
| **Zona horaria en el servidor:** el servidor puede correr en UTC                    | Alto    | Usar `Intl` o `date-fns-tz` para conversión — verificar que no requiere nuevo package (date-fns ya puede estar)           |
| **Sincronización offline:** si el kiosko pierde conexión el evento se pierde        | Alto    | Task 04 (UI) resuelve offline queue — el backend no necesita cambios; debe ser idempotente con `idempotencyKey` en el DTO |
| **QR como método alternativo de autenticación:** no implementar aquí                | —       | Explícitamente fuera de scope, reservado para Task 04                                                                     |
