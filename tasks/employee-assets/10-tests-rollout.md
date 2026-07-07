# OS-558 Task 10 — Tests E2E, Postman, checklist rollout

## Goal

Pruebas de integración E2E del flujo completo de activos, colección Postman actualizada, y checklist de rollout a staging/prod.

**Depends on:** Tasks 01–09 completos.

---

## Scope

- `apps/api/test/employee-assets.e2e-spec.ts`
- Actualizar colección Postman en `postman/`

---

## Out of scope

- Tests unitarios (cubiertos en Tasks 03–07).
- Frontend.

---

## E2E — Flujos a cubrir

```typescript
// employee-assets.e2e-spec.ts

describe('EmployeeAssets E2E', () => {
  // Setup: crear tenant, usuario con JWT válido, employeeDetails de prueba

  it('POST /employee-assets → crea activo correctamente', async () => {
    // body: { employeeId, assetName, value }
    // expect: 201, body.status === 'ACTIVO', body.tenantId === tenantId del JWT
  });

  it('POST /employee-assets → 409 si activo ACTIVO duplicado', async () => {
    // crear primero, luego intentar crear mismo assetName para mismo employeeId
    // expect: 409 ConflictException
  });

  it('GET /employee-assets?employeeId=... → lista activos del empleado', async () => {
    // expect: 200, array con activos del tenant
  });

  it('GET /employee-assets?employeeId=...&status=ACTIVO → filtra por status', async () => {
    // crear ACTIVO y RETORNADO, filtrar ACTIVO
    // expect: solo el ACTIVO
  });

  it('PATCH /employee-assets/:id → actualiza status a RETORNADO', async () => {
    // body: { status: 'RETORNADO', notes: 'Devuelto por renuncia' }
    // expect: 200, body.status === 'RETORNADO'
  });

  it('GET /employee-assets/:id → 404 si no existe en tenant', async () => {
    // id de otro tenant
    // expect: 404
  });

  it('GET /employee-assets sin token → 401', async () => {
    // sin Authorization header
    // expect: 401
  });
});
```

---

## Postman collection

Agregar carpeta `Employee Assets` en la colección existente con requests:

1. `POST /employee-assets` — con ejemplo de body y JWT.
2. `GET /employee-assets` — con query params `employeeId` y `status`.
3. `GET /employee-assets/:id`
4. `PATCH /employee-assets/:id` — ejemplos de cambio a `RETORNADO` y `DADO_DE_BAJA`.

---

## Checklist rollout

### Pre-deploy staging

- [ ] `pnpm lint && pnpm typecheck && pnpm test --coverage` — todo verde.
- [ ] Migración revisada: SQL contiene `CREATE TYPE asset_status` y `CREATE TABLE employee_assets`.
- [ ] Rama `feat/OS-558-employee-assets` tiene PR abierto hacia `develop`.
- [ ] PR revisado y aprobado por Juan Carlos.

### Deploy staging

- [ ] `npx prisma migrate deploy` en staging — sin errores.
- [ ] Smoke test manual: crear activo via Postman apuntando a `api-stg.opssynk.com`.
- [ ] Smoke test: intentar duplicar activo ACTIVO → confirmar 409.
- [ ] Smoke test: actualizar a `RETORNADO` → confirmar 200.

### Deploy prod (si aplica en este sprint)

- [ ] Backup de BD prod antes de migrar.
- [ ] `npx prisma migrate deploy` en prod.
- [ ] Smoke test en prod con dato real de empleado.

---

## Acceptance criteria

- [ ] E2E cubre 7 casos descritos.
- [ ] Postman collection actualizada con 4 requests.
- [ ] Checklist de rollout completado para staging.
- [ ] `pnpm test:e2e` pasa.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api test:e2e -- --testPathPattern=employee-assets
pnpm lint && pnpm typecheck && pnpm test --coverage
```
