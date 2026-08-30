# LOC-02 Task 08-06 — Module Wiring

## Goal

Registrar `UserLocationsRepository`, `UserLocationsService` y `UserLocationsResolver` en `LocationsModule`.

**Depends on:** Tasks 08-02–08-05.

---

## Scope

- Modificar `apps/api/src/locations/locations.module.ts`.
- Agregar providers y exportar `UserLocationsService` si otros módulos lo necesitan.

---

## Out of scope

- No cambios a `AppModule` (ya importa `LocationsModule` desde LOC-01).
- No migraciones ni tests adicionales.

---

## Files allowed

- `apps/api/src/locations/locations.module.ts` — modify

---

## Files forbidden

- `apps/api/prisma/schema.prisma`
- `apps/api/src/app.module.ts`
- `package.json` / `pnpm-lock.yaml`

---

## Implementation notes

```typescript
@Module({
  imports: [PrismaModule],
  providers: [
    LocationsRepository,
    LocationsService,
    LocationsResolver,
    UserLocationsRepository, // NEW
    UserLocationsService, // NEW
    UserLocationsResolver, // NEW
  ],
  exports: [LocationsService, UserLocationsService],
})
export class LocationsModule {}
```

---

## Acceptance criteria

- [ ] Tres nuevos providers registrados.
- [ ] `UserLocationsService` exportado.
- [ ] `node scripts/validate-structure.js` pasa.
- [ ] `pnpm --filter=@restopsiq/api typecheck` pasa.
- [ ] Suite `user-locations` completa pasa.

---

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=user-locations --coverage
```

---

## Stop rule

**Detener después de esta tarea.** Reportar archivos cambiados y resultados de validación. Epic LOC-02 completo.
