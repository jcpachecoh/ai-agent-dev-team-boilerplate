import type { StatusType } from '@restopsiq/ui';

import type { FinancialPaymentStatus, PaymentMethod } from '../types/financial-profile.types';

const MONTH_LABELS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

export function formatPayrollCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPaymentPeriod(year: number, month: number): string {
  const label = MONTH_LABELS[month - 1];
  return label ? `${label} ${year}` : `${month}/${year}`;
}

export function formatPaymentMethod(method: PaymentMethod): string {
  switch (method) {
    case 'BANK_TRANSFER':
      return 'Transferencia bancaria';
    case 'CASH':
      return 'Efectivo';
    case 'CHECK':
      return 'Cheque';
    default:
      return method;
  }
}

export function formatPaymentStatus(status: FinancialPaymentStatus): string {
  switch (status) {
    case 'PENDING':
      return 'Pendiente';
    case 'PAID':
      return 'Pagado';
    case 'FAILED':
      return 'Fallido';
    case 'CANCELLED':
      return 'Cancelado';
    default:
      return status;
  }
}

export function mapPaymentStatusToBadge(status: FinancialPaymentStatus): StatusType {
  switch (status) {
    case 'PENDING':
      return 'PENDING';
    case 'PAID':
      return 'COMPLETED';
    case 'FAILED':
      return 'FAILED';
    case 'CANCELLED':
      return 'CANCELLED';
    default:
      return 'PENDING';
  }
}

export function formatPaymentDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatWithholdingRate(rate?: number | null): string {
  if (rate == null || !Number.isFinite(rate)) return '—';
  return `${(rate * 100).toFixed(2)}%`;
}

export function parseWithholdingRatePercent(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const numeric = Number(trimmed.replace(',', '.'));
  if (!Number.isFinite(numeric) || numeric < 0 || numeric > 100) return undefined;
  return numeric / 100;
}
