# OS-589 Task 08 — API: endpoints, DTOs y módulo NestJS

**Domain:** `[BACKEND]` `[GRAPHQL]` `[REST]` `[POSTMAN]`  
**Status:** `pending`  
**Depends on:** [Task 05](./task-05-request-approval-service.md), [Task 06](./task-06-letter-pdf.md)  
**Epic:** [OS-589](./00-epic-and-decisions.md)

---

## Goal

Exponer la funcionalidad de vacaciones vía **REST y/o GraphQL** con DTOs validados, guards de autenticación/RBAC y registro del módulo `VacationsModule`.

---

## Scope

### Estructura del módulo (convención NestJS del repo)

```
apps/api/src/vacations/
├── vacations.module.ts
├── interfaces/
├── repository/
├── service/
├── controller/
│   ├── vacations.controller.ts
│   └── dto/
├── resolver/          (si el epic usa GraphQL — preferido para web-app)
│   └── vacations.resolver.ts
└── test/
```

### Endpoints REST propuestos (`/api/vacations`)

| Método | Ruta                            | Rol / permiso            | Acción                        |
| ------ | ------------------------------- | ------------------------ | ----------------------------- |
| `GET`  | `/balance/:employeeId`          | Empleado (propio) o RRHH | Consultar saldo               |
| `POST` | `/requests`                     | Empleado / RRHH          | Crear solicitud               |
| `GET`  | `/requests`                     | RRHH / Supervisor        | Listar (filtros sede, estado) |
| `POST` | `/requests/:id/approve-level-1` | Supervisor               | Primer filtro (PC-2)          |
| `POST` | `/requests/:id/approve-level-2` | **NOMINA** (RRHH)        | Segundo filtro (PC-2)         |
| `POST` | `/requests/:id/reject`          | Supervisor o L2          | Rechazar con motivo           |
| `GET`  | `/requests/:id/letter`          | Empleado / RRHH          | URL prefirmada de carta       |

### GraphQL (alternativa o complemento — alinear con web-app)

Mutations: `requestVacation`, `approveVacationLevel1`, `approveVacationLevel2`, `rejectVacation`  
Queries: `vacationBalance`, `vacationRequests`, `vacationLetterUrl`

ObjectTypes/InputTypes co-localizados en resolver (convención del repo).

### DTOs (`controller/dto/`)

- `RequestVacationDto` — `employeeId`, `startDate`, `endDate`, `type`; validación `class-validator`.
- `RejectVacationDto` — `rejectionReason` obligatorio.
- Response DTOs con saldo, solicitud, estados de aprobación, `letterStorageObjectId`.

### Seguridad

- `@UseGuards(JwtAuthGuard)` en todos los endpoints de negocio.
- `tenantId` desde `@CurrentUser()` JWT — **nunca** del body.
- Permisos por nivel de aprobación (PC-2): `vacations.approve.level1`, `vacations.approve.level2` (registrar en seed de permisos si aplica — documentar, no expandir scope de RBAC completo).
- Empleado solo puede solicitar/consultar **su** `employeeId` salvo rol RRHH.

### Módulo

- Registrar `VacationsRepository`, `VacationsService`, `VacationLetterService`, `VacationAccrualService`, processor job, controller, resolver.
- Exportar `VacationsService` para task 07 (asistencia).
- Registrar `VacationsModule` en `app.module.ts` — **esta task es la única autorizada** a modificar `app.module.ts` para vacaciones.

### Tests controller

- Controller tests con service mockeado (patrón del repo).
- Verificar que `tenantId` se pasa al service desde JWT.

### Colección Postman — carpeta `OS-589 Vacations`

Agregar en `postman/restopsiq-api.collection.json` una carpeta documentada con **todos** los endpoints REST de vacaciones y el flujo feliz end-to-end.

**Prerrequisitos** (documentar en la descripción de la carpeta):

1. **01 — Global Auth → Login** como empleado solicitante (`owner@palos-de-lena.dev` / `TestPass123!` — tiene `VacationBalance` en seed).
2. Login separado como **Supervisor** (`mes-supervisor@palos-de-lena.dev`) → capturar en `{{accessTokenSupervisor}}`.
3. Login separado como **NOMINA** (`nomina@palos-de-lena.dev`) → capturar en `{{accessTokenNomina}}`.
4. Headers en todos los requests: `Authorization: Bearer <token>`, `x-tenant-id: {{tenantId}}`.

