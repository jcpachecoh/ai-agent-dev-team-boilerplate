# PROV-LOG Task 05 — Tests, Postman y validación final

**Domain:** `[BACKEND]` `[QA]` `[POSTMAN]`  
**Status:** `pending`  
**Depends on:** Tasks 01–04 completadas

---

## Goal

Validar flujo end-to-end de logística de proveedor: crear con borrador, completar, editar, historial y casos negativos.

---

## Scope

- Carpeta **PROV-LOG — Logística proveedor** en `postman/restopsiq-api.collection.json` (mutations GraphQL).
- Requests:
  1. Login OWNER/MANAGER
  2. `createSupplier` con `logistics` + `saveLogisticsAsDraft: true`
  3. `updateSupplier` completando logística (`status COMPLETE`)
  4. `supplier(id)` — verificar campos logísticos
  5. `updateSupplier` cambiando lead time → verificar historial
  6. Caso negativo: cold chain sin temperatura → error
  7. Caso negativo: sede de otro tenant en cobertura → 403
- Tests FE adicionales si faltan en Task 04.
- Checklist AC en comentario PR.

---

## Out of scope

- E2E Playwright.
- Integración con módulo de compras/OC.

---

## Files allowed

- `postman/restopsiq-api.collection.json`
- `apps/api/src/supplier-logistics/test/**` o `apps/api/src/supplier/test/**`
- `apps/web-app/src/features/proveedores/**/*.test.tsx`
- `tasks/web-app/proveedores/logistica-proveedor/00-epic-and-decisions.md` (marcar AC)

---

## Files forbidden

- Lógica de negocio salvo fixes de bugs QA.
- `package.json` / `pnpm-lock.yaml`

---

## Acceptance criteria

- [ ] Colección Postman importable (GraphQL).
- [ ] Flujo borrador → completo documentado.
- [ ] `pnpm run typecheck` verde en rama feature.
- [ ] Todos los AC de `00-epic-and-decisions.md` verificados.

---

## Validation commands

```bash
pnpm run typecheck
pnpm --filter=@restopsiq/api test:cov
pnpm --filter web-app test
node scripts/validate-structure.js
```
