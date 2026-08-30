# NOM-07-02 — Tab Datos personales

**Parent:** `00-epic.md`  
**Status:** `in_progress`  
**Depends on:** `01-profile-shell-and-tabs.md`  
**Blocks:** ninguna (paralelo con 03–07)

---

## Goal

Implementar la sección **Datos personales** del perfil de empleado: visualización, edición con RBAC por campo, foto de perfil, geo encadenado y auditoría.

---

## Scope

- Prisma: modelo `EmployeePersonalData` + enums `MaritalStatus`, `Gender`
- API REST:
  - `GET /api/employees/:userId/datos-personales`
  - `PUT /api/employees/:userId/datos-personales`
  - `POST /api/employees/:userId/foto-perfil` (multipart)
  - `GET /api/geo/departamentos`
  - `GET /api/geo/ciudades?departamento=`
- Módulo Nest `employee-personal-data` + módulo `geo`
- RBAC backend: empleado (propio perfil) vs RRHH/Admin
- AuditLog por campo en PUT
- Web-app: tab `personal` con formulario, preview de foto, validaciones
- Hook `useEmployeePersonalDataFieldPermission`

---

## Out of Scope

- Tabs 03–07
- Enmascaramiento avanzado (task 08) — solo readonly UI por rol
- GraphQL (REST únicamente en esta task)
- NIT en `DocumentType` (usar tipos existentes CC/CE/TI/PASAPORTE)

---

## Files allowed

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/**/migration.sql` (solo personal data)
- `apps/api/src/employee-personal-data/**`
- `apps/api/src/geo/**`
- `apps/api/src/app.module.ts`
- `apps/api/src/storage/image/image-processor.ts` (perfil 400×400)
- `apps/web-app/src/features/payroll/**` (personal data tab, hooks, client, types)
- `packages/ui/src/components/empleado/**` (solo si se requieren componentes nuevos de formulario)

---

## Files forbidden

- `package.json`, `pnpm-lock.yaml`
- `apps/api/src/payroll/**` (salvo si se necesita export compartido — evitar)
- Auth existente
- Tasks 03–08

---

## Acceptance criteria

- [ ] Tab `personal` muestra todos los campos; vacíos como `—`
- [ ] RBAC: empleado edita teléfono, dirección, barrio, localidad, contacto emergencia, foto
- [ ] RBAC: RRHH/Admin edita todos los campos
- [ ] PUT con campos no permitidos → 403
- [ ] Foto: circular o iniciales; upload JPG/PNG ≤2MB; preview antes de guardar; resize 400×400
- [ ] Validaciones frontend + backend según spec
- [ ] Departamento → ciudad encadenados
- [ ] AuditLog en cambios
- [ ] Toast éxito / errores por campo

---

## Validation

```bash
pnpm --filter api exec prisma validate
pnpm --filter api exec prisma generate
pnpm --filter api test -- employee-personal-data
pnpm --filter web-app typecheck
node scripts/validate-structure.js
```