**Requests obligatorios** (orden sugerido para flujo feliz):

```
OS-589 Vacations/
  GET   Balance — empleado propio
  POST  Request — crear solicitud DISFRUTE
  GET   Requests — listar (RRHH/Supervisor)
  POST  Approve Level 1 — Supervisor
  POST  Approve Level 2 — NOMINA (RRHH)
  GET   Letter — URL prefirmada de carta
  POST  Reject — con rejectionReason (flujo alternativo; usar request en SOLICITADA o APROBADA_NIVEL_1)
```

**Casos negativos** (mínimo 4 requests adicionales):

| Request                                        | Token                         | Esperado      |
| ---------------------------------------------- | ----------------------------- | ------------- |
| Reject sin `rejectionReason`                   | Supervisor o NOMINA           | `400`         |
| Approve Level 1 como empleado (no supervisor)  | `accessToken` del solicitante | `403`         |
| Approve Level 2 como Supervisor (no NOMINA)    | `accessTokenSupervisor`       | `403`         |
| Letter antes de estado terminal (`SOLICITADA`) | Empleado                      | `404` o `400` |

**Tests Postman** (scripts en cada request):

- Status code esperado.
- En `POST Request`: capturar `vacationRequestId` del body.
- En `GET Letter`: capturar `vacationLetterUrl` (o campo equivalente del DTO) y assert que la URL no esté vacía.
- En flujo feliz: assert `status === APROBADA` tras L2 y `letterStorageObjectId` presente.

**Variables** a agregar en `postman/local.environment.json`:

| Variable             | Descripción                                                    |
| -------------------- | -------------------------------------------------------------- |
| `vacationEmployeeId` | `employeeId` del solicitante (capturado de balance o seed)     |
| `vacationRequestId`  | ID capturado al crear solicitud                                |
| `vacationLetterUrl`  | URL prefirmada capturada de `GET .../letter`                   |
| `accessTokenNomina`  | JWT de `nomina@palos-de-lena.dev` (login manual o pre-request) |

Actualizar `postman/README.md` con sección breve **OS-589 Vacations** (orden de ejecución y usuarios seed).

---

## Out of scope

- Frontend (task 09).
- Tests E2E automatizados en Jest (task 11 — Postman cubre smoke manual aquí).
- Definición final del segundo cargo aprobador (Q1) — usar permiso placeholder.

---

## Files allowed

- `apps/api/src/vacations/**` — create/modify
- `apps/api/src/app.module.ts` — modify (import `VacationsModule`)
- `apps/api/prisma/seed.ts` — modify (solo permisos vacaciones, upsert idempotente)
- `postman/restopsiq-api.collection.json` — modify (carpeta `OS-589 Vacations`)
- `postman/local.environment.json` — modify (variables de vacaciones)
- `postman/README.md` — modify (sección OS-589)

---

## Files forbidden

- `prisma/schema.prisma`
- `prisma/migrations/**`
- `package.json` / `pnpm-lock.yaml`
- `apps/web-app/**`
- `packages/**`

---

## Acceptance criteria

- [ ] Endpoints expuestos y documentados (Swagger).
- [ ] DTOs con validación; `tenantId` nunca desde body.
- [ ] Flujo API: solicitar → aprobar L1 → aprobar L2 → descargar carta.
- [ ] `VacationsModule` registrado en `app.module.ts`.
- [ ] Controller tests pasan.
- [ ] Colección Postman: carpeta `OS-589 Vacations` con los 7 endpoints + ≥ 4 casos negativos; JSON válido.
- [ ] Variables `vacationRequestId`, `vacationLetterUrl`, `accessTokenNomina` documentadas en environment.
- [ ] `node scripts/validate-structure.js` pasa.

---

## Validation commands

```bash
pnpm --filter=api test -- vacations.controller.spec
node scripts/validate-structure.js
pnpm --filter=api typecheck

# JSON Postman
node -e "JSON.parse(require('fs').readFileSync('postman/restopsiq-api.collection.json','utf8')); console.log('Postman JSON OK')"
```
