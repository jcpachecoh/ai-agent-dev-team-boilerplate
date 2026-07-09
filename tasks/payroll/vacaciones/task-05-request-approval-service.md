# OS-589 Task 05 — Service: solicitud y doble aprobación

**Domain:** `[BACKEND]`  
**Status:** `pending`  
**Depends on:** [Task 03](./task-03-repository.md)  
**Epic:** [OS-589](./00-epic-and-decisions.md)

---

## Goal

Implementar `VacationsService` con la lógica de negocio de solicitudes, validación de saldo y **máquina de estados de doble aprobación** (PC-2).

---

## Scope

### Archivos

- `apps/api/src/vacations/service/vacations.service.ts`
- `apps/api/src/vacations/test/vacations.service.spec.ts`

### Métodos

#### `requestVacation(tenantId, actorUserId, input)`

- Validar que `actorUserId` puede solicitar para `employeeId` (empleado propio o RRHH con permiso — documentar regla MVP).
- Calcular `daysRequested` (ver Q5 del epic: MVP puede usar días calendario entre `startDate` y `endDate`; documentar en código).
- Validar `startDate <= endDate`.
- Crear solicitud con `status: SOLICITADA`.
- **No** descontar saldo hasta aprobación final.

#### `approveLevel1(tenantId, actorUserId, requestId)` — Primer filtro (Supervisor)

- Precondición: `status === SOLICITADA`.
- Validar rol **SUPERVISOR** o **MANAGER** (o permiso `vacations.approve.level1`).

**Regla de negocio — sede + jerarquía (D9 / OS-550):**

1. Cargar empleado solicitante (`EmployeeDetails`: `userId`, `locationId`, `positionId`).
2. Cargar actor aprobador (`User` + `EmployeeDetails.positionId` si existe).
3. **Sede:** el actor debe tener la sede del solicitante en sus `UserLocation` activas (`UserLocationsService.getActiveUserLocations`). Si no comparten sede → `ForbiddenException`.
4. **Jerarquía de cargo** (solo si el actor tiene `positionId`):
   - Llamar `findSubordinatePositionIds(tenantId, actor.positionId)` — BFS transitivo sobre `EmployeePositionSupervisor` (mismo algoritmo que `AttendanceCollaboratorsRepository`).
   - Si retorna ≥ 1 cargo: el `positionId` del solicitante **debe** estar en esa lista. Si no → `ForbiddenException`.
   - Si retorna 0 cargos (sin jerarquía configurada): **fallback** — aprobar solo con sede + rol (no bloquear).
5. Si el solicitante no tiene `positionId`: aprobar solo con sede + rol (no hay cargo que validar en organigrama).

- Transición → `APROBADA_NIVEL_1`; set `level1ApprovedBy`, `level1ActedAt`.
- **No** genera carta aún (carta en task 06 al estado terminal).

**Helper sugerido:** `assertSupervisorCanApproveLevel1(tenantId, actorUserId, requestEmployeeId): Promise<void>` — testeable en aislamiento.

#### `approveLevel2(tenantId, actorUserId, requestId)` — Segundo filtro (Recursos Humanos)

- Precondición: `status === APROBADA_NIVEL_1`.
- Validar rol **NOMINA** (Recursos Humanos) o permiso `vacations.approve.level2`.
- **Validar saldo** antes de aprobar (D4):
  - `daysRequested <= availableBalance` (`accruedDays - takenDays - compensatedDays`).
  - Si `type === COMPENSACION`: compensación acumulada + `daysRequested` no supera 50% del derecho total.
- Transición → `APROBADA`; set `level2ApprovedBy`, `level2ActedAt`.
- Actualizar balance: incrementar `takenDays` (DISFRUTE) o `compensatedDays` (COMPENSACION).
- Disparar generación de carta (delegar a `VacationLetterService` de task 06 vía inyección; si task 06 no está lista, stub con TODO y test con mock).

#### `reject(tenantId, actorUserId, input)`

