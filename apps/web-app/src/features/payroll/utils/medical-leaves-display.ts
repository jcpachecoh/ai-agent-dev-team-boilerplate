import type { LeaveOrigin, LeaveStatus } from '../types/medical-leaves.types';

export const MEDICAL_LEAVE_180_DAY_WARNING =
  'Este colaborador supera los 180 días acumulados de incapacidad en el año. Revisión legal requerida.';

export const LEAVE_ORIGIN_LABELS: Record<LeaveOrigin, string> = {
  COMUN: 'Enfermedad común',
  LABORAL: 'Accidente laboral',
};

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  REGISTRADA: 'Registrada',
  RADICADA_EPS: 'Radicada EPS/ARL',
  RECOBRADA: 'Recobrada',
  RECHAZADA: 'Rechazada',
};

export const LEAVE_STATUS_FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Todos los estados' },
  { value: 'REGISTRADA', label: LEAVE_STATUS_LABELS.REGISTRADA },
  { value: 'RADICADA_EPS', label: LEAVE_STATUS_LABELS.RADICADA_EPS },
  { value: 'RECOBRADA', label: LEAVE_STATUS_LABELS.RECOBRADA },
  { value: 'RECHAZADA', label: LEAVE_STATUS_LABELS.RECHAZADA },
];

export const LEAVE_ORIGIN_FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Todos los orígenes' },
  { value: 'COMUN', label: LEAVE_ORIGIN_LABELS.COMUN },
  { value: 'LABORAL', label: LEAVE_ORIGIN_LABELS.LABORAL },
];

export function formatMedicalLeaveCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatMedicalLeaveDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function getCurrentMonthValue(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function buildMedicalLeaveMonthOptions(count = 18): Array<{ value: string; label: string }> {
  const now = new Date();
  const options: Array<{ value: string; label: string }> = [
    { value: '', label: 'Todos los meses' },
  ];

  for (let i = 0; i < count; i += 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const value = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('es-CO', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
    options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }

  return options;
}

export function canRadicateMedicalLeave(status: LeaveStatus, hasSupport: boolean): boolean {
  return status === 'REGISTRADA' && hasSupport;
}

export function canMarkRecovered(status: LeaveStatus): boolean {
  return status === 'RADICADA_EPS';
}

export function canRejectMedicalLeave(status: LeaveStatus): boolean {
  return status === 'REGISTRADA' || status === 'RADICADA_EPS';
}
