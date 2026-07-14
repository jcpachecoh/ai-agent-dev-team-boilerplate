/**
 * OS-588 — fecha de vigencia inicial para el historial salarial/de fondos de un empleado.
 * Misma regla usada por el backfill SQL (ver migración
 * `20260710063101_os588_backfill_compensation_history`): contractStart es la fecha en que
 * el contrato (y su salario/fondo) tomó efecto; hireDate y createdAt son respaldos en ese
 * orden cuando falte el dato anterior.
 */
export function resolveInitialEffectiveDate(employee: {
  contractStart?: Date | null;
  hireDate?: Date | null;
  createdAt?: Date | null;
}): Date {
  return employee.contractStart ?? employee.hireDate ?? employee.createdAt ?? new Date();
}
