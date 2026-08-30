# USR-01 Task 03 — Role & DocumentType Schema

## Goal

Add the `DocumentType` enum and tenant-scoped `Role` model to `schema.prisma`. `Role` is required because it does not exist today and `User.roleId` (task 04) depends on it.

**Depends on:** Task 02 (TestLab tables dropped; `users` table name free in DB).

---

## Scope

- Add `DocumentType` enum: `CC`, `CE`, `PASAPORTE`, `TI`, `PEP`.
- Add `Role` model with tenant-scoped identity and indexes.
- Run `prisma format`, `prisma validate`, `prisma generate`.
- Nothing else.

### Suggested `Role` shape

```prisma
enum DocumentType {
  CC
  CE
  PASAPORTE
  TI
  PEP
}

model Role {
  id          String   @id @default(cuid())
  tenantId    String
  code        String   // e.g. OWNER, SUPERVISOR, MANAGER, OPERATOR, ADMIN
  name        String   // display name
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([tenantId, code])
  @@index([tenantId, isActive])
  @@map("roles")
}
```

**Design decisions:**

- `Role` is tenant-scoped (`tenantId` + `code` unique) — aligns with multi-tenant patterns used by `Supplier`, `SupplyItem`, etc.
- `OperationalRole` enum on `OperationalUser` is **not** removed in this task — it remains until MES auth migrates to `roleId`.
- Do not add `User` model or `User.roleId` relation yet (task 04).
- Do not add back-relations from `Role` to `User` until `User` exists (task 04).

---

## Out of scope

- No migrations.
- No `User` model.
- No changes to `OperationalUser`.
- No seed data for roles (task 07).
- No changes to `apps/api/src/`.

---

## Allowed files

- `apps/api/prisma/schema.prisma` — append enum + `Role` model only

---

## Forbidden files

- Any file under `apps/api/src/`
- Any file under `packages/`
- `apps/api/prisma/migrations/**`
- `apps/api/prisma/seed.ts`
- `package.json` / `pnpm-lock.yaml`
- `scripts/validate-structure.js`
- `apps/api/src/app.module.ts`

---

## Acceptance criteria

- [x] `DocumentType` enum exists with values CC, CE, PASAPORTE, TI, PEP.
- [x] `Role` model exists with `tenantId`, `code`, `name`, `isActive`, timestamps.
- [x] `@@unique([tenantId, code])` and `@@index([tenantId, isActive])` on `Role`.
- [x] `@@map("roles")` on `Role`.
- [x] `OperationalRole` enum and `OperationalUser` model are unchanged.
- [x] No `User` model added yet.
- [x] `npx prisma format` exits 0.
- [x] `npx prisma validate` exits 0.
- [x] `npx prisma generate` exits 0.

---

## Validation commands

```bash
cd apps/api
npx prisma format
npx prisma validate
npx prisma generate
```

---

## Risks

| Risk                          | Notes                                                                                        |
| ----------------------------- | -------------------------------------------------------------------------------------------- |
| Dual role systems             | `OperationalRole` enum and `Role` table coexist temporarily — document mapping in task 07/09 |
| `Role.code` vs display `name` | Align seed codes with `OperationalRole` values for easier backfill                           |
| Schema/DB drift               | `roles` table does not exist in DB until task 06 — expected                                  |

---

## Stop rule

**Stop after this task.** Report files changed and validation results. **Do not proceed to task 04 (User schema) without explicit approval.**
