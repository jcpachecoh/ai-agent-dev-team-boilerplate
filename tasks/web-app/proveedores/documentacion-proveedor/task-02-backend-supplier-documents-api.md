# PROV-DOC Task 02 — Backend API documentación proveedor

**Domain:** `[BACKEND]` `[REST]` `[STORAGE]` `[RBAC]` `[AUDIT]`  
**Status:** `pending`  
**Depends on:** [task-01-schema-migration.md](./task-01-schema-migration.md)

---

## Goal

Implementar módulo NestJS `supplier-documents` con endpoints REST para listar, cargar metadata, reemplazar, eliminar y descargar documentos del proveedor, integrando `StorageModule`, versionado y `AuditLog`.

---

## Scope

- Crear `apps/api/src/supplier-documents/` con estructura estándar (interfaces, repository, service, controller, dto, test).
- Registrar `SupplierDocumentsModule` en `apps/api/src/app.module.ts`.
- Endpoints bajo `/api/suppliers/:supplierId/documents`.
- Validación MIME: `application/pdf`, `image/jpeg`, `image/png`.
- Validación tamaño máx. **5 MB** (alineado a storage upload).
- Descarga vía URL firmada (`visibility=PRIVATE`).
- RBAC: `@Permissions('suppliers.documents.read')` / `write`.
- Tests unitarios service + repository (cobertura ≥ 80% branches en módulo).

---

## Out of scope

- Job de notificaciones (Task 03).
- Bloqueo en `SupplierService.update` (Task 03).
- Frontend.
- GraphQL gateway.
- Cambios en `packages/`.

---

## Files allowed

- `apps/api/src/supplier-documents/**`
- `apps/api/src/app.module.ts`
- `apps/api/src/storage/**` (solo si se requiere extender validación dominio `SUPPLIERS`)
- `postman/restopsiq-api.collection.json` (carpeta PROV-DOC opcional en esta task o Task 05)

---

## Files forbidden

- `apps/api/prisma/schema.prisma` (salvo hotfix bloqueante acordado)
- `apps/web-app/**`
- `packages/**`
- `package.json` / `pnpm-lock.yaml`

---

## API contract

### GET `/api/suppliers/:supplierId/documents`

Respuesta:

```json
{
  "completeness": { "loaded": 10, "total": 15, "requiredPending": ["CAMARA_COMERCIO"] },
  "documents": [
    {
      "documentType": "RUT",
      "label": "RUT",
      "requirement": "REQUIRED",
      "status": "UPLOADED",
      "issuedAt": null,
      "expiresAt": null,
      "lastUploadedAt": "2026-06-01T12:00:00.000Z",
      "uploadedByUserId": "user-1",
      "currentVersion": { "id": "...", "versionNumber": 2, "mimeType": "application/pdf" }
    }
  ]
}
```

### POST `/api/suppliers/:supplierId/documents/:documentType`

Body:

```json
{
  "storageObjectId": "cuid",
  "issuedAt": "2026-01-15",
  "expiresAt": "2027-01-15"
}
```

- Crea nueva `SupplierDocumentVersion`, actualiza documento, audit `CREATE`/`UPDATE`.

### DELETE `/api/suppliers/:supplierId/documents/:documentType`

- Soft-delete versión activa; promover versión anterior si existe; audit `DELETE`.

### GET `.../download?versionId=`

- `403` sin permiso read.
- Audit `VIEW`.
- Retorna redirect 302 a signed URL o stream proxy.

---

## Business rules (esta task)

- Verificar `storageObject.tenantId` y `entityId === supplierId` antes de asociar.
- Incrementar `versionNumber` en cada reemplazo.
- Calcular `status` inicial: `UPLOADED` si vigente; detalle de `EXPIRING`/`EXPIRED` en Task 03.
- `NotFoundException` si proveedor no existe en tenant.
- `BadRequestException` si MIME o tamaño inválido.

---

## Acceptance criteria

- [ ] GET lista todos los tipos del catálogo con estado por proveedor.
- [ ] POST asocia archivo y persiste versión + audit en transacción.
- [ ] DELETE mantiene versión anterior accesible.
- [ ] Download usa URL firmada; sin exposición pública.
- [ ] RBAC: sin `write` → 403 en POST/DELETE; sin `read` → 403 en GET/download.
- [ ] `node scripts/validate-structure.js` pasa.
- [ ] Tests del módulo pasan con cobertura requerida.

---

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api test -- --testPathPattern=supplier-documents
pnpm --filter=@restopsiq/api test:cov
pnpm run typecheck
```
