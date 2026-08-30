# PROV-DOC — Documentación del proveedor (pestaña detalle)

**Domain:** `[BACKEND]` `[FRONTEND]` `[WEB-APP]` `[PROVEEDORES]` `[STORAGE]` `[RBAC]` `[AUDIT]`  
**Status:** `pending`  
**Parent epic:** [../00-epic.md](../00-epic.md)  
**Ruta UI:** `/proveedores/:supplierId?tab=documentation`  
**Estado actual tab `quality`:** placeholder en `ProveedorDetailView` — **reemplazar** por documentación  
**Módulo NestJS propuesto:** `apps/api/src/supplier-documents/`  
**Depends on:** módulo `Supplier` existente, `StorageModule`, `AuditLog`, `USR-02` RBAC

---

## Objetivo

Reemplazar la pestaña **Calidad** del detalle de proveedor por **Documentación del proveedor**: catálogo de tipos documentales con reglas de obligatoriedad y vigencia, carga de archivos escaneados (PDF/JPG/PNG ≤ 5 MB), versionado, indicadores de completitud, alertas de vencimiento y trazabilidad en `AuditLog`.

---

## Catálogo documental (requerimiento producto)

| Documento                               | Obligatorio                       | Vigencia / revisión                         |
| --------------------------------------- | --------------------------------- | ------------------------------------------- |
| RUT                                     | Sí                                | Revisión mínimo anual                       |
| Cámara de Comercio                      | Sí para persona jurídica          | 30 / 60 / 90 días según política del tenant |
| Cédula representante legal              | Sí                                | Permanente                                  |
| Certificación bancaria                  | Sí                                | Revisión periódica                          |
| Lista de precios                        | Sí si vende productos recurrentes | Según negociación                           |
| Contrato / acuerdo comercial            | Sí para proveedores críticos      | Según vigencia                              |
| Pólizas                                 | Según riesgo                      | Según vigencia                              |
| Certificaciones sanitarias              | Sí para alimentos                 | Según entidad                               |
| Concepto sanitario / INVIMA (si aplica) | Sí para alimentos regulados       | Según norma aplicable                       |
| Ficha técnica de producto               | Sí para materia prima             | Cada actualización                          |
| Hoja de seguridad                       | Sí para químicos                  | Vigente                                     |
| Certificado BPM / calidad               | Recomendado / crítico             | Según proveedor                             |
| Acuerdo de confidencialidad             | Recomendado                       | Permanente                                  |
| Tratamiento de datos personales         | Sí                                | Permanente                                  |

---

## Estado actual (codebase)

| Área                                      | Hoy                                                       | Gap                                                                                |
| ----------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Tab detalle proveedor                     | `quality` con `ProveedorPlaceholderTab`                   | Renombrar a `documentation` y contenido real                                       |
| `ProveedorDetailTabBar` (`@restopsiq/ui`) | Tab `CALIDAD` + icono `Star`                              | Cambiar label/icono a `DOCUMENTACIÓN`                                              |
| `ProveedorQualityTable`                   | Tabla de evaluaciones de calidad (mock Storybook)         | **No reutilizar** para documentos; crear tabla de documentación o adaptar columnas |
| Modelo `Supplier`                         | Sin documentos ni flags (`critico`, `alimentos`, etc.)    | Extender schema + catálogo documental                                              |
| `StorageDomain`                           | Sin dominio proveedores                                   | Agregar `SUPPLIERS`                                                                |
| Upload archivos                           | `POST /api/storage/upload` (R2/mock)                      | Reutilizar con `domain=SUPPLIERS`, `visibility=PRIVATE`                            |
| RBAC proveedores                          | CRUD supplier auth-only (sin permisos granulares en seed) | Nuevos permisos `suppliers.documents.*`                                            |
| Notificaciones                            | Email package + BullMQ en repo                            | Job diario de vencimientos (15 días)                                               |

---

## Decisiones de diseño

### 1. Reemplazo de pestaña Calidad

- Tab id: `documentation` (nuevo). Redirigir `?tab=quality` → `documentation` por compatibilidad.
- Label UI: **DOCUMENTACIÓN**.
- La funcionalidad de evaluaciones de calidad queda **fuera de scope** (epic futuro si aplica).

### 2. Multi-tenancy

- Toda entidad lleva `tenantId`.
- Documentos siempre asociados a `supplierId` + `tenantId`.
- Descarga vía URL firmada (`StorageService.getSignedUrl`) — **sin URL pública directa** (AC 6).

### 3. Modelo de datos (resumen)

