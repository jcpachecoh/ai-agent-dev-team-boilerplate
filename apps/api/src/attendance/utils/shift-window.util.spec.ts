import { AttendanceEventType, AttendanceMarkingScope } from '@prisma/client';

import {
  computeDayMinutesByScope,
  computeOrdinaryPairMinutes,
  computeShiftEndDateTime,
  computeShiftStartDateTime,
  resolveShiftWindow,
} from './shift-window.util';

describe('shift-window.util', () => {
  const workDate = new Date('2026-07-10T00:00:00.000Z');
  const horaInicio = '08:00';
  const horaFin = '17:00';

  function atHour(hour: number, minute = 0): Date {
    return new Date(Date.UTC(2026, 6, 10, hour, minute, 0, 0));
  }

  it('computeShiftStartDateTime devuelve hora de inicio en workDate', () => {
    const start = computeShiftStartDateTime(workDate, horaInicio, horaFin);
    expect(start.getUTCHours()).toBe(8);
    expect(start.getUTCMinutes()).toBe(0);
  });

  it('entrada 15 min antes no suma anticipación (540 min ordinarios)', () => {
    const { shiftStartTime, shiftEndTime } = resolveShiftWindow(workDate, horaInicio, horaFin);
    const result = computeOrdinaryPairMinutes({
      entryTimestamp: atHour(7, 45),
      exitTimestamp: atHour(17, 0),
      shiftStartTime,
      shiftEndTime,
    });

    expect(result.ordinaryMinutes).toBe(540);
    expect(result.clippedEarlyMinutes).toBe(15);
    expect(result.clippedLateMinutes).toBe(0);
  });

  it('jornada exacta 08:00–17:00 → 540 min', () => {
    const { shiftStartTime, shiftEndTime } = resolveShiftWindow(workDate, horaInicio, horaFin);
    const result = computeOrdinaryPairMinutes({
      entryTimestamp: atHour(8, 0),
      exitTimestamp: atHour(17, 0),
      shiftStartTime,
      shiftEndTime,
    });

    expect(result.ordinaryMinutes).toBe(540);
    expect(result.clippedEarlyMinutes).toBe(0);
  });

  it('salida tardía se recorta a shiftEnd (540 min, 45 min clipped late)', () => {
    const { shiftStartTime, shiftEndTime } = resolveShiftWindow(workDate, horaInicio, horaFin);
    const result = computeOrdinaryPairMinutes({
      entryTimestamp: atHour(8, 0),
      exitTimestamp: atHour(17, 45),
      shiftStartTime,
      shiftEndTime,
    });

    expect(result.ordinaryMinutes).toBe(540);
    expect(result.clippedLateMinutes).toBe(45);
  });

  it('pares OVERTIME no suman a ordinaryMinutes', () => {
    const { shiftStartTime, shiftEndTime } = resolveShiftWindow(workDate, horaInicio, horaFin);
    const result = computeDayMinutesByScope({
      logs: [
        {
          eventType: AttendanceEventType.ENTRY,
          markingScope: AttendanceMarkingScope.ORDINARY,
          timestamp: atHour(8, 0),
          isActive: true,
        },
        {
          eventType: AttendanceEventType.EXIT,
          markingScope: AttendanceMarkingScope.ORDINARY,
          timestamp: atHour(17, 0),
          isActive: true,
        },
        {
          eventType: AttendanceEventType.ENTRY,
          markingScope: AttendanceMarkingScope.OVERTIME,
          timestamp: atHour(17, 5),
          isActive: true,
        },
        {
          eventType: AttendanceEventType.EXIT,
          markingScope: AttendanceMarkingScope.OVERTIME,
          timestamp: atHour(18, 0),
          isActive: true,
        },
      ],
      shiftStartTime,
      shiftEndTime,
    });

    expect(result.ordinaryMinutes).toBe(540);
    expect(result.overtimeScopeMinutes).toBe(55);
  });

  it('computeShiftEndDateTime sigue soportando cruce de medianoche', () => {
    const end = computeShiftEndDateTime(workDate, '22:00', '06:00');
    expect(end.getUTCDate()).toBe(11);
    expect(end.getUTCHours()).toBe(6);
  });
});