- Permitido desde `SOLICITADA` (rechazo nivel 1) o `APROBADA_NIVEL_1` (rechazo nivel 2).
- Nivel 1: mismas reglas de autorización que `approveLevel1` (sede + jerarquía).
- Nivel 2: rol `NOMINA` / `vacations.approve.level2`.
- `rejectionReason` obligatorio (`BadRequestException` si vacío).
- Transición → `RECHAZADA`.
- Disparar carta de negación (task 06).

#### `getBalance(tenantId, employeeId)`

- Cargar `EmployeeDetails.hireDate` del empleado.
- Si no existe balance → crear en cero y llamar `VacationAccrualService.syncEmployeeBalance(tenantId, employeeId, hireDate)` para catch-up desde ingreso (D3).
- Si existe balance pero `lastAccrualDate` está **atrás** del mes anterior al actual → `syncEmployeeBalance` antes de retornar (saldo al día sin esperar al cron).
- Retorna balance actualizado.

### Excepciones NestJS

| Caso                      | Excepción             |
| ------------------------- | --------------------- |
| Solicitud no encontrada   | `NotFoundException`   |
| Transición inválida       | `BadRequestException` |
| Sin permiso de aprobación | `ForbiddenException`  |
| Saldo insuficiente        | `ConflictException`   |
| Compensación > 50%        | `ConflictException`   |

### Tests (mínimo 80% service)

- Happy path: solicitar → aprobar L1 → aprobar L2 → balance actualizado.
- **L1 — sede:** supervisor de otra sede no puede aprobar (`ForbiddenException`).
- **L1 — jerarquía:** supervisor con cargo cuyo subárbol incluye al cargo del solicitante → aprueba.
- **L1 — jerarquía:** supervisor con cargo pero solicitante fuera del subárbol → `ForbiddenException`.
- **L1 — fallback:** supervisor sin `positionId` o sin jerarquía configurada → aprueba si sede + rol OK.
- Rechazo en L1 y L2.
- No aprobar L2 si excede saldo.
- No aprobar L2 si compensación supera 50%.
- Transiciones inválidas (ej. aprobar L2 desde `SOLICITADA`).
- `getBalance` llama `syncEmployeeBalance` cuando no hay balance o `lastAccrualDate` está atrás.

---

## Out of scope

- Generación PDF real (task 06 — solo integración vía interfaz/mock).
- Endpoints HTTP/GraphQL (task 08).
- Integración asistencia (task 07).
- Integración liquidación (task 10).

---

## Files allowed

- `apps/api/src/vacations/service/vacations.service.ts` — create
- `apps/api/src/vacations/repository/vacations.repository.ts` — modify (agregar `findSubordinatePositionIds` si no está en task 03)
- `apps/api/src/vacations/test/vacations.service.spec.ts` — create
- `apps/api/src/vacations/interfaces/vacations.interfaces.ts` — modify (solo si falta tipo auxiliar)

**Dependencias de módulo (task 08):** `UserLocationsService` desde `LocationsModule` para validación de sede en L1; `VacationAccrualService` para `syncEmployeeBalance` en `getBalance`.

---

## Files forbidden

- `prisma/schema.prisma`
- `prisma/migrations/**`
- `package.json` / `pnpm-lock.yaml`
- `apps/api/src/app.module.ts`
- `apps/web-app/**`

---

## Acceptance criteria

- [ ] Máquina de estados D1 implementada (PC-2).
- [ ] **D9:** `approveLevel1` valida sede (`UserLocation`) + jerarquía de cargo (`EmployeePositionSupervisor`) con fallback documentado.
- [ ] `approveLevel2` valida solo rol `NOMINA` (sin jerarquía).
- [ ] `getBalance` sincroniza saldo desde `hireDate` si está desactualizado (D3).
- [ ] Validación de saldo solo en aprobación final (D4).
- [ ] Regla compensación ≤ 50% aplicada.
- [ ] Tests con repository mockeado; cobertura service ≥ 80%.
- [ ] `pnpm --filter=api test -- vacations.service.spec` pasa.

---

## Validation commands

```bash
pnpm --filter=api test -- vacations.service.spec --coverage
node scripts/validate-structure.js
```
