import { EmployeeContractType } from '@prisma/client';

import {
  isNitVerificationDigitCoherent,
  isValidActividadEconomicaArl,
  isValidDepartmentCode,
  isValidMunicipalityCode,
  isValidNitBase,
  isValidVerificationDigit,
  normalizeNitDigits,
} from '../utils/pila-master-data.util';
import { mapDocumentTypeToPila } from './pila-os380.adapter';
import { PilaErrorCode } from './pila-error-codes';
import type {
  PilaEmployeeEnrichment,
  PilaEmployeeEventFlags,
  PilaOs380EmployeeSlice,
  PilaValidationError,
} from './pila-preparation.interfaces';
import type { TenantPilaConfigRecord } from '../interfaces/tenant-pila-config.interfaces';

const SUPPORTED_CONTRACTS = new Set<EmployeeContractType>([
  EmployeeContractType.FIJO,
  EmployeeContractType.INDEFINIDO,
  EmployeeContractType.OBRA,
]);

const PERIOD_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function validatePilaPeriodFormat(period: string): PilaValidationError | null {
  if (!PERIOD_RE.test(period)) {
    return {
      code: PilaErrorCode.PERIOD_INVALID,
      field: 'period',
      message: `El período "${period}" es inválido. Use el formato YYYY-MM.`,
    };
  }
  return null;
}

function err(
  code: PilaErrorCode,
  field: string,
  message: string,
  employee?: { id: string; name: string },
): PilaValidationError {
  return {
    code,
    field,
    message,
    ...(employee ? { employeeId: employee.id, employeeName: employee.name } : {}),
  };
}

export function validateTenantForPila(input: {
  nit: string | null | undefined;
  verificationDigit: string | null | undefined;
  pilaConfig: TenantPilaConfigRecord | null;
  arlCatalogHasCode: boolean;
}): PilaValidationError[] {
  const errors: PilaValidationError[] = [];
  const nit = input.nit ? normalizeNitDigits(input.nit) : '';
  const dv = input.verificationDigit?.trim() ?? '';

  if (!nit) {
    errors.push(
      err(
        PilaErrorCode.TENANT_NIT_MISSING,
        'tenant.nit',
        'Configure el NIT del empleador (solo dígitos, sin DV) en datos del tenant.',
      ),
    );
  } else if (!isValidNitBase(nit)) {
    errors.push(
      err(
        PilaErrorCode.TENANT_NIT_DV_INVALID,
        'tenant.nit',
        'El NIT del empleador no tiene un formato válido (3–15 dígitos).',
      ),
    );
  }

  if (!dv) {
    errors.push(
      err(
        PilaErrorCode.TENANT_DV_MISSING,
        'tenant.verificationDigit',
        'Configure el dígito de verificación DIAN del empleador.',
      ),
    );
  } else if (!isValidVerificationDigit(dv)) {
    errors.push(
      err(
        PilaErrorCode.TENANT_NIT_DV_INVALID,
        'tenant.verificationDigit',
        'El dígito de verificación debe ser un solo dígito (0–9).',
      ),
    );
  } else if (nit && isValidNitBase(nit) && !isNitVerificationDigitCoherent(nit, dv)) {
    errors.push(
      err(
        PilaErrorCode.TENANT_NIT_DV_INVALID,
        'tenant.verificationDigit',
        `El dígito de verificación "${dv}" no es coherente con el NIT ${nit} (algoritmo DIAN).`,
      ),
    );
  }

  if (!input.pilaConfig) {
    errors.push(
      err(
        PilaErrorCode.TENANT_PILA_CONFIG_MISSING,
        'tenantPilaConfig',
        'Falta la configuración PILA del tenant (TenantPilaConfig).',
      ),
    );
    return errors;
  }

  const cfg = input.pilaConfig;
  if (cfg.exemptFromHealthSenaIcbfLey1607) {
    errors.push(
      err(
        PilaErrorCode.TENANT_EXEMPT_LEY_1607,
        'tenantPilaConfig.exemptFromHealthSenaIcbfLey1607',
        'El tenant está marcado como exonerado Ley 1607; la v1 no emite planilla hasta que OS-380 calcule tarifas de exoneración.',
      ),
    );
  }

  if (!cfg.arlCode?.trim()) {
    errors.push(
      err(
        PilaErrorCode.TENANT_ARL_CODE_MISSING,
        'tenantPilaConfig.arlCode',
        'Configure el código ARL del aportante en la configuración PILA del tenant.',
      ),
    );
  } else if (!input.arlCatalogHasCode) {
    errors.push(
      err(
        PilaErrorCode.TENANT_ARL_CODE_NOT_IN_CATALOG,
        'tenantPilaConfig.arlCode',
        `El código ARL "${cfg.arlCode}" no existe en el catálogo ARL activo del tenant.`,
      ),
    );
  }

  if (!cfg.actividadEconomicaArl?.trim()) {
    errors.push(
      err(
        PilaErrorCode.TENANT_ACTIVIDAD_ECONOMICA_MISSING,
        'tenantPilaConfig.actividadEconomicaArl',
        'Configure la actividad económica ARL (7 dígitos) en la configuración PILA del tenant.',
      ),
    );
  } else if (!isValidActividadEconomicaArl(cfg.actividadEconomicaArl)) {
    errors.push(
      err(
        PilaErrorCode.TENANT_ACTIVIDAD_ECONOMICA_MISSING,
        'tenantPilaConfig.actividadEconomicaArl',
        'La actividad económica ARL debe tener exactamente 7 dígitos.',
      ),
    );
  }

  return errors;
}

