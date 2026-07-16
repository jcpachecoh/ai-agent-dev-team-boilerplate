import {
  AttendanceEventType,
  AttendanceMarkingScope,
  AttendanceShift,
  TurnoJornada,
} from '@prisma/client';

import type { ResolvedShift } from '../../turnos/interfaces/employee-shift-assignment.interfaces';
import type { AttendanceLogFull } from '../interfaces/attendance.interfaces';
import { buildAttendanceCardDaySummaries } from '../utils/attendance-card-day-summary.util';

const WORK_DATE = new Date('2026-06-10T00:00:00.000Z');
const TENANT = 'tenant-1';

function makeLog(
  id: string,
  eventType: AttendanceEventType,
  timestamp: Date,
  markingScope: AttendanceMarkingScope = AttendanceMarkingScope.ORDINARY,
): AttendanceLogFull {
  return {
    id,
    tenantId: TENANT,
    employeeId: 'emp-1',
    locationId: 'loc-1',
    eventType,
    shift: AttendanceShift.MORNING,
    markingScope,
    timestamp,
    workDate: WORK_DATE,
    notes: null,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
    employee: {
      id: 'emp-1',
      userId: 'user-1',
      tenantId: TENANT,
      locationId: 'loc-1',
      isActive: true,
      deletedAt: null,
      user: { id: 'user-1', email: 'test@restopsiq.dev' },
    },
    location: { id: 'loc-1', tenantId: TENANT, name: 'Sede' },
  } as AttendanceLogFull;
}

function assignedShift(targetMinutes: number): ResolvedShift {
  return {
    kind: 'ASSIGNED',
    source: 'EMPLOYEE_ASSIGNMENT',
    targetMinutes,
    turno: {
      id: 'turno-1',
      nombre: 'Administrativo',
      sigla: 'ADM',
      horaInicio: '08:00',
      horaFin: '17:00',
      jornada: TurnoJornada.DIURNO,
      locationId: 'loc-1',
      daysOfWeek: [1, 2, 3, 4, 5],
    },
  };
}

describe('buildAttendanceCardDaySummaries (CONN-11)', () => {
  const resolveForDay = jest.fn().mockResolvedValue(assignedShift(540));

  beforeEach(() => {
    resolveForDay.mockClear();
    resolveForDay.mockResolvedValue(assignedShift(540));
  });

  it('entrada temprana no suma minutos extra (07:45–17:00 → ordinary = target)', async () => {
    const logs = [
      makeLog('e1', AttendanceEventType.ENTRY, new Date('2026-06-10T07:45:00.000Z')),
      makeLog('x1', AttendanceEventType.EXIT, new Date('2026-06-10T17:00:00.000Z')),
    ];

    const summaries = await buildAttendanceCardDaySummaries({
      dateFrom: WORK_DATE,
      dateTo: WORK_DATE,
      logs,
      resolveForDay,
    });

    expect(summaries).toHaveLength(1);
    expect(summaries[0].ordinaryMinutes).toBe(540);
    expect(summaries[0].overtimeMinutes).toBe(0);
    expect(summaries[0].unworkedMinutes).toBe(0);
  });

  it('salida tardía sin OVERTIME → overtimeMinutes = 0', async () => {
    const logs = [
      makeLog('e1', AttendanceEventType.ENTRY, new Date('2026-06-10T08:00:00.000Z')),
      makeLog('x1', AttendanceEventType.EXIT, new Date('2026-06-10T17:45:00.000Z')),
    ];

    const summaries = await buildAttendanceCardDaySummaries({
      dateFrom: WORK_DATE,
      dateTo: WORK_DATE,
      logs,
      resolveForDay,
    });

    expect(summaries[0].ordinaryMinutes).toBe(540);
    expect(summaries[0].overtimeMinutes).toBe(0);
  });

  it('par OVERTIME 17:05–18:00 → overtimeMinutes = 55', async () => {
    const logs = [
      makeLog('e1', AttendanceEventType.ENTRY, new Date('2026-06-10T08:00:00.000Z')),
      makeLog('x1', AttendanceEventType.EXIT, new Date('2026-06-10T17:00:00.000Z')),
      makeLog(
        'e2',
        AttendanceEventType.ENTRY,
        new Date('2026-06-10T17:05:00.000Z'),
        AttendanceMarkingScope.OVERTIME,
      ),
      makeLog(
        'x2',
        AttendanceEventType.EXIT,
        new Date('2026-06-10T18:00:00.000Z'),
        AttendanceMarkingScope.OVERTIME,
      ),
    ];

    const summaries = await buildAttendanceCardDaySummaries({
      dateFrom: WORK_DATE,
      dateTo: WORK_DATE,
      logs,
      resolveForDay,
    });

    expect(summaries[0].ordinaryMinutes).toBe(540);
    expect(summaries[0].overtimeMinutes).toBe(55);
  });
});
