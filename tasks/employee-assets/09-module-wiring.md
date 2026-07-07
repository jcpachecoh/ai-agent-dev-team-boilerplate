# OS-558 Task 09 — Module wiring: registrar en `PayrollModule`

## Goal

Registrar `EmployeeAssetsRepository`, `EmployeeAssetsService`, `EmployeeAssetsController`, y `EmployeeAssetsResolver` en `PayrollModule`. Verificar que la estructura del módulo siga el estándar del proyecto.

**Depends on:** Tasks 03, 04, 06, 07.

---

## Scope

- `apps/api/src/payroll/payroll.module.ts`

---

## Out of scope

- Cualquier otro módulo.
- Nuevas funcionalidades.

---

## Files allowed

- `apps/api/src/payroll/payroll.module.ts`

---

## Referencia: patrón existente

Ver cómo están registrados `EmployeePositionsRepository`, `EmployeePositionsService`, `EmployeePositionsController`, `EmployeePositionsResolver` en el mismo archivo.

---

## Implementation

```typescript
// Agregar a los arrays existentes de PayrollModule:

@Module({
  imports: [...],
  providers: [
    // ... existentes ...
    EmployeeAssetsRepository,
    EmployeeAssetsService,
    EmployeeAssetsResolver,
  ],
  controllers: [
    // ... existentes ...
    EmployeeAssetsController,
  ],
  exports: [
    // ... existentes ...
    EmployeeAssetsService, // exportar para uso en PayrollCalculationService (Task 08)
  ],
})
export class PayrollModule {}
```

---

## Acceptance criteria

- [ ] `EmployeeAssetsRepository` en `providers`.
- [ ] `EmployeeAssetsService` en `providers` y `exports`.
- [ ] `EmployeeAssetsResolver` en `providers`.
- [ ] `EmployeeAssetsController` en `controllers`.
- [ ] `pnpm --filter=@restopsiq/api build` exit 0 (sin errores de DI).
- [ ] `node scripts/validate-structure.js` pasa (si aplica al módulo).
- [ ] `pnpm typecheck` exit 0.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api build
pnpm --filter=@restopsiq/api typecheck
node scripts/validate-structure.js 2>/dev/null || echo "script no aplica"
```
