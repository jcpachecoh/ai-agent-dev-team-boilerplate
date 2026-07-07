# OS-558 Task 01 — Prisma Schema: `EmployeeAsset` + enum `AssetStatus`

## Goal

Agregar el enum `AssetStatus` y el modelo `EmployeeAsset` al schema de Prisma, vinculado a `EmployeeDetails`. Ejecutar format, validate y generate.

**Depends on:** Ninguna.

---

## Scope

- Modificar `apps/api/prisma/schema.prisma` únicamente.
- Ejecutar `prisma format`, `prisma validate`, `prisma generate`.

---

## Out of scope

- Migración SQL (Task 01b).
- Código en `apps/api/src/`.
- Cambios a `package.json` / `pnpm-lock.yaml`.

---

## Files allowed

- `apps/api/prisma/schema.prisma`

---

## Files forbidden

- `apps/api/src/**`
- `packages/**`
- Migraciones existentes
- `package.json` / `pnpm-lock.yaml`

---

## Implementation

### Enum `AssetStatus`

```prisma
enum AssetStatus {
  ACTIVO
  RETORNADO
  DADO_DE_BAJA
}
```

### Enum `AssetType`

```prisma
enum AssetType {
  EDUCATIONAL
  FINANCIAL
  LEGAL
  DEPENDANTS
}
```

### Relación en `EmployeeDetails`

Agregar al modelo existente `EmployeeDetails`:

```prisma
model EmployeeDetails {
  // ... campos existentes (no tocar) ...

  assets EmployeeAsset[]
}
```

### Modelo `EmployeeAsset`

```prisma
model EmployeeAsset {
  id               String      @id @default(cuid())
  tenantId         String
  employeeId       String
  assetName        String
  type             AssetType
  assignmentDate   DateTime    @default(now())
  value            Decimal     @db.Decimal(12, 2)
  status           AssetStatus @default(ACTIVO)
  notes            String?
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt

  employee EmployeeDetails @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([employeeId])
  @@index([tenantId, status])
  @@index([employeeId, status])
  @@index([tenantId, type])
  @@map("employee_assets")
}
```

**Design decisions:**

- `assetName` string libre — MVP no requiere catálogo FK. Extender en v2 si se necesita.
- `type` enum `AssetType` — categoriza el activo en `EDUCATIONAL`, `FINANCIAL`, `LEGAL`, `DEPENDANTS`. Requerido, no nullable.
- `value` Decimal(12,2) — valor en COP al momento de asignación.
- `status` enum — ciclo de vida en el campo, no hard delete.
- `notes` nullable — observaciones de retorno / baja.
- `onDelete: Cascade` — si se elimina un `EmployeeDetails` (edge case), se limpian sus activos.
- Sin `@@unique([employeeId, assetName])` en schema — la unicidad de activos activos se valida en servicio (permite reasignar mismo activo tras retorno).
- `@@index([tenantId, type])` — facilita consultas de nómina filtrando por categoría (ej. solo activos FINANCIAL).

---

## Acceptance criteria

- [ ] Enum `AssetStatus` definido con `ACTIVO`, `RETORNADO`, `DADO_DE_BAJA`.
- [ ] Enum `AssetType` definido con `EDUCATIONAL`, `FINANCIAL`, `LEGAL`, `DEPENDANTS`.
- [ ] Modelo `EmployeeAsset` mapeado a `employee_assets` con campo `type AssetType`.
- [ ] `EmployeeDetails.assets` relación `EmployeeAsset[]` presente.
- [ ] `npx prisma format` exit 0.
- [ ] `npx prisma validate` exit 0.
- [ ] `npx prisma generate` exit 0.
- [ ] No se creó migración.

---

## Validation commands

```bash
cd apps/api
npx prisma format
npx prisma validate
npx prisma generate
```
