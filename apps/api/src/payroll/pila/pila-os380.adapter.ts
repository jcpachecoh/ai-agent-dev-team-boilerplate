import { ArlRiskLevel, DocumentType, SalaryType } from '@prisma/client';

import {
  ARL_RATES,
  EMPLOYEE_HEALTH_PCT,
  EMPLOYEE_PENSION_PCT,
  EMPLOYER_CAJA_PCT,
  EMPLOYER_HEALTH_PCT,
  EMPLOYER_ICBF_PCT,
  EMPLOYER_PENSION_PCT,
  EMPLOYER_SENA_PCT,
} from '../payroll.constants';
import type {
  PilaCotizanteDraft,
  PilaEmployeeEnrichment,
  PilaOs380EmployeeSlice,
} from './pila-preparation.interfaces';

const ARL_RISK_CLASS: Record<ArlRiskLevel, string> = {
  [ArlRiskLevel.RIESGO_I]: '1',
  [ArlRiskLevel.RIESGO_II]: '2',
  [ArlRiskLevel.RIESGO_III]: '3',
  [ArlRiskLevel.RIESGO_IV]: '4',
  [ArlRiskLevel.RIESGO_V]: '5',
};

/** Mapea DocumentType Prisma → código PILA cotizante. PEP no soportado → null. */
export function mapDocumentTypeToPila(documentType: string | null | undefined): string | null {
  if (!documentType) return null;
  switch (documentType) {
    case DocumentType.CC:
      return 'CC';
    case DocumentType.CE:
      return 'CE';
    case DocumentType.TI:
      return 'TI';
    case DocumentType.PASAPORTE:
      return 'PA';
    default:
      return null;
  }
}

export function mapArlRiskToPilaClass(level: ArlRiskLevel): string {
  return ARL_RISK_CLASS[level];
}

/**
 * Adapta fila OS-380 + enriquecimiento → cotizante draft.
 * El IBC (`contributionBase`) proviene exclusivamente del motor; no se recalcula aquí.
 */
export function adaptOs380EmployeeToCotizanteDraft(
  slice: PilaOs380EmployeeSlice,
  enrichment: PilaEmployeeEnrichment,
  actividadEconomicaArl: string,
): PilaCotizanteDraft | null {
  const documentType = mapDocumentTypeToPila(enrichment.documentType);
  const firstName = enrichment.firstName?.trim() || null;
  const firstLastName = enrichment.firstLastName?.trim() || null;
  if (
    !documentType ||
    !enrichment.documentNumber ||
    !firstName ||
    !firstLastName ||
    !enrichment.epsPilaCode ||
    !enrichment.afpPilaCode ||
    !enrichment.arlPilaCode ||
    !enrichment.ccfPilaCode ||
    !enrichment.departmentCode ||
    !enrichment.municipalityCode
  ) {
    return null;
  }

  return {
    employeeId: slice.employeeId,
    documentType,
    documentNumber: enrichment.documentNumber,
    firstName,
    firstLastName,
    secondLastName: enrichment.secondLastName?.trim() || null,
    tipoCotizante: '01',
    afpCode: enrichment.afpPilaCode,
    epsCode: enrichment.epsPilaCode,
    arlCode: enrichment.arlPilaCode,
    ccfCode: enrichment.ccfPilaCode,
    departmentCode: enrichment.departmentCode,
    municipalityCode: enrichment.municipalityCode,
    locationCityName: enrichment.locationCityName,
    workedDays: slice.workedDays,
    salaryAmount: slice.salaryAmount,
    isIntegralSalary: slice.salaryType === SalaryType.INTEGRAL,
    contributionBase: slice.contributionBase,
    contributions: {
      employeeHealth: slice.healthDeduction,
      employeePension: slice.pensionDeduction,
      employerHealth: slice.employerHealthContribution,
      employerPension: slice.employerPensionContribution,
      employerArl: slice.employerArlContribution,
      employerSena: slice.employerSenaContribution,
      employerIcbf: slice.employerIcbfContribution,
      employerCaja: slice.employerCajaContribution,
      employeeHealthPct: EMPLOYEE_HEALTH_PCT,
      employeePensionPct: EMPLOYEE_PENSION_PCT,
      employerHealthPct: EMPLOYER_HEALTH_PCT,
      employerPensionPct: EMPLOYER_PENSION_PCT,
      employerSenaPct: EMPLOYER_SENA_PCT,
      employerIcbfPct: EMPLOYER_ICBF_PCT,
      employerCajaPct: EMPLOYER_CAJA_PCT,
      employerArlPct: ARL_RATES[enrichment.arlRiskLevel],
    },
    arlRiskClass: mapArlRiskToPilaClass(enrichment.arlRiskLevel),
    actividadEconomicaArl,
    workCenterCode: enrichment.locationCode ?? enrichment.employeeId,
    contractType: slice.contractType,
    salaryType: slice.salaryType,
  };
}

export function isDateInPeriod(date: Date, periodYear: number, periodMonth: number): boolean {
  return date.getUTCFullYear() === periodYear && date.getUTCMonth() + 1 === periodMonth;
}
