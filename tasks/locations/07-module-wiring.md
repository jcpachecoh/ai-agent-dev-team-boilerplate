# LOC-01 Task 07 — Module Wiring

## Goal

Registrar `LocationsModule` en la aplicación NestJS.

**Depends on:** Tasks 03–06 (repository, service, resolver, DTOs).

---

## Scope

- Crear `apps/api/src/locations/locations.module.ts`.
- Importar `PrismaModule`.
- Registrar providers: `LocationsRepository`, `LocationsService`, `LocationsResolver`.
- Exportar `LocationsService` (para uso futuro por otros módulos, ej. payroll).
- Registrar `LocationsModule` en `AppModule`.

---

## Out of scope

- No nuevos endpoints REST.
- No migraciones.
- No tests adicionales (cubiertos en tasks anteriores).

---

## Files allowed

- `apps/api/src/locations/locations.module.ts` — create
- `apps/api/src/app.module.ts` — agregar import de `LocationsModule`

---

## Files forbidden

- `apps/api/prisma/schema.prisma`
- `package.json` / `pnpm-lock.yaml`

---

## Implementation notes

```typescript
// locations.module.ts
@Module({
  imports: [PrismaModule],
  providers: [LocationsRepository, LocationsService, LocationsResolver],
  exports: [LocationsService],
})
export class LocationsModule {}
```

```typescript
// app.module.ts — agregar a imports[]
import { LocationsModule } from './locations/locations.module';
```

Patrón de referencia: `apps/api/src/supply-categories/supply-categories.module.ts` (sin controller REST en esta tarea).

---

## Acceptance criteria

- [ ] `LocationsModule` creado con estructura válida.
- [ ] `LocationsModule` importado en `AppModule`.
- [ ] `LocationsService` exportado del módulo.
- [ ] `node scripts/validate-structure.js` pasa.
- [ ] `pnpm --filter=@restopsiq/api typecheck` pasa.
- [ ] Suite completa de locations pasa.

---

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=locations --coverage --collectCoverageFrom='src/locations/**/*.ts'
```

**Cobertura esperada:** service > 80% (criterio del epic).
