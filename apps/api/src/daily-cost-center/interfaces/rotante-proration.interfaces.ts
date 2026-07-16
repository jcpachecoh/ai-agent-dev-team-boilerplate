/**
 * CONN-06 — Prorrateo de costo laboral por sede real (NOM-24).
 * Solo participan empleados con costCenter = ROTANTE (epic PC-3/PC-4).
 * El cálculo ocurre al generar el informe, nunca en liquidación de nómina (D4).
 */
export interface RotanteProrationInput {
  tenantId: string;
  employeeId: string;
  periodStart: Date;
  periodEnd: Date;
  /** Costo laboral total del empleado en el período (Decimal como number en la interfaz; el service usa Decimal internamente). */
  totalLaborCost: number;
}

export interface RotanteProrationAllocation {
  locationId: string;
  locationName: string;
  days: number;
  proportion: number;
  proratedCost: number;
}

export interface RotanteProrationResult {
  employeeId: string;
  totalDaysAssigned: number;
  /** Días del período sin asignación — costo no prorrateado a sedes (D5), advertir en NOM-24. */
  pendingDaysCount: number;
  allocations: RotanteProrationAllocation[];
}

/** Reutilizable como base para NOM-18 (contabilidad) sin implementar la integración contable. */
export interface IRotanteProrationService {
  prorate(input: RotanteProrationInput): Promise<RotanteProrationResult>;
}
