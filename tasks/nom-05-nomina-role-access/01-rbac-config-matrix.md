# NOM-05 Task 01 — Matriz de permisos (config central)

**Domain:** `[SHARED]` `[FRONTEND]` `[BACKEND]` `[RBAC]`  
**Status:** `pending`  
**Depends On:** [00-epic-and-decisions.md](./00-epic-and-decisions.md)

---

## Goal

Centralizar qué roles pueden acceder a cada módulo de la web-app y qué operaciones HTTP permite el rol `NOMINA` en nómina.

---

## Scope

- [ ] Crear `apps/web-app/src/config/rbac.config.ts` con:
  - `AppModule` enum
  - `MODULE_ROLES: Record<AppModule, RoleCode[]>`
  - `NOMINA_READ_ONLY_HTTP_METHODS` (o equivalente)
  - Helper `canAccessModule(roleCode, module): boolean`
- [ ] Crear `apps/api/src/common/config/rbac.config.ts` con la misma matriz de módulos/roles (tipos alineados).
- [ ] Mapear cada entrada de `navigationItems` (`id` del módulo padre) a un `AppModule`.
- [ ] Mapear prefijos de ruta a módulo (`/payroll` → `NOMINA`, `/inventory` → `INVENTARIOS`, etc.).
- [ ] Exportar tipo `RoleCode` reutilizando códigos del seed (`OWNER`, `SUPERVISOR`, `MANAGER`, `NOMINA`, …).

## Out of scope

- Guards, seed del rol, UI del sidebar, rutas protegidas (tasks 02–04).
- Cambios en `packages/` salvo que se decida extraer tipos compartidos (no requerido en esta fase).

## Files allowed

- `apps/web-app/src/config/rbac.config.ts`
- `apps/web-app/src/config/rbac.config.test.ts`
- `apps/api/src/common/config/rbac.config.ts`
- `apps/api/src/common/config/rbac.config.spec.ts` (opcional, si se agrega lógica no trivial)

## Files forbidden

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/**`
- `packages/**`
- `apps/web-app/src/components/**` (Task 03)
- `apps/api/src/common/guards/**` (Task 02)
- `package.json`, `pnpm-lock.yaml`

---

## Acceptance criteria

- [ ] `MODULE_ROLES[NOMINA]` incluye solo `OWNER`, `SUPERVISOR`, `MANAGER`, `NOMINA`.
- [ ] `MODULE_ROLES[INVENTARIOS]` **no** incluye `NOMINA`.
- [ ] `canAccessModule('NOMINA', AppModule.NOMINA) === true`.
- [ ] `canAccessModule('NOMINA', AppModule.INVENTARIOS) === false`.
- [ ] Matriz documentada en comentario con referencia a OS-478.
- [ ] Tests unitarios del helper en web-app pasan.

## Validation commands

```bash
pnpm --filter @restopsiq/web-app test -- src/config/rbac.config.test.ts
pnpm --filter @restopsiq/web-app typecheck
pnpm --filter @restopsiq/api typecheck
```

## Notes

- No hardcodear listas de roles en `Sidebar.tsx` ni en controllers; consumir solo esta config.
- Si `RoleCode` ya existe en `@restopsiq/types` o auth types, reutilizar en lugar de duplicar.
