# PROV-DOC Task 01 — Prisma schema + migración: documentación proveedor

**Domain:** `[BACKEND]` `[PRISMA]`  
**Status:** `pending`  
**Depends on:** [00-epic-and-decisions.md](./00-epic-and-decisions.md)

---

## Goal

Agregar modelos y enums para documentación de proveedores, política de vigencia por tenant, flags condicionales en `Supplier`, dominio `SUPPLIERS` en storage y permisos RBAC en seed.

---

## Scope

- Modificar `apps/api/prisma/schema.prisma`.
- Agregar `SUPPLIERS` a `enum StorageDomain`.
- Extender modelo `Supplier` con flags condicionales (ver epic).
- Crear enums `SupplierDocumentType`, `SupplierDocumentStatus`.
- Crear modelos `SupplierDocument`, `SupplierDocumentVersion`, `SupplierDocumentPolicy`.
- Agregar permisos `suppliers.documents.read` / `suppliers.documents.write` en `apps/api/prisma/seed.ts`.
- Crear migración (`pnpm prisma migrate dev --name prov-doc-supplier-documents`).
- Ejecutar `prisma format`, `prisma validate`, `prisma generate`.

---

## Out of scope

- Código en `apps/api/src/`.
- `app.module.ts`.
- `package.json` / `pnpm-lock.yaml`.
- Seeds de documentos de ejemplo (opcional).

---

## Files allowed

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/seed.ts`
- `apps/api/prisma/migrations/**` (solo migración de esta task)

---

## Files forbidden

- `apps/api/src/**`
- `apps/web-app/**`
- `packages/**`
- `package.json` / `pnpm-lock.yaml`
- `apps/api/src/app.module.ts`

---

## Implementation

### Enum `SupplierDocumentType`

```prisma
enum SupplierDocumentType {
  RUT
  CAMARA_COMERCIO
  CEDULA_REPRESENTANTE_LEGAL
  CERTIFICACION_BANCARIA
  LISTA_PRECIOS
  CONTRATO_COMERCIAL
  POLIZAS
  CERTIFICACION_SANITARIA
  CONCEPTO_SANITARIO_INVIMA
  FICHA_TECNICA_PRODUCTO
  HOJA_SEGURIDAD
  CERTIFICADO_BPM
  ACUERDO_CONFIDENCIALIDAD
  TRATAMIENTO_DATOS_PERSONALES
}
```

### Enum `SupplierDocumentStatus`

```prisma
enum SupplierDocumentStatus {
  PENDING
  UPLOADED
  EXPIRING
  EXPIRED
}
```

### Flags en `Supplier`

```prisma
isCritical              Boolean @default(false)
sellsRecurrentProducts  Boolean @default(false)
isFoodSupplier          Boolean @default(false)
handlesChemicals        Boolean @default(false)
isRawMaterialSupplier   Boolean @default(false)
```

### Modelo `SupplierDocument`

- `@@unique([tenantId, supplierId, documentType])`
- Índices: `[tenantId, supplierId]`, `[tenantId, expiresAt]`, `[tenantId, status]`
- FK `supplierId` → `Supplier`
- FK opcional `currentVersionId` → `SupplierDocumentVersion`
- Campos: `issuedAt`, `expiresAt`, `lastUploadedAt`, `uploadedByUserId`

### Modelo `SupplierDocumentVersion`

- FK `supplierDocumentId` → `SupplierDocument`
- FK `storageObjectId` → `StorageObject`
- `versionNumber Int`
- `uploadedByUserId`, `uploadedAt`
- Soft delete: `deletedAt DateTime?`

### Modelo `SupplierDocumentPolicy`

- `tenantId` PK
- `camaraComercioValidityDays Int @default(30)` — validar en app 30|60|90
- `rutAnnualReviewMonths Int @default(11)`

### Storage

```prisma
enum StorageDomain {
  ...
  SUPPLIERS
}
```

### Permisos (seed)

```typescript
// suppliers.documents.read  — ver tab y descargar
// suppliers.documents.write — subir, reemplazar, eliminar
```

Asignar `write` a `SUPER_ADMIN` y rol gestor acordado; `read` a roles con acceso a proveedores.

---

## Acceptance criteria

- [ ] `SupplierDocument` tiene `tenantId`, `supplierId`, `documentType` único por proveedor.
- [ ] `SupplierDocumentVersion` referencia `StorageObject`.
- [ ] `SupplierDocumentPolicy` existe por tenant con default 30 días Cámara de Comercio.
- [ ] `StorageDomain` incluye `SUPPLIERS`.
- [ ] Migración SQL crea tablas y enums sin romper `suppliers` existentes.
- [ ] `prisma validate` y `prisma generate` pasan.
- [ ] Permisos nuevos en seed.

---

## Validation commands

```bash
cd apps/api && npx prisma@5 format
cd apps/api && npx prisma@5 validate
cd apps/api && npx prisma@5 generate
```

Opcional (DB local):

```bash
cd apps/api && npx prisma@5 migrate dev --name prov-doc-supplier-documents
```
