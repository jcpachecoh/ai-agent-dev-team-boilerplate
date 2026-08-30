# PROV-LOG Task 03 — Borrador, audit e historial logístico

**Domain:** `[BACKEND]` `[AUDIT]`  
**Status:** `pending`  
**Depends on:** [task-02-backend-supplier-logistics-api.md](./task-02-backend-supplier-logistics-api.md)

---

## Goal

Implementar guardado en borrador, detección de responsable de recepción inválido, registro de cambios en `AuditLog` y endpoint/query de historial para administradores.

---

## Scope

- `saveLogisticsAsDraft` en create/update (ya esqueleto en Task 02 — cerrar comportamiento).
- Flag `receptionResponsibleStale` cuando FK usuario no existe o `deletedAt != null`.
- Al `update` logística COMPLETE: diff campo a campo → `AuditLog` (`entityType: SupplierLogistics`).
- Query GraphQL `supplierLogisticsHistory(supplierId)` o campo en `Supplier` (solo roles admin).
- Tests: draft bypass, audit payload, stale user.

---

## Out of scope

- UI historial (Task 04 puede consumir query).
- Notificaciones al responsable de recepción.

---

## Files allowed

- `apps/api/src/supplier-logistics/**` o `apps/api/src/supplier/**`
- `apps/api/src/utils/validation.ts` (si ajuste draft)

---

## Files forbidden

- `apps/web-app/**`
- `packages/**`
- `schema.prisma` / migraciones
- `package.json` / `pnpm-lock.yaml`

---

## Audit payload (ejemplo)

```json
{
  "supplierId": "…",
  "changes": [
    { "field": "leadTimeDays", "old": 3, "new": 5 },
    { "field": "deliveryDays", "old": [1, 3], "new": [1, 2, 3, 4, 5] }
  ]
}
```

---

## Acceptance criteria

- [ ] Borrador guarda sin obligatorios; transición DRAFT → COMPLETE valida todo.
- [ ] Usuario recepción eliminado → `receptionResponsibleStale: true` en lectura.
- [ ] Cada update COMPLETE genera `AuditLog` con actor y diff.
- [ ] Historial ordenado desc por fecha; filtrado por `tenantId`.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api test -- --testPathPattern="supplier-logistics|supplier.service"
```
