import type { StatusType } from '@restopsiq/ui';

import { STOCK_UNIT_OPTIONS } from '@/types/inventory';

import {
  COMMITTEE_STATUS_LABELS,
  ORDER_STATUS_LABELS,
  PRIORITY_LABELS,
  SHIFT_LABELS,
} from '../constants';
import type {
  PhaseExecutionDetail,
  ProductionCommitteeStatus,
  ProductionOrderStatus,
  ProductionPriority,
  ProductionShift,
} from '../types';

export function formatOrderStatus(status: ProductionOrderStatus): string {
  return ORDER_STATUS_LABELS[status] ?? status;
}

export function formatCommitteeStatus(status: ProductionCommitteeStatus): string {
  return COMMITTEE_STATUS_LABELS[status] ?? status;
}

export function committeeStatusToBadge(status: ProductionCommitteeStatus): StatusType {
  switch (status) {
    case 'DRAFT':
      return 'DRAFT';
    case 'ACTIVE':
      return 'PROCESSING';
    case 'CLOSED':
      return 'COMPLETED';
    case 'CANCELLED':
      return 'CANCELLED';
    default:
      return 'PENDING';
  }
}

export function formatPriority(priority: ProductionPriority): string {
  return PRIORITY_LABELS[priority] ?? priority;
}

export function formatShift(shift: ProductionShift): string {
  return SHIFT_LABELS[shift] ?? shift;
}

export function formatStockUnitLabel(unit: string | null | undefined): string {
  if (!unit) return '—';
  return STOCK_UNIT_OPTIONS.find((option) => option.value === unit)?.label ?? unit;
}

export function formatPlannedDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function orderStatusToBadge(status: ProductionOrderStatus): StatusType {
  switch (status) {
    case 'DRAFT':
      return 'DRAFT';
    case 'PLANNED':
      return 'PENDING';
    case 'IN_PROCESS':
      return 'PROCESSING';
    case 'PAUSED':
      return 'WARNING';
    case 'COMPLETED':
      return 'COMPLETED';
    case 'CANCELLED':
      return 'CANCELLED';
    default:
      return 'PENDING';
  }
}

export function countCompletedPhases(executions: PhaseExecutionDetail[]): number {
  return executions.filter((e) => e.status === 'COMPLETED').length;
}

export function phaseProgressVariant(
  completed: number,
  total: number,
): 'success' | 'warning' | 'danger' {
  if (total === 0) return 'warning';
  const ratio = completed / total;
  if (ratio >= 1) return 'success';
  if (ratio >= 0.5) return 'warning';
  return 'danger';
}

/** Convert datetime-local value to ISO string for API. */
export function datetimeLocalToIso(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

/** Default planned window: tomorrow 6am–2pm local. */
export function defaultPlannedWindow(): { start: string; end: string } {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(6, 0, 0, 0);
  const end = new Date(start);
  end.setHours(14, 0, 0, 0);
  return {
    start: toDatetimeLocalValue(start),
    end: toDatetimeLocalValue(end),
  };
}

export function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Convert ISO string from API to datetime-local input value. */
export function isoToDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return toDatetimeLocalValue(date);
}
