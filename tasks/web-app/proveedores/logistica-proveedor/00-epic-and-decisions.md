# PROV-LOG — Información logística del proveedor

**Domain:** `[BACKEND]` `[FRONTEND]` `[WEB-APP]` `[PROVEEDORES]` `[GRAPHQL]` `[AUDIT]`  
**Status:** `pending`  
**Parent epic:** [../00-epic.md](../00-epic.md)  
**Ruta UI:** `/proveedores/nuevo`, `/proveedores/:supplierId/editar`, lectura en `/proveedores/:supplierId?tab=info`  
**Módulo NestJS propuesto:** `apps/api/src/supplier-logistics/` (o extensión de `supplier/`)  
**Depends on:** módulo `Supplier` existente, `Location`, `User`, `AuditLog`, tarea 2 proveedores (GraphQL CRUD)

---

## Objetivo

Agregar un bloque **Información logística** en el formulario de creación/edición de proveedor para registrar modalidad de entrega, lugar, días, lead time, ventana horaria, responsable de recepción, transporte, cadena de frío, costos, pedido mínimo y cobertura por sedes — con validaciones, borrador, vista lectura en perfil e historial de cambios.

---

## Catálogo de campos

| Campo                       | Obligatorio  | Para qué sirve                     |
| --------------------------- | ------------ | ---------------------------------- |
| Modalidad de entrega        | Sí           | Entrega proveedor / recoge empresa |
| Lugar de entrega            | Sí           | Planta, PDV, bodega                |
| Días de entrega             | Sí           | Planeación                         |
| Lead time en días           | Sí           | Abastecimiento                     |
| Ventana horaria             | Recomendado  | Recepción ordenada                 |
| Responsable de recepción    | Sí           | Trazabilidad                       |
| Transporte propio o tercero | Sí           | Control de cadena                  |
| Requiere cadena de frío     | Sí si aplica | Calidad                            |
| Temperatura de transporte   | Sí si aplica | Control sanitario                  |
| Costo de transporte         | Recomendado  | Costo total                        |
| Pedido mínimo logístico     | Recomendado  | Eficiencia de compra               |
| Cobertura (sedes)           | Recomendado  | Sedes a las que entrega            |

---

## Acceptance criteria (producto)

### AC 1 — Visualización del bloque logístico

- [ ] En creación/edición del proveedor se muestra sección **Información logística**.
- [ ] Contiene todos los campos de la tabla definida.
- [ ] Obligatorios marcados con asterisco (\*).
- [ ] Recomendados con etiqueta o tooltip “opcional / sugerido”.

### AC 2 — Modalidad y lugar de entrega

- [ ] Modalidad de entrega: selector `Entrega proveedor` | `Recoge empresa`.
- [ ] Lugar de entrega: `Planta` | `PDV` | `Bodega` | otro personalizado.
- [ ] Ambos obligatorios; bloquean guardado con error si faltan.

### AC 3 — Días de entrega y lead time

- [ ] Días de entrega: multi-select lunes–sábado.
- [ ] Lead time: entero positivo.
- [ ] Ventana horaria: rango (ej. 08:00 – 12:00).
- [ ] Si Lead time o Días de entrega vacíos → advertencia/error al guardar (salvo borrador).

### AC 4 — Transporte y cadena de frío

- [ ] Transporte: `Propio` | `Tercero`.
- [ ] Requiere cadena de frío: toggle Sí/No.
- [ ] Si Sí → Temperatura de transporte obligatoria (rango °C).
- [ ] Si No → Temperatura oculta/deshabilitada.

### AC 5 — Costo, pedido mínimo y cobertura

- [ ] Costo de transporte: numérico 2 decimales + moneda COP/USD.
- [ ] Pedido mínimo logístico: valor + unidad (unidades, kg, cajas, etc.).
- [ ] Cobertura: multi-select sedes (`Location` del tenant).
- [ ] Siempre visibles; opcionales para guardado definitivo.

### AC 6 — Responsable de recepción

- [ ] Búsqueda y selección de usuario interno del tenant.
- [ ] Si usuario eliminado → advertencia en lectura/edición y solicitud de actualización.
- [ ] Obligatorio para guardado definitivo.

### AC 7 — Validaciones y guardado

- [ ] Campos obligatorios vacíos → resaltado por campo + resumen de errores arriba del bloque.
- [ ] **Borrador:** permite guardar proveedor con logística incompleta (`logisticsStatus = DRAFT`).
- [ ] Guardado exitoso → confirmación; datos visibles en perfil (modo lectura).

### AC 8 — Edición y trazabilidad

- [ ] Usuario con permiso puede editar logística post-creación.
- [ ] Cada cambio en `AuditLog` (usuario, fecha, valores anterior/nuevo).
- [ ] Historial visible para administradores en perfil del proveedor.

---

## Estado actual (codebase)

| Área                                | Hoy                                                  | Gap                                           |
| ----------------------------------- | ---------------------------------------------------- | --------------------------------------------- |
| `ProveedorFormView`                 | Secciones Información general, Contacto, Condiciones | Sin bloque logístico                          |
| Modelo `Supplier`                   | Sin campos logísticos                                | Nuevo modelo `SupplierLogistics` 1:1          |
| `SupplierProduct.tiempoEntregaDias` | Lead time por producto                               | Distinto de lead time logístico del proveedor |
| `Location`                          | Sedes del tenant                                     | Reutilizar para cobertura                     |
| `AuditLog`                          | Existe                                               | Registrar cambios logísticos                  |
| GraphQL `Supplier`                  | CRUD básico                                          | Extender input/output o query anidada         |

