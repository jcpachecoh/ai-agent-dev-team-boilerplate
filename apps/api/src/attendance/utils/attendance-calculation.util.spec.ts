import { AttendanceEventType, AttendanceShift } from '@prisma/client';
import {
  calculateDaySummary,
  getBogotaHour,
  getBogotaMinute,
  getShiftStartHour,
  isLateEntry,
} from './attendance-calculation.util';

// Reproduces the pre-OS-585 hardcoded NOCTURNO_START_HOUR constant (21), now resolved by
// the caller via LaborLegalParametersService (HORARIO_NOCTURNO_INICIO).
const NOCTURNO_START_HOUR = 21;

describe('attendance-calculation.util', () => {
  it('obtiene hora y minuto en zona Bogotá', () => {
    const timestamp = new Date('2026-07-01T15:30:00.000Z');

    expect(getBogotaHour(timestamp)).toBe(10);
    expect(getBogotaMinute(timestamp)).toBe(30);
  });

  it('resuelve hora de inicio por turno', () => {
    expect(getShiftStartHour(AttendanceShift.MORNING)).toBe(6);
    expect(getShiftStartHour(AttendanceShift.AFTERNOON)).toBe(14);
    expect(getShiftStartHour(AttendanceShift.NIGHT)).toBe(22);
    expect(getShiftStartHour(null)).toBe(6);
  });

  it('detecta entradas tardías', () => {
    const onTime = {
      eventType: AttendanceEventType.ENTRY,
      shift: AttendanceShift.MORNING,
      timestamp: new Date('2026-07-01T11:00:00.000Z'),
    };
    const late = {
      eventType: AttendanceEventType.ENTRY,
      shift: AttendanceShift.MORNING,
      timestamp: new Date('2026-07-01T15:00:00.000Z'),
    };
    const exit = {
      eventType: AttendanceEventType.EXIT,
      shift: AttendanceShift.MORNING,
      timestamp: new Date('2026-07-01T20:00:00.000Z'),
    };

    expect(isLateEntry(onTime as never)).toBe(false);
    expect(isLateEntry(late as never)).toBe(true);
    expect(isLateEntry(exit as never)).toBe(false);
  });

  it('calcula minutos trabajados, overtime y turno nocturno', () => {
    const logs = [
      {
        id: 'entry-1',
        eventType: AttendanceEventType.ENTRY,
        timestamp: new Date('2026-07-01T03:00:00.000Z'),
      },
      {
        id: 'exit-1',
        eventType: AttendanceEventType.EXIT,
        timestamp: new Date('2026-07-01T23:30:00.000Z'),
      },
    ];

    const summary = calculateDaySummary(
      logs as never,
      new Date('2026-07-01T23:30:00.000Z'),
      NOCTURNO_START_HOUR,
    );

    expect(summary.totalMinutes).toBeGreaterThan(480);
    expect(summary.overtimeMinutes).toBeGreaterThan(0);
    expect(summary.isNocturno).toBe(true);
    expect(summary.pairs).toHaveLength(1);
  });

  it('usa la hora actual cuando no hay salida registrada', () => {
    const logs = [
      {
        id: 'entry-open',
        eventType: AttendanceEventType.ENTRY,
        timestamp: new Date('2026-07-01T13:00:00.000Z'),
      },
    ];
    const now = new Date('2026-07-01T17:00:00.000Z');

    const summary = calculateDaySummary(logs as never, now, NOCTURNO_START_HOUR);

    expect(summary.totalMinutes).toBe(240);
    expect(summary.overtimeMinutes).toBe(0);
    expect(summary.pairs[0]?.exitTimestamp).toBeUndefined();
  });

  it('marca nocturno cuando solo la salida cae después de las 22h', () => {
    const logs = [
      {
        id: 'entry-day',
        eventType: AttendanceEventType.ENTRY,
        timestamp: new Date('2026-07-01T20:00:00.000Z'),
      },
      {
        id: 'exit-night',
        eventType: AttendanceEventType.EXIT,
        timestamp: new Date('2026-07-02T04:00:00.000Z'),
      },
    ];

    const summary = calculateDaySummary(
      logs as never,
      new Date('2026-07-02T04:00:00.000Z'),
      NOCTURNO_START_HOUR,
    );

    expect(summary.isNocturno).toBe(true);
  });

  it('evalúa tardanza en turno tarde y noche', () => {
    const afternoonOnTime = {
      eventType: AttendanceEventType.ENTRY,
      shift: AttendanceShift.AFTERNOON,
      timestamp: new Date('2026-07-01T19:04:00.000Z'),
    };
    const afternoonLate = {
      eventType: AttendanceEventType.ENTRY,
      shift: AttendanceShift.AFTERNOON,
      timestamp: new Date('2026-07-01T19:06:00.000Z'),
    };
    const nightOnTime = {
      eventType: AttendanceEventType.ENTRY,
      shift: AttendanceShift.NIGHT,
      timestamp: new Date('2026-07-02T03:04:00.000Z'),
    };

    expect(isLateEntry(afternoonOnTime as never)).toBe(false);
    expect(isLateEntry(afternoonLate as never)).toBe(true);
    expect(isLateEntry(nightOnTime as never)).toBe(false);
  });

  it('retorna resumen vacío cuando no hay entradas', () => {
    const summary = calculateDaySummary(
      [],
      new Date('2026-07-01T17:00:00.000Z'),
      NOCTURNO_START_HOUR,
    );

    expect(summary.totalMinutes).toBe(0);
    expect(summary.overtimeMinutes).toBe(0);
    expect(summary.isNocturno).toBe(false);
    expect(summary.pairs).toEqual([]);
  });
});
