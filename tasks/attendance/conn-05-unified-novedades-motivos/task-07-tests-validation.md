# CONN-05 Task 07 — Tests, Postman y validación final

**Domain:** `[BACKEND]` `[FRONTEND]` `[QA]`  
**Status:** `pending`  
**Depends on:** [Task 06](./task-06-web-app-wiring.md)  
**Epic:** [CONN-05](./00-epic-and-decisions.md)

---

## Goal

Cerrar criterios de aceptación del epic con tests de integración, casos de no-doble-captura y validación de pipeline local.

---

## Scope

### Tests backend (obligatorios)

| Caso                                     | Esperado                                                     |
| ---------------------------------------- | ------------------------------------------------------------ |
| `CORRECCION_MARCACION`                   | Solo `AttendanceLog`; sin `PayrollNovedad` ni `MedicalLeave` |
| `PERMISO_REMUNERADO` + marcación         | `PayrollNovedad` creada; `sourceAttendanceLogId` poblado     |
| `INCAPACIDAD_COMUN`                      | `MedicalLeave` con `origin: COMUN`                           |
| `INCAPACIDAD_LABORAL`                    | `MedicalLeave` con `origin: LABORAL`                         |
| Reason inválido                          | `400`                                                        |
| Actor sin permiso nómina + motivo nómina | `403`                                                        |
| Multi-tenant                             | Tenant A no provisiona en tenant B                           |

### Tests frontend (mínimo)

- Modal muestra catálogo unificado.
- Crear marcación con corrección no dispara mensaje de novedad provisionada.
- Crear con permiso muestra feedback de doble registro exitoso.

### Postman

Carpeta `CONN-05 Unified Novedades Motivos` en `postman/restopsiq-api.collection.json`:

- `GET manual-marking-reasons`
- `POST manual-marking` + `CORRECCION_MARCACION` (sin novedad)
- `POST manual-marking` + `PERMISO_REMUNERADO` → verificar novedad
- `POST manual-marking` + `INCAPACIDAD_COMUN` → verificar incapacidad

### Checklist epic

Marcar criterios de [00-epic](./00-epic-and-decisions.md) en PR description.

---

## Out of scope

- E2E Playwright completo (opcional).
- Migración de motivos legacy en DB.

---

## Files allowed

- `apps/api/src/attendance/test/**` — modify/create
- `apps/web-app/src/features/attendance/**/test/**` — modify
- `postman/restopsiq-api.collection.json` — modify

---

## Files forbidden

- `prisma/schema.prisma` (salvo fix crítico)
- `package.json` / `pnpm-lock.yaml`

---

## Acceptance criteria

- [ ] Todos los casos de la tabla backend cubiertos.
- [ ] `pnpm lint && pnpm typecheck && pnpm test` pasan en verde (ámbitos tocados).
- [ ] `node scripts/validate-structure.js` pasa.
- [ ] Postman folder documentado.

---

## Validation commands

```bash
pnpm lint
pnpm typecheck
pnpm --filter=api test -- manual-marking
pnpm --filter=web-app test -- AttendanceCard
node scripts/validate-structure.js
```
