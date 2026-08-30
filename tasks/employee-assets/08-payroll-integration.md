# OS-558 Task 08 — Integración con motor de nómina

## Goal

Conectar `EmployeeAssetsService.getActiveAssetsForPayroll` al flujo de cálculo de nómina en `PayrollCalculationService` para que deducciones o beneficios asociados a activos activos sean considerados en el cálculo.

**Depends on:** Task 04 (service), Task 09 (module wiring — `EmployeeAssetsService` disponible en `PayrollModule`).

---

## Scope

- Modificar `apps/api/src/payroll/service/payroll-calculation.service.ts` para llamar `EmployeeAssetsService.getActiveAssetsForPayroll`.
- Actualizar tests existentes si el constructor cambia.

---

## Out of scope

- Lógica contable específica de deducciones (depende de reglas de negocio — ver nota abajo).
- Nuevos endpoints REST/GraphQL.
- Frontend.

---

## Files allowed

- `apps/api/src/payroll/service/payroll-calculation.service.ts`
- `apps/api/src/payroll/test/payroll-calculation.service.spec.ts`

---

## Nota de diseño — Reglas de negocio a confirmar

Antes de implementar cálculos concretos, **confirmar con Juan Carlos** cuál es la regla:

| Opción | Descripción                                                                    |
| ------ | ------------------------------------------------------------------------------ |
| A      | El `value` del activo se descuenta en cuotas del salario (ej. 12 cuotas).      |
| B      | Los activos ACTIVOS generan un beneficio no salarial (no deducción).           |
| C      | Solo se registran para trazabilidad — no impactan el cálculo de nómina en MVP. |

**Para MVP (si no hay confirmación):** implementar solo la consulta de activos activos como contexto disponible en el cálculo, sin aplicar ninguna deducción automática. El motor puede usar esta información en el futuro.

---

## Implementation (MVP — opción C)

```typescript
// En PayrollCalculationService o donde se arma el contexto del cálculo

constructor(
  // ... inyecciones existentes ...
  private readonly employeeAssetsService: EmployeeAssetsService,
) {}

// Dentro del método de cálculo de nómina:
async calculatePayroll(employeeId: string, tenantId: string, ...) {
  // ... lógica existente ...

  const activeAssets = await this.employeeAssetsService.getActiveAssetsForPayroll(
    employeeId,
    tenantId,
  );

  // En MVP: los activos están disponibles como contexto pero no modifican el cálculo.
  // Dejar un comentario claro para extensión futura:
  // TODO OS-558: aplicar regla de deducción/beneficio según decisión de negocio.

  // ... resto del cálculo ...
}
```

---

## Acceptance criteria

- [ ] `PayrollCalculationService` inyecta `EmployeeAssetsService`.
- [ ] `getActiveAssetsForPayroll` se llama con `employeeId` + `tenantId` del tenant actual.
- [ ] Tests del `PayrollCalculationService` actualizados para mockear `EmployeeAssetsService`.
- [ ] `pnpm typecheck` exit 0.
- [ ] `pnpm --filter=@restopsiq/api test` pasa.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api test -- --testPathPattern=payroll-calculation
pnpm --filter=@restopsiq/api typecheck
```
