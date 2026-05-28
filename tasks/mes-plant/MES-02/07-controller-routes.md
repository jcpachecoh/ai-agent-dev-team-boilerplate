# MES-02 Task 07 — Controller & Routes

## Goal

Implement `PlantController` with all MES-02 routes, MES JWT auth, and tenant extraction from `req.user.tenantId`.

**Depends on:** Tasks 03–06.

---

## Scope

- Create `apps/api/src/mes/plant/controller/plant.controller.ts`.
- Wire all routes from main spec.
- `@ApiTags('plant')`, `@Controller('plant')`, `@Public()` + `@UseGuards(MesJwtGuard)` on all routes.
- `@ApiBearerAuth()` for Swagger.

---

## Out of Scope

- `PlantModule` registration (task 08).
- Tests (task 09).
- Modifying `MesAuthController` or guards implementation.

---

## Files allowed

- `apps/api/src/mes/plant/controller/plant.controller.ts` — create

---

## Files forbidden

- `apps/api/src/mes/auth/controller/**` (no edits)
- `apps/api/src/mes/auth/service/**` (no edits)
- `apps/api/src/supplyitems/**`
- `apps/api/prisma/**`
- `app.module.ts` (task 08)
- `package.json` / `pnpm-lock.yaml`

---

## Implementation notes

### Auth pattern (same as mes/auth protected routes)

```typescript
@Public()
@UseGuards(MesJwtGuard)
@ApiBearerAuth()
```

Import `MesJwtGuard` from `../../auth/guards/mes-jwt.guard` (or exported path from module in task 08).

### Tenant

```typescript
type MesRequest = Request & { user: MesJwtPayload };
// ...
create(@Req() req: MesRequest, @Body() dto: CreateWorkstationDto) {
  return this.plantService.createWorkStation(req.user.tenantId, dto);
}
```

**Do not** use `@Headers('x-tenant-id')` on plant routes.

### Route order

Register before generic `:id` routes where needed:

1. `PATCH recipes/:id/phases/reorder`
2. `POST recipes/:id/clone`
3. `GET recipes/:id`
4. Other `recipes/:id` routes

### Controller rules

- Inject `PlantService` only.
- No repository imports.
- No business logic.

---

## Acceptance criteria

- [ ] All epic routes implemented under `/plant`.
- [ ] Every handler passes `req.user.tenantId` to service.
- [ ] All routes use `@Public()` + `MesJwtGuard`.
- [ ] Controller does not import repository.
- [ ] `pnpm --filter=@restopsiq/api typecheck` passes.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
```
