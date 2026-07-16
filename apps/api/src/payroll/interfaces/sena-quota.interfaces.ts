/**
 * OS-599 — estimación de cumplimiento de cuota de aprendizaje SENA (Ley 789/2002).
 * `estimated: true` siempre: la cuota oficial la fija la regional SENA; este motor
 * no persiste ni sustituye el acto administrativo.
 */

export type SenaQuotaStatus = 'EXEMPT' | 'COMPLIANT' | 'PENDING';

/**
 * Régimen legal aplicado a la monetización estimada (as-of cierre del período).
 * - LEY_789_2002: art. 34 (5% × trabajadores × SMLMV, parcial proporcional) — antes de 2025-06-25
 * - LEY_2466_2025: art. 23 (1.5 SMLMV por aprendiz faltante) — desde 2025-06-25 inclusive
 */
export type SenaMonetizationRegime = 'LEY_789_2002' | 'LEY_2466_2025';

/** Período de nómina `YYYY-MM` (mismo convenio que `GET /api/reports/payroll`). */
export type SenaQuotaPeriod = string;

export type SenaQuotaResult = {
  period: SenaQuotaPeriod;
  /** Trabajadores computables (excluye PRESTACION y APRENDIZAJE) al cierre del período. */
  eligibleWorkers: number;
  requiredApprentices: number;
  activeApprentices: number;
  missingApprentices: number;
  smlv: number;
  monetizationRegime: SenaMonetizationRegime;
  /** COP enteros — ver `estimateMonetizationAmount` (fórmula según régimen). */
  estimatedMonetizationAmount: number;
  status: SenaQuotaStatus;
  estimated: true;
};

export interface ISenaQuotaService {
  calculateForTenant(tenantId: string, period: SenaQuotaPeriod): Promise<SenaQuotaResult>;
}
