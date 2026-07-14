# OS-589 Task 12 — Web Mi perfil: reglas de solicitud de vacaciones

**Domain:** `[WEB]` `[BACKEND]`  
**Status:** `pending`  
**Depends on:** [Task 05](./task-05-request-approval-service.md), [Task 08](./task-08-api-endpoints-dtos.md), [Task 09](./task-09-my-profile-vacations-tab.md)  
**Epic:** [OS-589 / NOM-10](./00-epic-and-decisions.md)  
**App móvil (OS-555):** otro repositorio — solo handoff al final

---

## Historia de usuario

**Como** empleado,  
**quiero** solicitar mis vacaciones desde **Mi perfil (web)** viendo mi saldo disponible,  
**para** no depender de pedirlo por fuera del sistema.

---

## Goal

Alinear **Mi perfil → Vacaciones** (web) y `VacationsService.requestVacation` con las reglas de producto confirmadas:

- Antelación mínima **15 días** (`America/Bogota`).
- Conteo de `daysRequested` en **días hábiles** (lun–vie; sin festivos en MVP).

La UI de captura ya existe (task 09); esta task ajusta validación, preview y backend.

---

## Reglas de negocio

| #   | Regla                                                                | Dónde            |
| --- | -------------------------------------------------------------------- | ---------------- |
| R1  | Fecha de inicio ≥ hoy + 15 días (`America/Bogota`)                   | BE + modal web   |
| R2  | `daysRequested` = lun–vie en el rango; sáb/dom excluidos             | BE + preview web |
| R3  | Bloqueo de marcación = rango calendario completo al aprobar DISFRUTE | Ya en D6/task 07 |
| R4  | Festivos colombianos fuera de alcance                                | —                |

---

## Scope — Backend

### `VacationsService.requestVacation`

1. Validar antelación 15 días → `BadRequestException`.
2. Reemplazar días calendario por `calculateBusinessDaysInRange`.
3. Rechazar rango solo fin de semana (`daysRequested === 0`).

### Archivos permitidos (BE)

- `apps/api/src/vacations/service/vacations.service.ts`
- `apps/api/src/vacations/utils/vacation-business-days.utils.ts` — create
- `apps/api/src/vacations/resolver/vacations.resolver.ts` — create
- `apps/api/src/vacations/test/vacations.service.spec.ts`
- `apps/api/src/vacations/test/vacation-business-days.utils.spec.ts` — create
- `apps/api/src/vacations/test/vacations.resolver.spec.ts` — create

---

## Scope — Web (Mi perfil)

### `VacationRequestModal`

- `min` en fecha de inicio = hoy + 15 (Bogotá).
- Preview: “X días hábiles (no incluye sábados ni domingos)”.
- Validación zod: antelación + al menos un día hábil.

### Archivos permitidos (web)

- `apps/web-app/src/features/my-profile/components/VacationRequestModal.tsx`
- `apps/web-app/src/features/my-profile/components/VacationRequestModal.test.tsx`
- `apps/web-app/src/features/payroll/utils/vacation-display.utils.ts`
- `apps/web-app/src/features/payroll/utils/vacation-display.utils.test.ts`

---

## Out of scope

- Implementación en repo OS-555 (app móvil).
- Bandeja de aprobación (ya en `/payroll/vacations`).
- Festivos colombianos.
- `prisma/schema.prisma`, migraciones.
- `package.json`, `pnpm-lock.yaml`, `packages/**`.

---

## Files forbidden

- `prisma/schema.prisma`, migraciones
- `package.json`, `pnpm-lock.yaml`
- `packages/**`

---

## Criterios de aceptación

- [ ] No se puede enviar solicitud con inicio &lt; hoy + 15 días (BE + web).
- [ ] `daysRequested` = días lun–vie del rango.
- [ ] Preview web muestra días hábiles, no calendario.
- [ ] Flujo NOM-10 sin cambios (L1 → L2, carta, bloqueo calendario).
- [ ] Tests unitarios BE y web para antelación y conteo hábil.

---

## Validation commands

```bash
pnpm --filter api test -- vacations.service
pnpm --filter api test -- vacation-business-days
pnpm --filter api test -- vacations.resolver
pnpm --filter web-app test -- VacationRequestModal
pnpm --filter web-app test -- vacation-display.utils
node scripts/validate-structure.js
```

---

## Handoff OS-555 (app móvil, otro repo)

Consumir la misma API que web Mi perfil. **GraphQL disponible** (preferido para app móvil).

### GraphQL (empleado)

```graphql
query MyVacationBalance {
  myVacationBalance {
    accruedDays
    takenDays
    compensatedDays
    availableDays
    lastAccrualDate
  }
}

query MyVacationRequests($take: Int) {
  myVacationRequests(take: $take) {
    id
    startDate
    endDate
    daysRequested
    type
    status
    rejectionReason
    createdAt
  }
}

mutation MyRequestVacation($input: MyRequestVacationInput!) {
  myRequestVacation(input: $input) {
    id
    status
    daysRequested
    startDate
    endDate
  }
}

query VacationLetterUrl($requestId: ID!) {
  vacationLetterUrl(requestId: $requestId) {
    url
  }
}
```

`myRequestVacation` no requiere `employeeId` — el backend lo resuelve del JWT.

### REST (alternativa)

| Acción    | REST                                     |
| --------- | ---------------------------------------- |
| Saldo     | `GET /api/vacations/me/balance`          |
| Crear     | `POST /api/vacations/requests`           |
| Historial | `GET /api/vacations/me/requests`         |
| Carta     | `GET /api/vacations/requests/:id/letter` |

Reglas R1/R2 aplican en backend; el calendario móvil es UX, no fuente de verdad.
