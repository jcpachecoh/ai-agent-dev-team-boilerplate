# NOM-08 Task 02 — Backend REST: módulo Turnos

**Domain:** `[BACKEND]` `[ATTENDANCE]` `[RBAC]` `[AUDIT]`  
**Status:** `pending`  
**Depends on:** [task-01-schema-migration.md](./task-01-schema-migration.md)

---

## Goal

Implementar `TurnosModule` con endpoints REST para listar, crear, editar, cambiar estado y exportar turnos; validaciones, RBAC y `AuditLog` transaccional.

---

## Scope

### Estructura de módulo

```
apps/api/src/turnos/
  turnos.module.ts
  interfaces/
    turnos.interfaces.ts
  repository/
    turnos.repository.ts
  service/
    turnos.service.ts
    turnos-excel.service.ts
  controller/
    turnos.controller.ts
    dto/
      list-turnos-query.dto.ts
      create-turno.dto.ts
      update-turno.dto.ts
      patch-turno-estado.dto.ts
      turno-response.dto.ts
      turnos-list-response.dto.ts
  test/
    turnos.service.spec.ts
    turnos.controller.spec.ts
    turnos.e2e-spec.ts          ← opcional si el repo prefiere e2e en apps/api/test/
```

### Endpoints

| Método  | Ruta                     | Auth / RBAC                                                  | Descripción                     |
| ------- | ------------------------ | ------------------------------------------------------------ | ------------------------------- |
| `GET`   | `/api/turnos`            | JWT + `attendance.turnos.read` (`SUPER_ADMIN`, `SUPERVISOR`) | Listado paginado con filtros    |
| `POST`  | `/api/turnos`            | JWT + `attendance.turnos.write` (`SUPER_ADMIN` only)         | Crear turno                     |
| `PUT`   | `/api/turnos/:id`        | JWT + `attendance.turnos.write`                              | Editar turno                    |
| `PATCH` | `/api/turnos/:id/estado` | JWT + `attendance.turnos.write`                              | Activar / desactivar            |
| `GET`   | `/api/turnos/exportar`   | JWT + `attendance.turnos.read`                               | Export Excel (`?formato=excel`) |

Prefijo global `api` ya configurado en `main.ts` — controller usa `@Controller('turnos')`.

---

## GET — Listado (`/api/turnos`)

### Query params

| Param     | Tipo           | Descripción                                           |
| --------- | -------------- | ----------------------------------------------------- |
| `estado`  | `boolean`      | Filtrar activos/inactivos                             |
| `search`  | `string`       | OR sobre `nombre`, `sigla`, `tipo` (case-insensitive) |
| `nombre`  | `string`       | Filtro columna (AND)                                  |
| `sigla`   | `string`       | Filtro columna (AND)                                  |
| `tipo`    | `TurnoTipo`    | Filtro columna (AND)                                  |
| `jornada` | `TurnoJornada` | Filtro columna (AND)                                  |
| `page`    | `number`       | Default `1`, min `1`                                  |
| `limit`   | `number`       | Default `20`, max `200`                               |

### Respuesta `200`