```prisma
enum SupplierDocumentType { RUT, CAMARA_COMERCIO, CEDULA_REPRESENTANTE, ... }

enum SupplierDocumentRequirement {
  REQUIRED
  CONDITIONAL
  RECOMMENDED
}

enum SupplierDocumentStatus {
  PENDING      // sin archivo
  UPLOADED     // cargado y vigente
  EXPIRING     // ≤ 15 días (calculado)
  EXPIRED      // vencido (calculado)
}

model SupplierDocument {
  id              String
  tenantId        String
  supplierId      String
  documentType    SupplierDocumentType
  status          SupplierDocumentStatus  // persistido + recalculado por job
  issuedAt        DateTime?               // fecha expedición (Cámara de Comercio, etc.)
  expiresAt       DateTime?               // calculada o manual
  currentVersionId String?                // FK versión activa
  uploadedByUserId String?
  ...
}

model SupplierDocumentVersion {
  id               String
  tenantId         String
  supplierDocumentId String
  storageObjectId  String
  versionNumber    Int
  uploadedByUserId String
  uploadedAt       DateTime
  ...
}
```

Configuración tenant (política Cámara de Comercio):

```prisma
model SupplierDocumentPolicy {
  tenantId                    String @id
  camaraComercioValidityDays  Int    @default(30) // 30 | 60 | 90
  rutAnnualReviewMonths       Int    @default(11)  // alerta a los 11 meses
  ...
}
```

Flags en `Supplier` (mínimo para reglas condicionales):

- `isCritical Boolean @default(false)` — contrato obligatorio
- `sellsRecurrentProducts Boolean @default(false)` — lista de precios
- `isFoodSupplier Boolean @default(false)` — sanitarios / INVIMA
- `handlesChemicals Boolean @default(false)` — hoja de seguridad
- `isRawMaterialSupplier Boolean @default(false)` — ficha técnica

> Si el equipo prefiere no ampliar `Supplier` en MVP, derivar condicionales desde catálogo de `SupplyItem` en task futura; documentar en Task 01 la opción elegida.

### 4. Flujo de carga (2 pasos — patrón recipe-images)

1. **REST:** `POST /api/storage/upload` con `domain=SUPPLIERS`, `entityType=Supplier`, `entityId=<supplierId>`, `visibility=PRIVATE`, MIME `application/pdf` | `image/jpeg` | `image/png`, máx. **5 MB** (validar en DTO storage + service documentos).
2. **REST/GraphQL:** `POST /api/suppliers/:supplierId/documents/:documentType` registra metadata, crea nueva versión, actualiza `currentVersionId`, audit.

### 5. Versionado (AC 4)

- Al reemplazar archivo: crear `SupplierDocumentVersion` nueva; versión anterior permanece consultable (mínimo última versión previa).
- Eliminar documento: soft-delete versión activa; si hay versión anterior → promover; si no → estado `PENDING`.

### 6. Reglas de vigencia

| Tipo                | Cálculo                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------- |
| RUT                 | Alerta si `uploadedAt` + 11 meses < hoy (AC 1)                                            |
| Cámara de Comercio  | `expiresAt = issuedAt + policy.camaraComercioValidityDays`; alerta visual < 7 días (AC 2) |
| Permanentes         | Sin `expiresAt`; vigentes si cargados                                                     |
| Con vigencia manual | Usuario registra `expiresAt` al cargar (contrato, pólizas, etc.)                          |

Umbrales UI (AC 5):

- **Verde:** vigente (> 15 días)
- **Amarillo:** expira en ≤ 15 días
- **Rojo:** vencido

Notificación (AC 5): job diario → documentos con `expiresAt` en 15 días → notificación in-app (mínimo) + email si tenant configurado.

### 7. Bloqueo guardado proveedor (AC 3)

Al `updateSupplier` / activar proveedor: validar documentos **obligatorios** según `Supplier.tipo` y flags → si faltan, `400` con lista de tipos pendientes.

Documentos obligatorios base (todos):

- RUT, Cédula representante, Certificación bancaria, Tratamiento de datos personales

Condicionales:

- Cámara de Comercio → solo `PERSONA_JURIDICA`
- Lista de precios → `sellsRecurrentProducts`
- Contrato → `isCritical`
- Sanitarios / INVIMA → `isFoodSupplier`
- Hoja de seguridad → `handlesChemicals`
- Ficha técnica → `isRawMaterialSupplier`

### 8. RBAC (AC 6)

Nuevos permisos seed:

| Código                      | Descripción                 |
| --------------------------- | --------------------------- |
| `suppliers.documents.read`  | Ver tab, descargar          |
| `suppliers.documents.write` | Subir, reemplazar, eliminar |

Roles sugeridos:

- `SUPER_ADMIN`: read + write
- Rol gestor de proveedores (definir código en seed, ej. `OWNER` o permiso explícito): read + write
- Otros roles con acceso a proveedores: solo read si aplica

### 9. AuditLog (AC 6)

Registrar en `AuditLog`:

