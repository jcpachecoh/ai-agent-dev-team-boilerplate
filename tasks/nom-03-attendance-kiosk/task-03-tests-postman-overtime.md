# Task 03 — Tests, Postman & Validaciones legales Colombia

## Objetivo

Garantizar cobertura ≥ 80% en `AttendanceService` y `AttendanceRepository`, un flujo e2e completo
del ciclo entrada/salida, y una colección Postman `NOM-03 Attendance` con todos los endpoints.
Validar los casos borde legales colombianos: jornada máxima, horas extra diurnas y nocturnas.

---

## Scope

### Unit tests — `attendance.service.spec.ts`

Cubrir mínimo los siguientes casos:

**kiosk-auth:**

- ✅ Autenticación exitosa retorna `{ userId, fullName, locationId }`
- ✅ PIN incorrecto → `UnauthorizedException`
- ✅ `pinHash null` → `UnprocessableEntityException`
- ✅ Empleado no encontrado → `NotFoundException`
- ✅ Empleado de otra sede → `ForbiddenException`
- ✅ Lockout tras 3 intentos fallidos → `ForbiddenException` con tiempo restante

**registerEntry:**

- ✅ Primer ENTRY del día — crea `AttendanceLog` correctamente
- ✅ workDate normalizado a `America/Bogota` (no UTC)
- ✅ Double-entry guard: ENTRY cuando ya hay ENTRY abierto → `ConflictException`
- ✅ ENTRY después de un EXIT completo en el mismo día (segunda jornada) — permitido

**registerExit:**

- ✅ EXIT válido — retorna summary con `totalMinutes` y `overtimeMinutes = 0` (< 8h)
- ✅ EXIT con overtime — `totalMinutes > 480` y `overtimeMinutes > 0`
- ✅ EXIT sin ENTRY previo → `BadRequestException`
- ✅ EXIT nocturno (par cruza medianoche) — `workDate` asociado al día del ENTRY

**calculateDailySummary:**

- ✅ Jornada de 8h exactas — `overtimeMinutes = 0`
- ✅ Jornada de 10h — `overtimeMinutes = 120`
- ✅ Múltiples pares en el día (almuerzo) — totalMinutos sumados correctamente
- ✅ ENTRY sin EXIT (turno abierto) — summary refleja minutos desde ENTRY hasta now()
- ✅ Jornada nocturna detectada (`isOvertimeNocturno = true` cuando par cruza las 21:00)

**listForLocation:**

- ✅ Retorna solo empleados con ENTRY abierto en esa locationId + fecha

### Unit tests — `attendance.repository.spec.ts`

- ✅ `findOpenEntry` retorna el ENTRY más reciente sin EXIT para (userId, workDate)
- ✅ `findAllForDay` retorna logs del día ordenados por timestamp ASC
- ✅ `create` persiste correctamente todos los campos incluyendo workDate

### E2E test — `attendance.e2e-spec.ts`

Flujo completo usando seed data (usuario `mes-operator@palos-de-lena.dev` o empleado del seed):

```
1. POST /api/attendance/kiosk-auth
   → body: { cedula: '87654321', pin: '...', locationId: '<seed-location-id>' }
   → expect 200 con userId

2. POST /api/attendance/entry
   → body: { userId, locationId }
   → expect 201, AttendanceLog creado

3. GET /api/attendance/location/:locationId  (con JWT de owner)
   → expect 200, array contiene userId recién registrado

4. POST /api/attendance/exit
   → body: { userId, locationId }
   → expect 200, summary con totalMinutes > 0

5. GET /api/attendance/summary/:userId  (con JWT de owner)
   → expect 200, workDate del día, totalMinutes > 0, overtimeMinutes ≥ 0

6. POST /api/attendance/entry  (double-entry)
   → expect 409 ConflictException

7. POST /api/attendance/exit  (sin ENTRY abierto)
   → expect 400 BadRequestException
```

**Prerequisito e2e:** El seed debe setear `pinHash` en `EmployeeDetails` del operador.
Agregar en `apps/api/prisma/seed.ts` al upsert de `employeeDetails` del operador:

```typescript
pinHash: await bcrypt.hash('4321', 12),  // mismo PIN que OperationalUser del seed
```

### Validaciones legales Colombia a documentar en tests

| Regla legal                                  | Art. / Norma  | Cómo se valida en tests                                                  |
| -------------------------------------------- | ------------- | ------------------------------------------------------------------------ |
| Jornada ordinaria máxima: 46h/semana en 2025 | Ley 2101/2021 | `overtimeMinutes` = tiempo > 8h/día. Warning semanal si suma > 2.760 min |
| Hora extra diurna: recargo 25%               | CST Art. 168  | `isOvertimeNocturno = false` cuando el overtime ocurre entre 06:00–21:00 |
| Hora extra nocturna: recargo 75%             | CST Art. 168  | `isOvertimeNocturno = true` cuando overtime ocurre después de las 21:00  |
| Trabajo en festivo: recargo 75%/150%         | CST Art. 179  | **Gap explícito** — no implementar. Test documenta el gap con `it.todo`  |
| Descanso mínimo entre jornadas: 8h           | CST Art. 161  | Warning (no error) si ENTRY nuevo es < 8h después del EXIT anterior      |

