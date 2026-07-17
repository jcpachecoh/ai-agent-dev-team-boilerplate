import type { Os380ConceptFieldCoverage } from '../adapters/os380-payroll-concept.adapter';

export const PAYROLL_CONCEPT_USAGE_STATUSES = [
  'CATALOGED',
  'UNCATALOGED',
  'INACTIVE',
  'NAME_MISMATCH',
] as const;

export type PayrollConceptUsageStatus = (typeof PAYROLL_CONCEPT_USAGE_STATUSES)[number];

export type SettlementLineUsageExample = {
  settlementId: string;
  settlementStatus: string;
  lineId: string;
};

export type SettlementLineUsageRow = {
  code: string;
  name: string;
  status: PayrollConceptUsageStatus;
  catalogDisplayName: string | null;
  usageCount: number;
  examples: SettlementLineUsageExample[];
};

/**
 * Reporte administrativo OS-612 — usados vs catalogados.
 * Fuente persistida: SettlementLine (liquidación definitiva).
 * OS-380 coverage es estática (adapter); no implica ledger mensual.
 */
export type PayrollConceptsUsageReport = {
  tenantId: string;
  generatedAt: string;
  /** Distinct code/name desde SettlementLine del tenant. */
  settlementLineUsages: SettlementLineUsageRow[];
  summary: {
    distinctPairs: number;
    cataloged: number;
    uncataloged: number;
    inactive: number;
    nameMismatch: number;
  };
  /**
   * Cobertura estática campo OS-380 → concept code (registry/adapter).
   * No afirma persistencia mensual de líneas.
   */
  os380FieldCoverage: {
    note: string;
    fields: readonly Os380ConceptFieldCoverage[];
    mappedFieldCount: number;
  };
};
