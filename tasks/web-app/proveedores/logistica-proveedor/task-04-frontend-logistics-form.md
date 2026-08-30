# PROV-LOG Task 04 — Frontend bloque Información logística

**Domain:** `[FRONTEND]` `[WEB-APP]` `[UI]`  
**Status:** `pending`  
**Depends on:** [task-02-backend-supplier-logistics-api.md](./task-02-backend-supplier-logistics-api.md)

---

## Goal

Agregar sección **Información logística** en `ProveedorFormView` (crear/editar) y vista lectura en detalle del proveedor, con validación cliente, borrador y mensajes de error por campo.

---

## Scope

### Formulario (`ProveedorFormView`)

- Nueva sección `ProveedorFormSection title="Información logística"`.
- Campos según AC 1–6 del epic.
- Multi-select días (Lun–Sáb).
- Select modalidad, lugar, transporte.
- Toggle cadena de frío + campos temperatura condicionales.
- Combobox usuario responsable (query usuarios tenant).
- Multi-select sedes cobertura (`Location`).
- Costo transporte + moneda; pedido mínimo + unidad.
- Rango horario (dos inputs `type="time"` o componente existente).
- Resumen de errores arriba del bloque al submit fallido.
- Botones: **Guardar** (completo) y **Guardar borrador** (solo logística incompleta permitida).

### Detalle proveedor

- Mostrar bloque logístico en `ProveedorInfoTab` (lectura).
- Badge “Logística incompleta” si `status = DRAFT`.
- Advertencia si `receptionResponsibleStale`.
- Panel historial (solo admin) si Task 03 expone query.

### Tipos / API

- Extender `SupplierFormValues`, fragments GraphQL, mutations.
- Hooks: reutilizar `useCreateSupplier` / `useUpdateSupplier` con payload `logistics`.

### UI kit (si aplica)

- `packages/ui`: opcional `ProveedorLogisticsSection` o campos en `proveedor-form-section` existente.

---

## Out of scope

- Tab nueva en detalle (va en Información).
- OC / planeación automática desde días de entrega.

---

## Files allowed

- `apps/web-app/src/features/proveedores/**`
- `packages/ui/src/components/proveedor/proveedor-form-section/**`
- `packages/ui/src/components/proveedor/**` (componentes nuevos logística)
- `packages/ui/src/index.tsx`

---

## Files forbidden

- `apps/api/prisma/schema.prisma`
- `apps/api/src/app.module.ts` (salvo si Task 02 no completó wiring)
- `package.json` / `pnpm-lock.yaml`

---

## Acceptance criteria (mapeo)

| AC   | Criterio                                                         |
| ---- | ---------------------------------------------------------------- |
| AC 1 | Sección visible con todos los campos, \* y etiquetas recomendado |
| AC 2 | Selectores modalidad/lugar; validación obligatorios              |
| AC 3 | Multi día, lead time entero, ventana horaria                     |
| AC 4 | Transporte + toggle frío + temperatura condicional               |
| AC 5 | Costo/moneda, pedido mínimo, cobertura sedes                     |
| AC 6 | Búsqueda usuario; warning stale                                  |
| AC 7 | Errores resaltados + borrador                                    |
| AC 8 | Edición + historial admin (si BE listo)                          |

---

## Tests

| Archivo                      | Caso mínimo                                        |
| ---------------------------- | -------------------------------------------------- |
| `ProveedorFormView.test.tsx` | render bloque logístico; frío habilita temperatura |
| `ProveedorInfoTab.test.tsx`  | muestra datos logísticos en lectura                |

---

## Validation commands

```bash
pnpm --filter web-app typecheck
pnpm --filter web-app test -- proveedores
pnpm --filter @restopsiq/ui typecheck
```
