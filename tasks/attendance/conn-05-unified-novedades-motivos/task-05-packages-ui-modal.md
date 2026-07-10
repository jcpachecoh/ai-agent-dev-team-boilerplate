# CONN-05 Task 05 — packages/ui: modal de marcación

**Domain:** `[PACKAGES]` `[FRONTEND]`  
**Status:** `pending`  
**Depends on:** [Task 01](./task-01-shared-catalog.md)  
**Epic:** [CONN-05](./00-epic-and-decisions.md)

---

## Goal

Actualizar el modal OS-553 en `@restopsiq/ui` para usar el catálogo unificado de motivos, con la misma UX que el resto del design system de asistencia.

---

## Scope

### Componentes

- `packages/ui/src/components/asistencia/shared/asistencia-types.ts`
  - Reemplazar `ASISTENCIA_TARJETA_MARK_REASONS` por import del catálogo shared **o** re-export tipado.
- `packages/ui/src/components/asistencia/asistencia-tarjeta-marking-modal/AsistenciaTarjetaMarkingModal.tsx`
  - Dropdown de motivo con opciones agrupadas (opcional): _Ajuste de asistencia_ | _Novedades de nómina_ | _Incapacidades_.
  - Usar `RecetaFilterSelect` o select del design system (no `<select>` HTML crudo).
  - Placeholder: `Seleccione motivo de cambio…`

### Storybook

- Actualizar story del modal con catálogo completo (muestra incapacidad + permiso + corrección).

### Tests packages (si existen)

- Snapshot / render con nuevas opciones.

---

## Out of scope

- `web-app` (task 06).
- Lógica de API / provisionamiento.

---

## Files allowed

- `packages/ui/src/components/asistencia/**` — modify
- `packages/ui/**/*.stories.tsx` — modify (modal)

---

## Files forbidden

- `apps/web-app/**`
- `apps/api/**`
- `prisma/**`

---

## Acceptance criteria

- [ ] Modal muestra catálogo unificado (no motivos legacy `FORGOT`/`OTHER` en UI nueva).
- [ ] Solo componentes `@restopsiq/ui` / shared — sin estilos inline.
- [ ] Storybook del modal actualizado.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/ui typecheck
pnpm --filter=@restopsiq/ui test -- AsistenciaTarjetaMarkingModal
```
