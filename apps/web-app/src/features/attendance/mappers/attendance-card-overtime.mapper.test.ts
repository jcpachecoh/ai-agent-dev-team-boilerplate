import { describe, expect, it } from 'vitest';

import type { AsistenciaTarjetaDayRow } from '@restopsiq/ui';

import type { OvertimeRequestItem } from '../types/overtime.types';
import {
  applyOvertimeRequestsToCardRows,
  buildOvertimeReasonNameMap,
  formatAdminOvertimeWindow,
  formatAttendanceCardOvertimeIndicator,
} from './attendance-card-overtime.mapper';

function makeRow(overrides: Partial<AsistenciaTarjetaDayRow> = {}): AsistenciaTarjetaDayRow {
  return {
    id: '2026-07-16',
    dayShort: 'Jue',
    dateLabel: '16/07/2026',
    shiftName: 'Mañana',
    shiftRange: '08:00-17:00',
    entryTime: '08:00',
    exitTime: '17:00',
    ordinaryHours: '08:00:00',
    unworkedHours: '—',
    overtimeHours: '01:00:00',
    approvedOvertimeHours: '01:00:00',
    targetHours: '08:00:00',
    permissions: '—',
    variant: 'default',
    hasObservation: false,
    hasManualMarking: false,
    isAutomaticEntry: true,
    isAutomaticExit: true,
    ...overrides,
  };
}

function makeDetection(overrides: Partial<OvertimeRequestItem> = {}): OvertimeRequestItem {
  return {
    id: 'req-auto',
    employeeId: 'emp-1',
    employeeName: 'Ana',
    locationId: 'loc-1',
    locationName: 'PL-01',
    type: 'DETECCION_AUTOMATICA',
    accumulatedMinutes: 45,
    shiftEndTime: '2026-07-16T22:00:00.000Z',
    actualEndTime: '2026-07-16T22:45:00.000Z',
    status: 'PENDIENTE_ADMIN',
    payrollPeriod: '2026-07',
    createdAt: '2026-07-16T22:45:00.000Z',
    updatedAt: '2026-07-16T22:45:00.000Z',
    ...overrides,
  };
}

function makeAdmin(overrides: Partial<OvertimeRequestItem> = {}): OvertimeRequestItem {
  return {
    id: 'req-admin',
    employeeId: 'emp-1',
    employeeName: 'Ana',
    locationId: 'loc-1',
    locationName: 'PL-01',
    type: 'SOLICITUD_ADMINISTRATIVA',
    accumulatedMinutes: null,
    shiftEndTime: null,
    actualEndTime: null,
    status: 'PENDIENTE_GERENCIA_OPERACIONES',
    payrollPeriod: '2026-07',
    workDate: '2026-07-16',
    proposedStartTime: '2026-07-16T22:00:00.000-05:00',
    proposedEndTime: '2026-07-17T01:30:00.000-05:00',
    proposedMinutes: 210,
    reasonOptionId: 'reason-1',
    createdAt: '2026-07-16T10:00:00.000Z',
    updatedAt: '2026-07-16T10:00:00.000Z',
    ...overrides,
  };
}

describe('formatAdminOvertimeWindow', () => {
  it('muestra fecha, horas y duración propuesta (sin shift/actual)', () => {
    const text = formatAdminOvertimeWindow(makeAdmin());
    expect(text).toContain('16/07/2026');
    expect(text).toContain('210 min');
    expect(text).not.toContain('shiftEndTime');
  });
});

describe('formatAttendanceCardOvertimeIndicator', () => {
  it('conserva presentación de detección automática con origen', () => {
    expect(formatAttendanceCardOvertimeIndicator(makeDetection())).toBe(
      'Detección automática · Pendiente (45 min)',
    );
  });

  it('muestra origen, estado, ventana y motivo administrativo', () => {
    const reasons = buildOvertimeReasonNameMap([
      { id: 'reason-1', name: 'Inventario físico semana' },
    ]);
    const text = formatAttendanceCardOvertimeIndicator(makeAdmin(), reasons);
    expect(text).toContain('Solicitud administrativa');
    expect(text).toContain('Pendiente gerencia operaciones');
    expect(text).toContain('16/07/2026');
    expect(text).toContain('210 min');
    expect(text).toContain('Inventario físico semana');
  });

  it('resuelve motivo desactivado por FK sin romper', () => {
    const reasons = buildOvertimeReasonNameMap([
      { id: 'reason-inactive', name: 'Aseo (histórico)' },
    ]);
    const text = formatAttendanceCardOvertimeIndicator(
      makeAdmin({ reasonOptionId: 'reason-inactive' }),
      reasons,
    );
    expect(text).toContain('Aseo (histórico)');
  });

  it('omite motivo si no hay mapa (catálogo no disponible)', () => {
    const text = formatAttendanceCardOvertimeIndicator(makeAdmin());
    expect(text).toContain('Solicitud administrativa');
    expect(text).not.toContain('undefined');
  });

  it('badge estado: aprobada', () => {
    expect(formatAttendanceCardOvertimeIndicator(makeAdmin({ status: 'APROBADA' }))).toContain(
      'Aprobada',
    );
  });

  it('badge estado: objetada', () => {
    expect(formatAttendanceCardOvertimeIndicator(makeAdmin({ status: 'OBJETADA' }))).toContain(
      'Objetada',
    );
  });

  it('badge estado: pendiente gerencia general', () => {
    expect(
      formatAttendanceCardOvertimeIndicator(makeAdmin({ status: 'PENDIENTE_GERENCIA_GENERAL' })),
    ).toContain('Pendiente gerencia general');
  });
});

describe('applyOvertimeRequestsToCardRows', () => {
  it('aplica detección solo a días con HHEE (CONN-04a)', () => {
    const rows = [
      makeRow({ id: '2026-07-16', overtimeHours: '00:45:00' }),
      makeRow({ id: '2026-07-17', overtimeHours: '—' }),
    ];
    const result = applyOvertimeRequestsToCardRows(rows, [makeDetection()]);
    expect(result[0]!.approvedOvertimeHours).toContain('Detección automática');
    expect(result[0]!.approvedOvertimeHours).toContain('Pendiente (45 min)');
    expect(result[1]!.approvedOvertimeHours).toBe('01:00:00');
  });

  it('aplica solicitud administrativa por workDate aunque HHEE sea —', () => {
    const rows = [makeRow({ id: '2026-07-16', overtimeHours: '—' })];
    const reasons = buildOvertimeReasonNameMap([
      { id: 'reason-1', name: 'Inventario físico semana' },
    ]);
    const result = applyOvertimeRequestsToCardRows(rows, [makeAdmin()], reasons);
    expect(result[0]!.approvedOvertimeHours).toContain('Solicitud administrativa');
    expect(result[0]!.approvedOvertimeHours).toContain('Inventario físico semana');
  });

  it('lista ambos orígenes cuando coexisten el mismo día', () => {
    const rows = [makeRow({ id: '2026-07-16', overtimeHours: '00:45:00' })];
    const result = applyOvertimeRequestsToCardRows(rows, [makeAdmin(), makeDetection()]);
    expect(result[0]!.approvedOvertimeHours).toContain('Solicitud administrativa');
    expect(result[0]!.approvedOvertimeHours).toContain('Detección automática');
    expect(result[0]!.approvedOvertimeHours).toContain(' | ');
  });
});