---

## Decisiones de diseño

### 1. Modelo de datos

Relación **1:1** `Supplier` ↔ `SupplierLogistics` (no columnas sueltas en `Supplier`).

```prisma
enum SupplierDeliveryMode {
  SUPPLIER_DELIVERS   // Entrega proveedor
  COMPANY_PICKUP      // Recoge empresa
}

enum SupplierDeliveryPlace {
  PLANT
  PDV
  WAREHOUSE
  OTHER
}

enum SupplierTransportType {
  OWN
  THIRD_PARTY
}

enum SupplierLogisticsStatus {
  DRAFT
  COMPLETE
}

model SupplierLogistics {
  id                         String
  tenantId                   String
  supplierId                 String @unique
  deliveryMode               SupplierDeliveryMode
  deliveryPlace              SupplierDeliveryPlace
  deliveryPlaceCustom        String?
  deliveryDays               Int[]              // 1=Lun … 6=Sáb (ISO o índice acordado)
  leadTimeDays               Int
  timeWindowStart            String?            // "HH:mm"
  timeWindowEnd              String?
  receptionResponsibleUserId String
  transportType            SupplierTransportType
  requiresColdChain          Boolean @default(false)
  transportTempMinC        Decimal?
  transportTempMaxC        Decimal?
  transportCost              Decimal?
  transportCostCurrency      CurrencyCode?      // COP | USD — reutilizar enum si existe
  minimumOrderQty            Decimal?
  minimumOrderUnit           String?
  status                     SupplierLogisticsStatus @default(DRAFT)
  ...
  coverageLocations SupplierLogisticsCoverage[]
}

model SupplierLogisticsCoverage {
  supplierLogisticsId String
  locationId          String
  @@unique([supplierLogisticsId, locationId])
}
```

### 2. Borrador vs completo (AC 7)

- `saveAsDraft: true` en create/update → persiste logística con `status = DRAFT` sin validar obligatorios.
- Guardado definitivo → `status = COMPLETE` + validación Zod de obligatorios + cadena de frío condicional.

### 3. API

**Opción A (recomendada MVP):** extender `CreateSupplierInput` / `UpdateSupplierInput` GraphQL con objeto anidado `logistics` + `saveAsDraft`.

**Opción B:** REST dedicado `PUT /api/suppliers/:id/logistics` — solo si GraphQL no alcanza en timeline.

### 4. Responsable de recepción

- FK a `User.id` con filtro `tenantId`.
- FE: combobox/búsqueda sobre usuarios activos del tenant (reutilizar patrón de asignación de turnos o usuarios si existe).
- BE: al leer, si `receptionResponsibleUserId` apunta a usuario inexistente/inactivo → flag `receptionResponsibleStale: true` en DTO.

### 5. Historial (AC 8)

- `AuditLog.entityType = 'SupplierLogistics'`, `action = UPDATE`, `payload` con diff campo a campo.
- FE: panel “Historial logístico” en tab Información (solo roles admin) o subsección colapsable.

### 6. RBAC

| Acción                | Roles sugeridos                                                         |
| --------------------- | ----------------------------------------------------------------------- |
| Ver logística         | Mismos que módulo PROVEEDORES (OWNER, SUPER_ADMIN, SUPERVISOR, MANAGER) |
| Editar logística      | OWNER, SUPER_ADMIN, MANAGER                                             |
| Ver historial cambios | OWNER, SUPER_ADMIN                                                      |

Permiso opcional futuro: `suppliers.logistics.write` — no bloquear MVP si se usa rol.

### 7. Vista lectura

- En `ProveedorInfoTab` (o sub-bloque): mostrar campos logísticos en modo solo lectura cuando `status = COMPLETE`.
- Si `DRAFT`: badge “Logística incompleta” + CTA editar.

---

## Subtareas

| #   | Archivo                                                                                  | Descripción                                         |
| --- | ---------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 1   | [task-01-schema-migration.md](./task-01-schema-migration.md)                             | Prisma: enums, `SupplierLogistics`, cobertura sedes |
| 2   | [task-02-backend-supplier-logistics-api.md](./task-02-backend-supplier-logistics-api.md) | Service, GraphQL, validación Zod                    |
| 3   | [task-03-draft-audit-history.md](./task-03-draft-audit-history.md)                       | Borrador, audit diff, usuario stale                 |
| 4   | [task-04-frontend-logistics-form.md](./task-04-frontend-logistics-form.md)               | Bloque formulario + lectura en detalle              |
| 5   | [task-05-tests-validation.md](./task-05-tests-validation.md)                             | Tests unitarios, Postman/GraphQL smoke              |

---

## Validación epic (cuando todas las tasks estén done)

```bash
pnpm prisma validate
pnpm --filter=@restopsiq/api test -- --testPathPattern="supplier-logistics|supplier.service"
pnpm --filter web-app typecheck
pnpm --filter web-app test -- proveedores
node scripts/validate-structure.js
```
