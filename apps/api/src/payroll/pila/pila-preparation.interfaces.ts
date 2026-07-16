import type { ArlRiskLevel, EmployeeContractType, SalaryType } from '@prisma/client';

import type { PilaErrorCode } from './pila-error-codes';

/** Error estructurado de preparación PILA (sin serializar Anexo Técnico). */
export interface PilaValidationError {
  code: PilaErrorCode;
  field: string;
  message: string;
  employeeId?: string;
  employeeName?: string;
}

export interface PilaAportanteDraft {
  legalName: string;
  documentType: string;
  nit: string;
  verificationDigit: string;
  tipoPlanilla: 'E';
  formaPresentacion: string;
  tipoAportante: string;
  claseAportante: string;
  naturalezaJuridica: string;
  arlCode: string;
  actividadEconomicaArl: string;
  periodHealth: string;
  periodOther: string;
  exemptFromHealthSenaIcbfLey1607: boolean;
}

export interface PilaCotizanteContributionsDraft {
  /** Montos COP entregados por OS-380 (no recalculados aquí). */
  employeeHealth: number;
  employeePension: number;
  employerHealth: number;
  employerPension: number;
  employerArl: number;
  employerSena: number;
  employerIcbf: number;
  employerCaja: number;
  /** Tasas de referencia del motor (constantes), informativas. */
  employeeHealthPct: number;
  employeePensionPct: number;
  employerHealthPct: number;
  employerPensionPct: number;
  employerSenaPct: number;
  employerIcbfPct: number;
  employerCajaPct: number;
  employerArlPct: number;
}

export interface PilaCotizanteDraft {
  employeeId: string;
  documentType: string;
  documentNumber: string;
  firstName: string;
  firstLastName: string;
  secondLastName: string | null;
  tipoCotizante: '01';
  afpCode: string;
  epsCode: string;
  arlCode: string;
  ccfCode: string;
  departmentCode: string;
  municipalityCode: string;
  /** Nombre de ciudad de la sede (para XLSX; TXT usa solo códigos DIVIPOLA). */
  locationCityName: string | null;
  workedDays: number;
  salaryAmount: number;
  isIntegralSalary: boolean;
  contributionBase: number;
  contributions: PilaCotizanteContributionsDraft;
  arlRiskClass: string;
  actividadEconomicaArl: string;
  workCenterCode: string;
  contractType: EmployeeContractType;
  salaryType: SalaryType;
}

export interface PilaTotalsDraft {
  employeeCount: number;
  totalPayrollCost: number;
  totalEmployeeContributions: number;
  totalEmployerContributions: number;
}

export interface PilaPeriodDraft {
  tenantId: string;
  period: string;
  aportante: PilaAportanteDraft;
  cotizantes: PilaCotizanteDraft[];
  totals: PilaTotalsDraft;
}

export type PilaPreparationResult =
  | { ok: true; data: PilaPeriodDraft; errors: [] }
  | { ok: false; data: null; errors: PilaValidationError[] };

/** Enriquecimiento batch (catálogos + datos personales + sede). */
export interface PilaEmployeeEnrichment {
  employeeId: string;
  employeeName: string;
  documentType: string | null;
  documentNumber: string | null;
  firstName: string | null;
  firstLastName: string | null;
  secondLastName: string | null;
  hireDate: Date;
  contractStart: Date;
  contractEnd: Date | null;
  epsName: string;
  pensionFundName: string;
  arlName: string;
  cajaCompensacion: string;
  arlRiskLevel: ArlRiskLevel;
  departmentCode: string | null;
  municipalityCode: string | null;
  locationCode: string | null;
  locationCityName: string | null;
  epsPilaCode: string | null;
  afpPilaCode: string | null;
  arlPilaCode: string | null;
  ccfPilaCode: string | null;
}

export interface PilaEmployeeEventFlags {
  employeeId: string;
  hasMedicalLeaveInPeriod: boolean;
  hasVacationInPeriod: boolean;
  hasPayrollNovedadInPeriod: boolean;
  hasIngressInPeriod: boolean;
  hasRetirementInPeriod: boolean;
}

export interface PilaOs380EmployeeSlice {
  employeeId: string;
  employeeName: string;
  contractType: EmployeeContractType;
  salaryType: SalaryType;
  salaryAmount: number;
  salaryBase: number;
  /** IBC COP entregado por OS-380 — fuente única para PILA. */
  contributionBase: number;
  workedDays: number;
  healthDeduction: number;
  pensionDeduction: number;
  employerHealthContribution: number;
  employerPensionContribution: number;
  employerArlContribution: number;
  employerSenaContribution: number;
  employerIcbfContribution: number;
  employerCajaContribution: number;
  totalEmployerContributions: number;
  totalPayrollCost: number;
  medicalLeaveOrdinaryDaysExcluded: number;
  medicalLeaveEpsArlDays: number;
}
