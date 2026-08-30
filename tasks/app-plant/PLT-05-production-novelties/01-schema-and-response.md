# PLT-05 BE-01 — Schema `noveltyType` + `requiresPause` y response extendido

**Parent:** `../16-production-novelties.md`  
**Status:** `pending`  
**Depends on:** `MES-08-alarms-incidents/01-schema-migration.md` (modelo `ProductionIncident` base)  
**Blocks:** `02-incident-service-tests.md`, `05-plant-incident-service.md`

---

## Goal

Extender `ProductionIncident` para persistir la clasificación operativa de producto (`NoveltyType` × 7) y el flag `requiresPause`, y exponer ambos campos en las respuestas HTTP de incidentes/novedades.

---

## Scope

- Agregar enum Prisma `NoveltyType` (7 valores del ticket producto).
- Agregar columnas en `ProductionIncident`:
  - `noveltyType NoveltyType?`
  - `requiresPause Boolean @default(false)`
- Crear **una** migración SQL (solo columnas/enum de esta task).
- Actualizar `CreateIncidentInput` / `IncidentResponse` en `plant.interfaces.ts`.
- Actualizar `IncidentRepository.createIncident` para persistir los nuevos campos.
- Actualizar `toIncidentResponse` mapper.
- Ajustar `create-novelty.dto.ts` / controller alias `POST orders/:id/incidents` para pasar `noveltyType` y `requiresPause` al service (no solo mapear a `IncidentType`).
- Mantener `IncidentType` existente (`QUALITY`, `SAFETY`, `EQUIPMENT`, `OTHER`) para compatibilidad MES-08 — derivar de `noveltyType` cuando el cliente envía DTO de novedad.

---

## Out of Scope

- Nuevo modelo `ProductionNovelty`.
- Cambios en `apps/plant/**` o `packages/ui/**`.
- Upload de fotos / `attachments[]`.
- Dashboard web supervisor (OS-381).
- `pnpm migrate dev` salvo instrucción explícita — solo `prisma format` + `prisma validate` + generar migración.

---

## Files allowed

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/**/migration.sql` (nueva migración única)
- `apps/api/src/mes/plant/controller/dto/create-novelty.dto.ts`
- `apps/api/src/mes/plant/controller/dto/incident-response.dto.ts` (o archivo response equivalente)
- `apps/api/src/mes/plant/interfaces/plant.interfaces.ts`
- `apps/api/src/mes/plant/repository/incident.repository.ts`
- `apps/api/src/mes/plant/service/incident.service.ts`
- `apps/api/src/mes/plant/controller/plant.controller.ts` (solo wiring DTO → service)

---

## Files forbidden

- `package.json`, `pnpm-lock.yaml`
- `scripts/validate-structure.js`
- `apps/api/src/app.module.ts`
- `apps/plant/**`, `apps/web-app/**`, `packages/**`

---

## Implementation notes

### Enum `NoveltyType` (Prisma)

```prisma
enum NoveltyType {
  INGREDIENT_SHORTAGE
  EQUIPMENT_FAILURE
  RECIPE_DEVIATION
  UNPLANNED_STOP
  SAFETY_INCIDENT
  QUALITY_ISSUE
  OTHER
}
```

### Mapeo dual `noveltyType` → `IncidentType`

| `NoveltyType`                       | `IncidentType` |
| ----------------------------------- | -------------- |
| `EQUIPMENT_FAILURE`                 | `EQUIPMENT`    |
| `SAFETY_INCIDENT`                   | `SAFETY`       |
| `QUALITY_ISSUE`, `RECIPE_DEVIATION` | `QUALITY`      |
| Resto                               | `OTHER`        |

Persistir **ambos** en create: `noveltyType` (producto) + `type` (legacy MES).

### `IncidentResponse` mínimo extendido

```typescript
{
  // ...campos existentes...
  noveltyType?: NoveltyType | null;
  requiresPause: boolean;
}
```

### Backfill

Registros existentes: `noveltyType = null`, `requiresPause = false` — sin backfill obligatorio.

---

## Acceptance criteria

- [ ] Migración aplica sin error en schema review.
- [ ] `POST /api/plant/orders/:id/incidents` persiste `noveltyType` y `requiresPause`.
- [ ] `GET /api/plant/orders/:id/incidents` devuelve los nuevos campos.
- [ ] `IncidentType` sigue poblado para registros nuevos (derivado de `noveltyType`).
- [ ] `prisma validate` y `prisma format` en verde.

---

## Validation commands

```bash
cd apps/api && pnpm prisma format && pnpm prisma validate
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api typecheck
```
