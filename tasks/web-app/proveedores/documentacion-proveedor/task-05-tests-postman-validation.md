# PROV-DOC Task 05 — Postman, smoke E2E y validación final

**Domain:** `[BACKEND]` `[QA]` `[POSTMAN]`  
**Status:** `pending`  
**Depends on:** Tasks 01–04 completadas

---

## Goal

Documentar y validar el flujo completo de documentación de proveedor en Postman, smoke E2E API y checklist de acceptance criteria de la épica.

---

## Scope

- Carpeta **PROV-DOC — Documentación proveedor** en `postman/restopsiq-api.collection.json`.
- Requests:
  1. Login (OWNER / gestor proveedores)
  2. `POST /api/storage/upload` (domain SUPPLIERS)
  3. `GET /api/suppliers/:id/documents`
  4. `POST /api/suppliers/:id/documents/RUT`
  5. `POST .../CAMARA_COMERCIO` con `issuedAt`
  6. `GET .../download`
  7. `DELETE .../RUT` (verificar versión anterior)
  8. `PUT /api/suppliers/:id` con obligatorios pendientes → 400
- Tests Postman: status codes, presencia `completeness`, headers download.
- Smoke E2E opcional en `apps/api/test/` si el repo ya tiene patrón e2e para REST.
- Checklist final epic en comentario PR.

---

## Out of scope

- Tests E2E Playwright web-app.
- Load testing.

---

## Files allowed

- `postman/restopsiq-api.collection.json`
- `apps/api/test/supplier-documents.e2e-spec.ts` (si se crea)
- `tasks/web-app/proveedores/documentacion-proveedor/00-epic-and-decisions.md` (marcar AC completados)

---

## Files forbidden

- Cambios de lógica de negocio salvo fixes de bugs encontrados en QA.
- `package.json` / `pnpm-lock.yaml`

---

## Acceptance criteria

- [ ] Colección Postman importable y ejecutable en staging/local.
- [ ] Flujo feliz RUT + Cámara de Comercio documentado.
- [ ] Casos 403 (sin permiso) y 400 (obligatorios) incluidos.
- [ ] `pnpm run validate` o equivalente del repo pasa en rama de feature.
- [ ] Todos los AC de `00-epic-and-decisions.md` verificados manualmente o automatizados.

---

## Validation commands

```bash
pnpm run typecheck
pnpm --filter=@restopsiq/api test:cov
pnpm --filter web-app test
node scripts/validate-structure.js
```
