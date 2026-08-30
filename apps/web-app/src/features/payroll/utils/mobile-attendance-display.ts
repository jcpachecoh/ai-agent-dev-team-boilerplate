import type {
  MobileAttendanceEventType,
  MobileAttendanceStatus,
} from '../types/mobile-attendance.types';

const EVENT_TYPE_LABELS: Record<MobileAttendanceEventType, string> = {
  ENTRY: 'Entrada',
  EXIT: 'Salida',
};

const STATUS_LABELS: Record<MobileAttendanceStatus, string> = {
  VALID: 'Válida',
  REJECTED: 'Rechazada',
  PENDING: 'Pendiente',
};

const REJECTION_REASON_LABELS: Record<string, string> = {
  OUTSIDE_RADIUS: 'Fuera del radio permitido',
};

export function formatMobileAttendanceEventType(eventType: MobileAttendanceEventType): string {
  return EVENT_TYPE_LABELS[eventType] ?? eventType;
}

export function formatMobileAttendanceStatus(status: MobileAttendanceStatus): string {
  return STATUS_LABELS[status] ?? status;
}

export function formatRejectionReason(reason: string | null | undefined): string {
  if (!reason) return '—';
  return REJECTION_REASON_LABELS[reason] ?? reason;
}

export function formatMarcacionDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export function formatMarcacionDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('es-CO');
}

export function formatDistanceMeters(distance: number | null | undefined): string {
  if (distance == null) return '—';
  return `${Math.round(distance)} m`;
}

export function getDefaultMarcacionesDateRange(): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const dateFrom = new Date(year, month, 1).toISOString().slice(0, 10);
  const dateTo = new Date(year, month + 1, 0).toISOString().slice(0, 10);
  return { dateFrom, dateTo };
}

export function mapMobileAttendanceStatusToBadge(
  status: MobileAttendanceStatus,
): 'APPROVED' | 'REJECTED' | 'PENDING' {
  if (status === 'VALID') return 'APPROVED';
  if (status === 'REJECTED') return 'REJECTED';
  return 'PENDING';
}
