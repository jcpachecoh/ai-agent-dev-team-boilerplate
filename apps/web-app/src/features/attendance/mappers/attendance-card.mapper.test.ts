import { describe, expect, it } from 'vitest';

import type { AttendanceHistoryItem, AttendanceObservationDto } from '../types/attendance.types';
import {
  buildAttendanceCardRows,
  buildAttendanceCardSummaryMetrics,
} from './attendance-card.mapper';

function makeLog(overrides: Partial<AttendanceHistoryItem>): AttendanceHistoryItem {
  return {
    id: 'log-1',
    employeeId: 'emp-1',
    locationId: 'loc-1',
    eventType: 'ENTRY',
    timestamp: '2026-06-10T13:00:00.000Z',
    workDate: '2026-06-10',
    source: 'DEVICE',
    ...overrides,
  };
}

describe('buildAttendanceCardRows', () => {
  it('genera una fila por cada día del rango, incluso sin marcaciones', () => {
    const rows = buildAttendanceCardRows('2026-06-01', '2026-06-03', [], []);
    expect(rows.map((row) => row.id)).toEqual(['2026-06-01', '2026-06-02', '2026-06-03']);
  });

  it('marca hasObservation según el arreglo de observaciones del backend (no localStorage)', () => {
    const observations: AttendanceObservationDto[] = [
      {
        id: 'obs-1',
        employeeId: 'emp-1',
        workDate: '2026-06-10T00:00:00.000Z',
        note: 'Llegó tarde',
        createdAt: '2026-06-10T00:00:00.000Z',
        updatedAt: '2026-06-10T00:00:00.000Z',
      },
    ];

    const rows = buildAttendanceCardRows('2026-06-10', '2026-06-10', [], observations);

    expect(rows[0].hasObservation).toBe(true);
  });

  it('distingue marcación manual (source=MANUAL) de la automática (source=DEVICE)', () => {
    const logs = [
      makeLog({ id: 'log-entry', eventType: 'ENTRY', source: 'DEVICE' }),
      makeLog({
        id: 'log-exit',
        eventType: 'EXIT',
        timestamp: '2026-06-10T22:00:00.000Z',
        source: 'MANUAL',
      }),
    ];

    const rows = buildAttendanceCardRows('2026-06-10', '2026-06-10', logs, []);

    expect(rows[0].isAutomaticEntry).toBe(true);
    expect(rows[0].isAutomaticExit).toBe(false);
    expect(rows[0].hasManualMarking).toBe(true);
  });

  it('no trunca datos en un rango de 3 meses con múltiples marcaciones por día', () => {
    const dates = ['2026-04-01', '2026-05-15', '2026-06-30'];
    const logs: AttendanceHistoryItem[] = [];
    for (const date of dates) {
      logs.push(
        makeLog({
          id: `entry-${date}`,
          eventType: 'ENTRY',
          workDate: date,
          timestamp: `${date}T13:00:00.000Z`,
        }),
      );
      logs.push(
        makeLog({
          id: `exit-${date}`,
          eventType: 'EXIT',
          workDate: date,
          timestamp: `${date}T22:00:00.000Z`,
        }),
      );
    }

    const rows = buildAttendanceCardRows('2026-04-01', '2026-06-30', logs, []);

    // El rango 2026-04-01..2026-06-30 tiene 91 días — todos deben estar presentes.
    expect(rows).toHaveLength(91);
    expect(rows.find((row) => row.id === '2026-05-15')?.entryTime).not.toBe('—');
  });

  it('muestra etiqueta de ausencia en entrada y salida cuando no hay marcación', () => {
    const daySummaries = [
      {
        workDate: '2026-06-10',
        targetMinutes: 0,
        targetHours: '—',
        ordinaryMinutes: 0,
        unworkedMinutes: 0,
        overtimeMinutes: 0,
        resolvedKind: 'VACACIONES' as const,
        shiftName: 'Vacaciones',
        shiftRange: null,
        absenceLabel: 'Vacaciones',
      },
    ];

    const rows = buildAttendanceCardRows('2026-06-10', '2026-06-10', [], [], daySummaries);

    expect(rows[0].entryTime).toBe('Vacaciones');
    expect(rows[0].exitTime).toBe('Vacaciones');
    expect(rows[0].entryTimeIsStatusLabel).toBe(true);
    expect(rows[0].variant).toBe('rest');
  });

  it('prioriza hora de marcación sobre etiqueta de ausencia', () => {
    const daySummaries = [
      {
        workDate: '2026-06-10',
        targetMinutes: 480,
        targetHours: '08:00:00',
        ordinaryMinutes: 480,
        unworkedMinutes: 0,
        overtimeMinutes: 0,
        resolvedKind: 'ASSIGNED' as const,
        shiftName: 'ADM.08:00-17:00',
        shiftRange: '08:00-17:00',
        absenceLabel: null,
      },
    ];
    const logs = [
      makeLog({ id: 'log-entry', eventType: 'ENTRY', source: 'DEVICE' }),
      makeLog({
        id: 'log-exit',
        eventType: 'EXIT',
        timestamp: '2026-06-10T22:00:00.000Z',
        source: 'DEVICE',
      }),
    ];

    const rows = buildAttendanceCardRows('2026-06-10', '2026-06-10', logs, [], daySummaries);

    expect(rows[0].entryTime).not.toBe('Vacaciones');
    expect(rows[0].entryTimeIsStatusLabel).toBe(false);
  });
});

describe('buildAttendanceCardSummaryMetrics', () => {
  it('devuelve las 5 métricas esperadas', () => {
    const metrics = buildAttendanceCardSummaryMetrics([]);
    expect(metrics.map((m) => m.id)).toEqual([
      'ordinary',
      'unworked',
      'overtime',
      'permissions',
      'absences',
    ]);
  });
});
