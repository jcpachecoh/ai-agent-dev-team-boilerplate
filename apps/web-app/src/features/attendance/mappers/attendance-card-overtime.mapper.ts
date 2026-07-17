import type { AsistenciaTarjetaDayRow } from '@restopsiq/ui';

import {
  OVERTIME_STATUS_LABELS,
  OVERTIME_TYPE_LABELS,
  formatOvertimeApprovalIndicator,
  type OvertimeRequestItem,
  type OvertimeRequestType,
  type OvertimeStatus,
} from '../types/overtime.types';

/** Estados históricos para la tarjeta (evita el filtro implícito por nivel del inbox). */
export const ATTENDANCE_CARD_OVERTIME_STATUSES: OvertimeStatus[] = [
  'PENDIENTE_ADMIN',
  'PENDIENTE_GERENCIA_OPERACIONES',
  'PENDIENTE_GERENCIA_GENERAL',
  'APROBADA',
  'OBJETADA',
];

function toIsoDay(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const day = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
}

function formatWorkDateLabel(workDate: string | null | undefined): string {
  const day = toIsoDay(workDate);
  if (!day) {
    return '—';
  }
  const [y, m, d] = day.split('-');
  return `${d}/${m}/${y}`;
}

function formatTimeLabel(iso: string | null | undefined): string {
  if (!iso) {
    return '—';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function resolveType(type: OvertimeRequestType | null | undefined): OvertimeRequestType {
  return type ?? 'DETECCION_AUTOMATICA';
}

/**
 * Ventana administrativa: workDate + inicio/fin propuestos + duración.
 * No usa shiftEndTime / actualEndTime.
 */
export function formatAdminOvertimeWindow(request: OvertimeRequestItem): string {
  const date = formatWorkDateLabel(request.workDate);
  const start = formatTimeLabel(request.proposedStartTime);
  const end = formatTimeLabel(request.proposedEndTime);
  const minutes =
    request.proposedMinutes !== null && request.proposedMinutes !== undefined
      ? `${request.proposedMinutes} min`
      : null;
  const range = `${date} ${start}–${end}`;
  return minutes ? `${range} (${minutes})` : range;
}

/**
 * Indicador HEAprob para una solicitud.
 * - Detección: conserva `formatOvertimeApprovalIndicator` y antepone origen.
 * - Admin: origen + estado real + ventana + motivo (si se resuelve el nombre).
 */
export function formatAttendanceCardOvertimeIndicator(
  request: OvertimeRequestItem,
  reasonNameById?: ReadonlyMap<string, string>,
): string {
  const type = resolveType(request.type);
  const origin = OVERTIME_TYPE_LABELS[type];

  if (type === 'SOLICITUD_ADMINISTRATIVA') {
    const status = OVERTIME_STATUS_LABELS[request.status];
    const window = formatAdminOvertimeWindow(request);
    const reasonName =
      request.reasonOptionId !== null && request.reasonOptionId !== undefined && reasonNameById
        ? reasonNameById.get(request.reasonOptionId)
        : undefined;
    return [origin, status, window, reasonName].filter(Boolean).join(' · ');
  }

  const legacyStatus = formatOvertimeApprovalIndicator(request.status, request.accumulatedMinutes);
  return `${origin} · ${legacyStatus}`;
}

/**
 * Aplica solicitudes al HEAprob de cada fila.
 * - Admin: match por `workDate` (también si HHEE es "—").
 * - Detección: conserva la regla CONN-04a (días con HHEE) y lista todas
 *   las detecciones del período si coexisten con admin el mismo día.
 */
export function applyOvertimeRequestsToCardRows(
  rows: AsistenciaTarjetaDayRow[],
  requests: OvertimeRequestItem[],
  reasonNameById?: ReadonlyMap<string, string>,
): AsistenciaTarjetaDayRow[] {
  if (requests.length === 0) {
    return rows;
  }

  const adminByDate = new Map<string, OvertimeRequestItem[]>();
  const detectionRequests: OvertimeRequestItem[] = [];

  for (const request of requests) {
    if (resolveType(request.type) === 'SOLICITUD_ADMINISTRATIVA') {
      const day = toIsoDay(request.workDate);
      if (!day) {
        continue;
      }
      const bucket = adminByDate.get(day) ?? [];
      bucket.push(request);
      adminByDate.set(day, bucket);
      continue;
    }
    detectionRequests.push(request);
  }

  return rows.map((row) => {
    const parts: string[] = [];

    for (const admin of adminByDate.get(row.id) ?? []) {
      parts.push(formatAttendanceCardOvertimeIndicator(admin, reasonNameById));
    }

    if (row.overtimeHours !== '—') {
      for (const detection of detectionRequests) {
        parts.push(formatAttendanceCardOvertimeIndicator(detection, reasonNameById));
      }
    }

    if (parts.length === 0) {
      return row;
    }

    return {
      ...row,
      approvedOvertimeHours: parts.join(' | '),
    };
  });
}

export function buildOvertimeReasonNameMap(
  options: Array<{ id: string; name: string }> | null | undefined,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const option of options ?? []) {
    map.set(option.id, option.name);
  }
  return map;
}
