import type { SenaMonetizationRegime, SenaQuotaStatus } from '../types/payroll-reports.types';

export const SENA_QUOTA_STATUS_LABELS: Record<SenaQuotaStatus, string> = {
  EXEMPT: 'Exento',
  COMPLIANT: 'Cumple',
  PENDING: 'Pendiente',
};

export const SENA_QUOTA_REGIME_LABELS: Record<SenaMonetizationRegime, string> = {
  LEY_789_2002: 'Régimen anterior a la reforma de 2025',
  LEY_2466_2025: 'Régimen vigente desde junio de 2025',
};

export const SENA_QUOTA_DISCLAIMER =
  'Esta estimación se basa en los contratos registrados en Restopsiq y no sustituye la cuota oficial determinada por el SENA.';

export function formatSenaQuotaMoney(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}
