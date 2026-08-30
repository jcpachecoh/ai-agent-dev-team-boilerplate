# MES-11 Task 09 — Frontend integration

## Goal

Conectar `PlantRecipeDetailScreen` (UI existente) con la API MES-11.

**Depends on:** Task 06.

---

## Scope

- Cliente HTTP en `apps/plant/src/api/` o `apps/web-app/src/api/plant/` (donde viva el dashboard field-ops).
- Hooks: `useOrderRecipe`, `useOrderRuntimeActions`.
- Mapear respuesta API → props de `PlantRecipeDetailScreen`.
- Timer local (`timer.store` en apps/plant task 04) sincronizado con `status` del API al montar.
- Modal de confirmación **FINALIZAR** en capa app (no en UI package).
- Offline: encolar mutaciones vía `offline-queue.service` (apps/plant task 09) con `Idempotency-Key`.

---

## Out of Scope

- Cambios visuales en `packages/ui` salvo props ya definidas.
- Backend (tasks 01–08).

---

## Files allowed

- `apps/plant/src/api/operator-order.api.ts` (o ruta equivalente)
- `apps/plant/src/hooks/useOrderRecipe.ts`
- `apps/plant/src/screens/ProductionScreen.tsx` (o shell que use `PlantRecipeDetailScreen`)
- `packages/ui/.../PlantRecipeDetailScreen.tsx` — **solo si falta prop; preferir no tocar**

---

## Files forbidden

- `apps/api/**`
- `apps/api/prisma/**`
- `package.json`

---

## API mapping

| UI callback     | HTTP                                                                     |
| --------------- | ------------------------------------------------------------------------ |
| `onStart`       | `POST /api/plant/orders/:id/start`                                       |
| `onPause`       | `POST /api/plant/orders/:id/operator/pause`                              |
| `onResume`      | `POST /api/plant/orders/:id/operator/resume`                             |
| `onNextStep`    | `POST /api/plant/orders/:id/complete-step` `{ stepId: currentPhase.id }` |
| `onFinishOrder` | `POST /api/plant/orders/:id/finish`                                      |
| carga inicial   | `GET /api/plant/orders/:id/recipe`                                       |
| `onReportIssue` | `POST /api/plant/incidents` (MES-08 existente)                           |

---

## Acceptance criteria

- [ ] Pantalla carga receta real desde API (no mock).
- [ ] Botones deshabilitados según estado (ej. PAUSAR solo si `in_progress`).
- [ ] Contador ≥ 3rem visible (ya en UI); tick local sin depender de WS.
- [ ] Offline: acción encolada y sincronizada (manual test con airplane mode).
- [ ] `pnpm --filter @restopsiq/plant test` pasa para hooks nuevos.

---

## Validation commands

```bash
pnpm --filter @restopsiq/plant typecheck
pnpm --filter @restopsiq/plant test
# Manual: tablet o emulador — ciclo completo contra API local
```
