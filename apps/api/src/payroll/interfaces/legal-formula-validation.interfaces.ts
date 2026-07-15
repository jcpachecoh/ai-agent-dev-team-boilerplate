// OS-591 (fase 3) — Constancia legal de que una versión de `INDEMNIZACION_FORMULA_VERSION`
// fue revisada/validada por el equipo legal. Ver tasks/OS-591.md §15.1.

export type IndemnificationFormulaValidationRecord = {
  id: string;
  tenantId: string;
  formulaVersion: number;
  isActive: boolean;
  legalReference: string;
  observations: string | null;
  validatedBy: string;
  validatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateLegalFormulaValidationData = {
  tenantId: string;
  formulaVersion: number;
  legalReference: string;
  observations?: string | null;
  validatedBy: string;
  validatedAt: Date;
};

export interface ILegalFormulaValidationRepository {
  /** Validación ACTIVA para (tenantId, formulaVersion), o null si no existe. */
  findActive(
    tenantId: string,
    formulaVersion: number,
  ): Promise<IndemnificationFormulaValidationRecord | null>;
  findAllByTenant(tenantId: string): Promise<IndemnificationFormulaValidationRecord[]>;
  /**
   * Desactiva (si existe) la validación activa de la misma versión y crea una nueva fila
   * activa — nunca sobre-escribe, conserva historial completo. Transacción atómica.
   */
  create(data: CreateLegalFormulaValidationData): Promise<IndemnificationFormulaValidationRecord>;
}

export interface ILegalFormulaValidationService {
  findActive(
    tenantId: string,
    formulaVersion: number,
  ): Promise<IndemnificationFormulaValidationRecord | null>;
  listByTenant(tenantId: string): Promise<IndemnificationFormulaValidationRecord[]>;
  validate(data: CreateLegalFormulaValidationData): Promise<IndemnificationFormulaValidationRecord>;
}
