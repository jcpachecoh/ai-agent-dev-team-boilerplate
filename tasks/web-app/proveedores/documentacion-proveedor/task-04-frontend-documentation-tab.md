# PROV-DOC Task 04 — Frontend pestaña Documentación

**Domain:** `[FRONTEND]` `[WEB-APP]` `[PROVEEDORES]` `[UI]`  
**Status:** `pending`  
**Depends on:** [task-02-backend-supplier-documents-api.md](./task-02-backend-supplier-documents-api.md)  
**Puede iniciar UI mock:** tras definir contratos API de Task 02

---

## Goal

Reemplazar la pestaña **Calidad** por **Documentación** en el detalle de proveedor: tabla de documentos, carga de archivos, preview/descarga, indicador de completitud y estados visuales de vigencia.

---

## Scope

### Tab y navegación

- Cambiar `ProveedorDetailTabId`: `quality` → `documentation`.
- Redirect `?tab=quality` → `documentation`.
- Actualizar `ProveedorDetailTabBar` en `@restopsiq/ui`: label **DOCUMENTACIÓN**, icono apropiado (ej. `FileText`).
- Crear `ProveedorDocumentationTab.tsx` en web-app.

### UI (`packages/ui` si aplica)

- Tabla documentación con columnas: Documento, Obligatorio, Vigencia, Estado, Última carga, Acciones.
- Badge estado: Cargado / Pendiente / Vencido con colores verde / gris / rojo; amarillo para ≤ 15 días.
- Barra completitud: "X de Y documentos cargados".
- Acciones: Subir, Reemplazar, Eliminar, Descargar, Ver historial (última versión).
- Upload: input file accept `.pdf,.jpg,.jpeg,.png`, validación cliente 5 MB.
- Preview: ícono PDF/imagen + link descarga; thumbnail para imágenes si es viable.
- Formulario fecha expedición para Cámara de Comercio.
- Mensaje bloqueo al guardar proveedor si API devuelve `requiredPending`.

### Integración datos

- `apps/web-app/src/features/proveedores/api/supplier-documents.api.ts`
- Hooks React Query: `useSupplierDocuments`, `useUploadSupplierDocument`, `useDeleteSupplierDocument`
- Flujo upload: `POST /api/storage/upload` → `POST .../documents/:type`
- RBAC FE: ocultar acciones write si usuario sin `suppliers.documents.write`

---

## Out of scope

- Configuración política 30/60/90 en settings tenant.
- Notificaciones in-app UI (toast al entrar si hay vencidos — opcional nice-to-have).
- GraphQL.

---

## Files allowed

- `apps/web-app/src/features/proveedores/**`
- `apps/web-app/src/pages/ProveedoresPage/**`
- `packages/ui/src/components/proveedor/proveedor-detail-tab-bar/**`
- `packages/ui/src/components/proveedor/proveedor-documentation-table/**` (nuevo)
- `packages/ui/src/components/proveedor/shared/proveedor-detail-columns.ts`
- `packages/ui/src/index.tsx`

---

## Files forbidden

- `apps/api/prisma/schema.prisma`
- `apps/api/src/app.module.ts` (salvo si Task 02 no completó wiring)
- `package.json` / `pnpm-lock.yaml`

---

## Acceptance criteria (mapeo AC usuario)

### AC 1 — RUT

- [ ] Upload PDF/JPG/PNG ≤ 5 MB
- [ ] Muestra fecha carga y usuario
- [ ] Preview o ícono descarga
- [ ] Alerta visual si > 11 meses (badge/warning)

### AC 2 — Cámara de Comercio

- [ ] Upload + campo fecha expedición
- [ ] Muestra fecha vencimiento calculada
- [ ] Alerta < 7 días o vencido

### AC 3 — Documentos adicionales

- [ ] Upload tipos listados en epic
- [ ] Estado Cargado / Pendiente / Vencido por fila
- [ ] Error claro si guardar proveedor con obligatorios pendientes

### AC 4 — Gestión

- [ ] Reemplazar y eliminar
- [ ] Ver/descargar versión anterior
- [ ] Indicador "X de Y documentos cargados"

### AC 5 — Colores vencimiento

- [ ] Rojo vencido, amarillo ≤ 15 días, verde vigente

### AC 6 — Seguridad FE

- [ ] Botones subir/eliminar solo con permiso write
- [ ] Descarga vía endpoint autenticado (no URL pública hardcodeada)

---

## Tests

| Archivo                              | Caso mínimo                                              |
| ------------------------------------ | -------------------------------------------------------- |
| `ProveedorDocumentationTab.test.tsx` | render tabla, badge pendiente, oculta upload sin permiso |
| `ProveedorDetailView.test.tsx`       | tab `documentation` activa panel correcto                |

---

## Validation commands

```bash
pnpm --filter web-app typecheck
pnpm --filter web-app test
pnpm --filter @restopsiq/ui typecheck
```