| Acción usuario    | `AuditAction`       | `entityType`       |
| ----------------- | ------------------- | ------------------ |
| Carga / reemplazo | `CREATE` o `UPDATE` | `SupplierDocument` |
| Eliminación       | `DELETE`            | `SupplierDocument` |
| Descarga          | `VIEW`              | `SupplierDocument` |

Payload: `documentType`, `versionNumber`, `storageObjectId`, `supplierId`.

### 10. API surface (propuesta REST)

| Método | Ruta                                                          | Descripción                            |
| ------ | ------------------------------------------------------------- | -------------------------------------- |
| GET    | `/api/suppliers/:supplierId/documents`                        | Lista catálogo + estado + completitud  |
| GET    | `/api/suppliers/:supplierId/documents/:documentType`          | Detalle + versiones                    |
| POST   | `/api/suppliers/:supplierId/documents/:documentType`          | Registrar archivo subido               |
| PATCH  | `/api/suppliers/:supplierId/documents/:documentType`          | Actualizar `issuedAt`, `expiresAt`     |
| DELETE | `/api/suppliers/:supplierId/documents/:documentType`          | Eliminar versión activa                |
| GET    | `/api/suppliers/:supplierId/documents/:documentType/download` | Redirect/stream URL firmada            |
| GET    | `/api/suppliers/:supplierId/documents/completeness`           | `{ loaded, total, requiredPending[] }` |

GraphQL opcional en task futura; MVP REST alineado a storage existente.

---

## Desglose de tareas SDD

| Task | Archivo                                                                                  | Descripción                                                                       |
| ---- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 01   | [task-01-schema-migration.md](./task-01-schema-migration.md)                             | Prisma: enums, modelos, política tenant, flags supplier, permisos seed, migración |
| 02   | [task-02-backend-supplier-documents-api.md](./task-02-backend-supplier-documents-api.md) | Módulo NestJS REST, storage, versionado, audit, RBAC, tests                       |
| 03   | [task-03-expiration-alerts-validation.md](./task-03-expiration-alerts-validation.md)     | Cálculo vigencias, job notificaciones 15 días, bloqueo guardado proveedor         |
| 04   | [task-04-frontend-documentation-tab.md](./task-04-frontend-documentation-tab.md)         | Reemplazar tab Calidad, UI carga/preview/descarga, indicadores                    |
| 05   | [task-05-tests-postman-validation.md](./task-05-tests-postman-validation.md)             | Postman, E2E smoke, validación epic                                               |

**Orden:** 01 → 02 → 03 → 04 → 05. Task 04 puede iniciar con mocks tras definir contratos en Task 02.

---

## Acceptance criteria (épica → AC usuario)

### AC 1 — RUT

- [ ] Adjuntar RUT en PDF, JPG o PNG
- [ ] Validación máx. 5 MB
- [ ] Asociado al proveedor con fecha de carga y usuario
- [ ] Vista previa o ícono de descarga
- [ ] Alerta si > 11 meses sin actualización

### AC 2 — Cámara de Comercio

- [ ] Adjuntar certificado PDF/JPG/PNG ≤ 5 MB
- [ ] Registrar fecha de expedición
- [ ] Calcular y mostrar vencimiento según política 30/60/90 días
- [ ] Alerta visual < 7 días o vencido

### AC 3 — Documentos adicionales

- [ ] Cargar opcionales: cédula RL, cert. bancaria, contrato, confidencialidad, tratamiento datos (PDF donde aplique)
- [ ] Estado por documento: Cargado / Pendiente / Vencido
- [ ] Obligatorios faltantes bloquean guardado con mensaje claro

### AC 4 — Gestión y visualización

- [ ] Eliminar y reemplazar documentos
- [ ] Historial de versiones (mín. última versión anterior)
- [ ] Descarga de cualquier versión cargada
- [ ] Indicador de completitud (ej. "10 de 15 documentos cargados")

### AC 5 — Alertas y vencimientos

- [ ] Notificación a 15 días de vencer (in-app mínimo)
- [ ] Vencidos en rojo, ≤ 15 días en amarillo, vigentes en verde

### AC 6 — Seguridad y trazabilidad

- [ ] Solo admin / gestor proveedores puede subir o eliminar
- [ ] AuditLog en carga, eliminación y descarga
- [ ] Archivos en storage privado con URL firmada

---

## Out of scope (épica)

- Evaluaciones de calidad / auditorías de proveedor (tab antigua).
- OCR o extracción automática de fechas del PDF.
- Firma electrónica de documentos.
- Integración con entidades externas (DIAN, Cámara de Comercio API).
- Borrado físico inmediato en R2 al eliminar versión (cleanup job futuro).
- GraphQL en gateway (salvo decisión explícita en Task 02).
