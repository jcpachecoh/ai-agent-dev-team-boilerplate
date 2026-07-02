import type { ArlRiskLevel, PayrollEmployee } from '../types/payroll.types';

export type SocialSecurityAffiliationKey = 'health' | 'pension' | 'arl' | 'compensationFund';

export type AffiliationStatus = 'ACTIVE' | 'INACTIVE';

export interface SocialSecurityAffiliation {
  key: SocialSecurityAffiliationKey;
  label: string;
  entityName: string;
  status: AffiliationStatus;
  linkedAt: string | null;
  extraLabel?: string;
  extraValue?: string;
}

export type SocialSecurityAffiliationFieldKey =
  | 'epsName'
  | 'pensionFundName'
  | 'arlName'
  | 'arlRiskLevel'
  | 'cajaCompensacion';

const PLACEHOLDER_ENTITY_NAMES = new Set(['', 'Por definir']);

export function formatAffiliationDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('es-CO');
}

export function resolveAffiliationStatus(
  employeeActive: boolean,
  entityName: string | null | undefined,
): AffiliationStatus {
  const normalized = entityName?.trim() ?? '';
  if (!employeeActive || PLACEHOLDER_ENTITY_NAMES.has(normalized)) {
    return 'INACTIVE';
  }
  return 'ACTIVE';
}

export function buildSocialSecurityAffiliations(
  employee: PayrollEmployee,
): SocialSecurityAffiliation[] {
  const linkedAt = employee.hireDate ?? null;

  return [
    {
      key: 'health',
      label: 'Salud (EPS)',
      entityName: employee.epsName,
      status: resolveAffiliationStatus(employee.isActive, employee.epsName),
      linkedAt,
    },
    {
      key: 'pension',
      label: 'Pensión',
      entityName: employee.pensionFundName,
      status: resolveAffiliationStatus(employee.isActive, employee.pensionFundName),
      linkedAt,
    },
    {
      key: 'arl',
      label: 'ARL',
      entityName: employee.arlName,
      status: resolveAffiliationStatus(employee.isActive, employee.arlName),
      linkedAt,
      extraLabel: 'Nivel de riesgo',
      extraValue: formatArlRiskLevel(employee.arlRiskLevel),
    },
    {
      key: 'compensationFund',
      label: 'Caja de compensación',
      entityName: employee.cajaCompensacion,
      status: resolveAffiliationStatus(employee.isActive, employee.cajaCompensacion),
      linkedAt,
    },
  ];
}

function formatArlRiskLevel(level: ArlRiskLevel): string {
  const labels: Record<ArlRiskLevel, string> = {
    RIESGO_I: 'Riesgo I',
    RIESGO_II: 'Riesgo II',
    RIESGO_III: 'Riesgo III',
    RIESGO_IV: 'Riesgo IV',
    RIESGO_V: 'Riesgo V',
  };
  return labels[level] ?? level;
}
