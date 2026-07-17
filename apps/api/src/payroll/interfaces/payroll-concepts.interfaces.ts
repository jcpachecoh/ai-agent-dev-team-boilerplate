import type { PayrollConcept, PayrollConceptLineNature } from '@prisma/client';

export type PayrollConceptRecord = PayrollConcept;

export type CreatePayrollConceptRecord = {
  tenantId: string | null;
  tenantScope: string;
  code: string;
  displayName: string;
  lineNature: PayrollConceptLineNature;
};

export type UpdatePayrollConceptDisplayNameRecord = {
  displayName: string;
};

/** Concepto efectivo tras resolver GLOBAL + override de etiqueta. */
export type EffectivePayrollConcept = {
  /** ID de la fila GLOBAL (identidad canónica para futuros FKs). */
  id: string;
  code: string;
  displayName: string;
  lineNature: PayrollConceptLineNature;
  /** true si displayName proviene de override tenant activo. */
  isTenantOverride: boolean;
  /** ID de la fila override, si aplica. */
  overrideId: string | null;
};

export interface IPayrollConceptsRepository {
  findActiveByScopeAndCode(tenantScope: string, code: string): Promise<PayrollConcept | null>;
  findByScopeAndCodeIncludingDeleted(
    tenantScope: string,
    code: string,
  ): Promise<PayrollConcept | null>;
  create(data: CreatePayrollConceptRecord): Promise<PayrollConcept>;
  updateDisplayName(id: string, displayName: string): Promise<PayrollConcept>;
}

export interface IPayrollConceptsService {
  findGlobalByCode(code: string): Promise<PayrollConcept>;
  findTenantOverrideByCode(tenantId: string, code: string): Promise<PayrollConcept | null>;
  resolveEffective(
    tenantId: string | null | undefined,
    code: string,
  ): Promise<EffectivePayrollConcept>;
}