> **Nota sobre festivos:** No existe catálogo de festivos colombianos en el sistema.
> Los tests que cubren festivos deben marcarse con `it.todo('festivo: recargo 75% — pendiente NOM-04 o microservicio de calendario')`.
> No implementar ni hardcodear fechas de festivos.

### Colección Postman — carpeta `NOM-03 Attendance`

Agregar en `postman/restopsiq-api.collection.json`:

```
NOM-03 Attendance/
  POST  Kiosk Auth (cédula+PIN)
  POST  Register Entry
  POST  Register Exit
  GET   List Attendance Logs
  GET   Daily Summary by Employee
  GET   Active employees at Location
```

Variables a agregar en `local.environment.json`:

- `attendanceUserId` — capturado del response de Kiosk Auth
- `attendanceLocationId` — seedLocationId reutilizable
- `attendanceWorkDate` — fecha del día (ISO)

---

## Archivos permitidos

```
apps/api/src/attendance/test/attendance.service.spec.ts    ← nuevo
apps/api/src/attendance/test/attendance.repository.spec.ts ← nuevo
apps/api/src/attendance/test/attendance.e2e-spec.ts        ← nuevo (en src/attendance/test/)
apps/api/prisma/seed.ts                                    ← agregar pinHash al empleado seed
postman/restopsiq-api.collection.json                      ← carpeta NOM-03
postman/local.environment.json                             ← variables de asistencia
```

## Archivos prohibidos

```
apps/api/prisma/schema.prisma         ← schema cerrado desde Task 01
apps/api/prisma/migrations/           ← sin migraciones nuevas
apps/api/src/payroll/**               ← no modificar
apps/api/src/mes/**                   ← no modificar
apps/web-app/**                       ← frontend bloqueado
apps/web/**                           ← frontend bloqueado
apps/plant/**                         ← frontend bloqueado
package.json / pnpm-lock.yaml         ← sin dependencias nuevas
```

---

## Criterios de aceptación

1. `pnpm --filter=@restopsiq/api run test:cov` reporta ≥ 80% en `src/attendance/`.
2. Todos los unit tests de `AttendanceService` pasan (mínimo 14 casos listados arriba).
3. E2E `attendance.e2e-spec.ts` pasa completo con seed data (flujo de 7 pasos).
4. Los `it.todo` para festivos están presentes y documentados.
5. Colección Postman válida (JSON parseable) con los 6 requests de `NOM-03 Attendance`.
6. `pnpm --filter=@restopsiq/api run typecheck` pasa sin errores.
7. `validate-structure.js` pasa (18 → 19 módulos: se agrega `attendance`).

---

## Validaciones

```bash
# Unit tests con coverage
pnpm --filter=@restopsiq/api run test:cov -- --testPathPattern='attendance'

# E2E (requiere DB local con seed)
npx jest --config apps/api/jest.e2e.config.js --testPathPattern='attendance.e2e'

# Typecheck
pnpm --filter=@restopsiq/api run typecheck

# Structure validator
node scripts/validate-structure.js

# JSON Postman
python3 -c "import json; json.load(open('postman/restopsiq-api.collection.json')); print('OK')"
```

---

## Riesgos / Gaps

| Riesgo                                                                                   | Impacto | Estrategia                                                                                            |
| ---------------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------- |
| **E2E depende de `pinHash` en seed:** si seed no lo incluye, kiosk-auth falla            | Alto    | Seed debe actualizarse en esta task antes de correr e2e                                               |
| **Festivos hardcodeados:** tentación de hardcodear fechas para tests                     | Medio   | Prohibido. Los tests de festivos van como `it.todo`                                                   |
| **Coverage < 80%:** si casos borde de timezone no se testean bien                        | Medio   | Mockear `Date.now()` y `new Date()` explícitamente en unit tests para fechas controladas              |
| **CI sin seed step:** `quality-gates.yml` no tiene seed antes de e2e (ver nota NOM-02)   | Alto    | Documentar en PR: quien tenga permisos de workflow debe añadir el seed step                           |
| **Ley 2101/2021 en transición:** jornada máxima baja de 48h a 46h en 2025, a 44h en 2026 | Medio   | Usar constante `MAX_WEEKLY_MINUTES` en `attendance.constants.ts`, no hardcodear 480 en lógica semanal |
