# Epic: Comités de Producción — Web App

**Domain:** `[FRONTEND]` `[WEB-APP]` `[PRODUCCION]` `[MES]`  
**Status:** `done`  
**Depends On:** `tasks/mes-plant/MES-10-production-committee/03-api-controller-dtos.md`  
**Route base:** `/produccion/comites`

---

## Objetivo

Pantallas supervisor para gestionar comités de producción: listar comités (`OP0001`), crear comité seleccionando usuarios `OPERATIONS_ADMIN`, activar/cerrar comité, y crear OPs asociadas a un comité activo.

---

## Alcance

| Pantalla        | Ruta                                | Descripción                                    |
| --------------- | ----------------------------------- | ---------------------------------------------- |
| Listado comités | `/produccion/comites`               | Tabla: número, status, miembros, ordersCount   |
| Detalle comité  | `/produccion/comites/:id`           | Miembros, estado, OPs del comité               |
| Crear comité    | Modal o `/produccion/comites/nuevo` | Multi-select usuarios OPERATIONS_ADMIN         |
| Crear OP        | Flujo existente + selector          | `committeeId` en create order si comité ACTIVE |

---

## Fuera de alcance

- Aprobaciones multi-firma.
- Notificaciones push/email.
- Cambios en `apps/plant`.

---

## API cliente (preview)

```typescript
// features/produccion/api/produccion.api.ts

export async function listProductionCommittees(params?: { status?: string }) { ... }
export async function getProductionCommittee(id: string) { ... }
export async function createProductionCommittee(body: { memberUserIds: string[] }) { ... }
export async function closeProductionCommittee(id: string) { ... }
export async function listOperationsAdminUsers() { ... }  // GET users filtrados por rol
```

---

## Subtareas (futuras)

| #   | Archivo (por crear)                     | Descripción                            |
| --- | --------------------------------------- | -------------------------------------- |
| 1   | `01-api-hooks-committees.md`            | API + React Query hooks                |
| 2   | `02-list-detail-committees-ui.md`       | Listado y detalle comités              |
| 3   | `03-create-committee-flow.md`           | Formulario + selector OPERATIONS_ADMIN |
| 4   | `04-order-create-committee-selector.md` | Integrar comité en alta de OP          |

---

## Criterios de aceptación (epic)

- [x] Supervisor crea comité → aparece como `OP0001` en listado.
- [x] Solo usuarios `OPERATIONS_ADMIN` aparecen en selector de miembros.
- [x] Crear OP desde comité ACTIVE incrementa `ordersCount` visible en UI.
- [x] Comité CLOSED no permite nueva OP (validación UI + API).
- [x] Tests: hooks API mock; smoke de listado con MSW.

---

## Archivos esperados (referencia)

| Archivo                                                | Cambio                      |
| ------------------------------------------------------ | --------------------------- |
| `features/produccion/api/produccion.api.ts`            | CRUD comités                |
| `features/produccion/hooks/useProductionCommittees.ts` | queries                     |
| `features/produccion/ProductionCommitteesListView/`    | nuevo                       |
| `features/produccion/ProductionCommitteeDetailView/`   | nuevo                       |
| `routes` producción                                    | rutas `/produccion/comites` |