```json
{
  "data": [
    {
      "id": "clx...",
      "nombre": "Turno mañana",
      "sigla": "TM",
      "tipo": "PERMANENTE",
      "jornada": "DIURNO",
      "horaInicio": "06:00",
      "horaFin": "14:00",
      "estado": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### Reglas de filtrado

- `search` → `OR` entre campos mencionados.
- Filtros de columna + `estado` → `AND` entre sí.
- Siempre `where: { tenantId }`.
- Orden sugerido: `nombre asc`.

---

## POST — Crear (`/api/turnos`)

### Body

```json
{
  "nombre": "Turno mañana",
  "sigla": "TM",
  "tipo": "PERMANENTE",
  "jornada": "DIURNO",
  "horaInicio": "06:00",
  "horaFin": "14:00"
}
```

### Validaciones → excepciones

| Condición                                 | HTTP  |
| ----------------------------------------- | ----- |
| Campos obligatorios faltantes o inválidos | `400` |
| `tipo` / `jornada` fuera de enum          | `400` |
| `sigla.length > 30`                       | `400` |
| `horaInicio` o `horaFin` formato inválido | `400` |
| `horaInicio === horaFin`                  | `400` |
| `sigla` duplicada en tenant               | `409` |

### Éxito

- `201 Created` + body del turno creado (incluye `id`).
- `AuditLog`: `action: CREATE`, `entityType: 'Turno'`, `newValue` con snapshot del registro.
- `createdByUserId` / `updatedByUserId` = `actorUserId` del JWT.

---

## PUT — Editar (`/api/turnos/:id`)

### Validaciones

| Condición                                | HTTP  |
| ---------------------------------------- | ----- |
| Turno no existe en tenant                | `404` |
| `sigla` duplicada (excluyendo el actual) | `409` |
| Mismas validaciones de campos que POST   | `400` |

### AuditLog

- Solo incluir en `oldValue` / `newValue` las claves que cambiaron.
- Si ningún campo cambió → `200` sin escribir audit (o audit vacío — preferir no escribir).

---

## PATCH — Estado (`/api/turnos/:id/estado`)

### Body

```json
{ "estado": false }
```

### Validaciones

| Condición                                          | HTTP                         |
| -------------------------------------------------- | ---------------------------- |
| Turno no existe                                    | `404`                        |
| `estado: false` y `count(assignments futuras) > 0` | `409` + `affectedCount`      |
| Toggle a mismo valor                               | `200` idempotente, sin audit |

### AuditLog (solo si cambia)

```json
{
  "oldValue": { "estado": true },
  "newValue": { "estado": false }
}
```

---

## GET — Exportar (`/api/turnos/exportar`)

- Query: `formato=excel` (requerido; otro valor → `400`).
- Reutilizar **mismos filtros** que listado (sin `page`/`limit` — exporta todo el conjunto filtrado).
- Columnas: Nombre, Sigla, Tipo, Jornada, Hora Inicio, Hora Fin, Estado.
- Encabezado: bold + fondo (patrón `ReportExcelService`).
- `0` registros → `204 No Content`.
- `AuditLog`: `action: EXPORT`, `entityType: 'Turno'`, `payload: { filters, rowCount }`.

---

## RBAC

```typescript
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Permissions('attendance.turnos.read')   // GET listado, GET exportar
@Permissions('attendance.turnos.write')  // POST, PUT, PATCH
```

- `SUPERVISOR` con permiso read → `403` en POST/PUT/PATCH.
- Token ausente o inválido → `401`.
- Extraer `tenantId` y `userId` de `@CurrentUser()` — **nunca** del body.

Constantes sugeridas en `turnos.constants.ts`:

```typescript
export const TURNOS_READ_PERMISSIONS = ['attendance.turnos.read'] as const;
export const TURNOS_WRITE_PERMISSIONS = ['attendance.turnos.write'] as const;
```

---

## AuditLog transaccional (AC 8)

En `TurnosRepository` (o service), patrón:

```typescript
return this.prisma.$transaction(async (tx) => {
  const turno = await tx.turno.create({ ... });
  await tx.auditLog.create({
    data: {
      tenantId,
      action: AuditAction.CREATE,
      entityType: 'Turno',
      entityId: turno.id,
      actorUserId,
      newValue: toAuditJson(turno),
    },
  });
  return turno;
});
```

- PUT y PATCH: mismo patrón con `oldValue`/`newValue` parciales.
- Si `auditLog.create` lanza → toda la transacción revierte.

---

## Capas — responsabilidades

| Capa                 | Responsabilidad                                           |
| -------------------- | --------------------------------------------------------- |
| `TurnosController`   | HTTP, guards, DTO binding, status codes, headers export   |
| `TurnosService`      | Reglas de negocio, excepciones NestJS, orquestación audit |
| `TurnosRepository`   | Prisma queries, transacciones, conteo asignaciones        |
| `TurnosExcelService` | Generación buffer xlsx                                    |

Repository **no** lanza HTTP exceptions.

---

## Files allowed

- `apps/api/src/turnos/**` (create)
- `apps/api/src/app.module.ts` (import `TurnosModule`)
- `apps/api/test/turnos.e2e-spec.ts` (opcional, si e2e va fuera del módulo)

---

## Files forbidden

- `apps/api/prisma/schema.prisma` (Task 01)
- `apps/api/prisma/migrations/**`
- `apps/web-app/**`
- `packages/**`
- `package.json` / `pnpm-lock.yaml`

---

## Acceptance criteria

### AC 1 — GET listado

- [ ] Respuesta `{ data, pagination }` con `total`, `page`, `limit`, `totalPages`.
- [ ] `search` OR; filtros columna + `estado` AND.
- [ ] Performance: query con índices; test con 200 registros mock < 500 ms (unit/integration).

### AC 2 — POST crear

- [ ] `400` campos obligatorios / horas iguales / enum inválido.
- [ ] `409` sigla duplicada.
- [ ] `201` + `id` generado + audit CREATE.

### AC 3 — PUT editar

- [ ] `404` inexistente.
- [ ] `409` sigla duplicada.
- [ ] Audit solo campos modificados.
- [ ] `200` éxito.

### AC 4 — PATCH estado

- [ ] `404` inexistente.
- [ ] `409` con `affectedCount` si asignaciones futuras al desactivar.
- [ ] Audit `estado` anterior/nuevo.

### AC 5 — Exportar

- [ ] `Content-Type` xlsx correcto.
- [ ] Encabezado bold + fondo.
- [ ] Mismos filtros que listado.
- [ ] `204` sin registros.

### AC 6 — RBAC

- [ ] `403` Supervisor en POST/PUT/PATCH.
- [ ] `401` token inválido.
- [ ] GET accesible para `SUPER_ADMIN` y `SUPERVISOR`.

### AC 7 — Validaciones generales

- [ ] Enums, sigla máx 30, HH:mm en DTO + service.

### AC 8 — Audit transaccional

- [ ] Test: si `auditLog.create` falla, turno no persiste.

---

## Tests requeridos

### `turnos.service.spec.ts` (mínimo)

- Listado filtra por `tenantId`.
- POST happy path + 409 sigla + 400 horas iguales.
- PUT 404 + audit parcial.
- PATCH 409 con `affectedCount` mockeado.
- Export delega a excel service.

### `turnos.controller.spec.ts` (mínimo)

- Mock service; verifica guards y delegación.
- Export retorna headers correctos.

### Transacción audit (service o repository)

- Mock `tx.auditLog.create` rechazando → assert turno no creado.

---

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=turnos
pnpm lint
```

---

## Notes

- Swagger: tag `turnos`.
- Mapear campos API snake_case solo si el resto del módulo attendance lo usa; de lo contrario camelCase en JSON (convención NestJS del repo).
- `exceljs` ya está en dependencias — no instalar en esta task.
- No implementar frontend ni CRUD de `TurnoAssignment` más allá del conteo para desactivar.