export function validateEmployeeForPila(input: {
  slice: PilaOs380EmployeeSlice;
  enrichment: PilaEmployeeEnrichment;
  events: PilaEmployeeEventFlags;
  smlv: number;
}): PilaValidationError[] {
  const { slice, enrichment, events, smlv } = input;
  const emp = { id: slice.employeeId, name: enrichment.employeeName || slice.employeeName };
  const errors: PilaValidationError[] = [];

  if (!SUPPORTED_CONTRACTS.has(slice.contractType)) {
    errors.push(
      err(
        PilaErrorCode.EMPLOYEE_UNSUPPORTED_CONTRACT,
        'contractType',
        `El empleado ${emp.name} tiene contrato ${slice.contractType}. La planilla E v1 solo admite FIJO, INDEFINIDO u OBRA.`,
        emp,
      ),
    );
  }

  const docType = mapDocumentTypeToPila(enrichment.documentType);
  if (!docType || !enrichment.documentNumber?.trim()) {
    errors.push(
      err(
        PilaErrorCode.EMPLOYEE_UNSUPPORTED_DOCUMENT,
        'documentType',
        `Documento de ${emp.name} no es válido en PILA v1. Use CC, CE, TI o pasaporte (PA).`,
        emp,
      ),
    );
  }

  if (!enrichment.firstName?.trim() || !enrichment.firstLastName?.trim()) {
    errors.push(
      err(
        PilaErrorCode.EMPLOYEE_NAME_INCOMPLETE,
        'personalData',
        `Complete nombres y primer apellido en el perfil de ${emp.name} antes de generar PILA.`,
        emp,
      ),
    );
  }

  if (!enrichment.epsName?.trim()) {
    errors.push(
      err(PilaErrorCode.EMPLOYEE_EPS_MISSING, 'epsName', `Falta EPS para ${emp.name}.`, emp),
    );
  } else if (!enrichment.epsPilaCode) {
    errors.push(
      err(
        PilaErrorCode.EMPLOYEE_EPS_PILA_CODE_MISSING,
        'eps.pilaCode',
        `Falta código PILA de EPS para ${emp.name}. Configure el código oficial en el catálogo.`,
        emp,
      ),
    );
  }

  if (!enrichment.pensionFundName?.trim()) {
    errors.push(
      err(
        PilaErrorCode.EMPLOYEE_AFP_MISSING,
        'pensionFundName',
        `Falta AFP para ${emp.name}.`,
        emp,
      ),
    );
  } else if (!enrichment.afpPilaCode) {
    errors.push(
      err(
        PilaErrorCode.EMPLOYEE_AFP_PILA_CODE_MISSING,
        'afp.pilaCode',
        `Falta código PILA de AFP para ${emp.name}. Configure el código oficial en el catálogo.`,
        emp,
      ),
    );
  }

  if (!enrichment.arlName?.trim()) {
    errors.push(
      err(PilaErrorCode.EMPLOYEE_ARL_MISSING, 'arlName', `Falta ARL para ${emp.name}.`, emp),
    );
  } else if (!enrichment.arlPilaCode) {
    errors.push(
      err(
        PilaErrorCode.EMPLOYEE_ARL_PILA_CODE_MISSING,
        'arl.pilaCode',
        `Falta código PILA de ARL para ${emp.name}. Configure el código oficial en el catálogo.`,
        emp,
      ),
    );
  }

  if (!enrichment.cajaCompensacion?.trim()) {
    errors.push(
      err(
        PilaErrorCode.EMPLOYEE_CCF_MISSING,
        'cajaCompensacion',
        `Falta CCF para ${emp.name}.`,
        emp,
      ),
    );
  } else if (!enrichment.ccfPilaCode) {
    errors.push(
      err(
        PilaErrorCode.EMPLOYEE_CCF_PILA_CODE_MISSING,
        'ccf.pilaCode',
        `Falta código PILA de CCF para ${emp.name}. Configure el código oficial en el catálogo.`,
        emp,
      ),
    );
  }

  if (
    !enrichment.departmentCode ||
    !enrichment.municipalityCode ||
    !isValidDepartmentCode(enrichment.departmentCode) ||
    !isValidMunicipalityCode(enrichment.municipalityCode)
  ) {
    errors.push(
      err(
        PilaErrorCode.EMPLOYEE_DIVIPOLA_MISSING,
        'location.divipola',
        `La sede laboral de ${emp.name} no tiene códigos DIVIPOLA válidos (depto 2 + municipio 3).`,
        emp,
      ),
    );
  }

  if (!enrichment.arlRiskLevel) {
    errors.push(
      err(
        PilaErrorCode.EMPLOYEE_ARL_RISK_INVALID,
        'arlRiskLevel',
        `Clase de riesgo ARL inválida para ${emp.name}.`,
        emp,
      ),
    );
  }

  const hasUnsupportedEvent =
    events.hasMedicalLeaveInPeriod ||
    events.hasVacationInPeriod ||
    events.hasPayrollNovedadInPeriod ||
    events.hasIngressInPeriod ||
    events.hasRetirementInPeriod ||
    slice.medicalLeaveOrdinaryDaysExcluded > 0 ||
    slice.medicalLeaveEpsArlDays > 0;

  if (hasUnsupportedEvent) {
    errors.push(
      err(
        PilaErrorCode.EMPLOYEE_HAS_UNSUPPORTED_PILA_EVENT,
        'pilaEvents',
        `Hay novedad PILA no soportada en el período para ${emp.name} (ING/RET/IGE/IRL/VAC/SLN/LMA). La v1 solo admite línea limpia.`,
        emp,
      ),
    );
  }

  const contributionBase = slice.contributionBase;
  // Ley 100 art. 27 / FSP: umbral cuando IBC pensional >= 4 SMMLV (vigente del período).
  if (smlv > 0 && contributionBase >= 4 * smlv) {
    errors.push(
      err(
        PilaErrorCode.EMPLOYEE_REQUIRES_FSP,
        'contributionBase',
        `${emp.name} tiene IBC >= 4 SMMLV. OS-380 no calcula FSP; no se puede preparar planilla válida.`,
        emp,
      ),
    );
  }

  const amounts = [
    slice.salaryAmount,
    slice.salaryBase,
    slice.workedDays,
    slice.healthDeduction,
    slice.pensionDeduction,
    slice.employerHealthContribution,
    slice.employerPensionContribution,
    slice.employerArlContribution,
  ];
  if (amounts.some((n) => n < 0)) {
    errors.push(
      err(
        PilaErrorCode.EMPLOYEE_NEGATIVE_AMOUNT,
        'amounts',
        `Hay montos o días negativos en la liquidación OS-380 de ${emp.name}.`,
        emp,
      ),
    );
  }

  return errors;
}
