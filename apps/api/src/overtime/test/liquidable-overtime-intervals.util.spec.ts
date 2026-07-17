import { AttendanceEventType, AttendanceMarkingScope } from '@prisma/client';

import {
  computeLiquidableOvertimeIntervals,
  intersectMarkedWithWindows,
  mergeIntervals,
  pairOvertimeMarkingIntervals,
  subtractIntervals,
  totalIntervalMinutes,
} from '../utils/liquidable-overtime-intervals.util';
import { decideNom07OvertimeLiquidation } from '../utils/nom07-overtime-liquidation.util';

function ms(iso: string): number {
  return Date.parse(iso);
}

function interval(startIso: string, endIso: string) {
  return { startMs: ms(startIso), endMs: ms(endIso) };
}

describe('liquidable-overtime-intervals.util', () => {
  describe('mergeIntervals', () => {
    it('fusiona intervalos superpuestos y contiguos', () => {
      expect(
        mergeIntervals([
          interval('2026-07-16T22:00:00.000-05:00', '2026-07-16T23:00:00.000-05:00'),
          interval('2026-07-16T22:30:00.000-05:00', '2026-07-17T00:00:00.000-05:00'),
          interval('2026-07-17T00:00:00.000-05:00', '2026-07-17T01:00:00.000-05:00'),
        ]),
      ).toEqual([interval('2026-07-16T22:00:00.000-05:00', '2026-07-17T01:00:00.000-05:00')]);
    });
  });

  describe('intersectMarkedWithWindows', () => {
    it('admin aprobada + marcación completa → intersección total de la ventana marcada', () => {
      const marked = [interval('2026-07-16T22:00:00.000-05:00', '2026-07-17T01:30:00.000-05:00')];
      const windows = [interval('2026-07-16T22:00:00.000-05:00', '2026-07-17T01:30:00.000-05:00')];
      expect(totalIntervalMinutes(intersectMarkedWithWindows(marked, windows))).toBe(210);
    });

    it('admin aprobada + marcación parcial → solo intersección', () => {
      const marked = [interval('2026-07-16T22:00:00.000-05:00', '2026-07-16T23:00:00.000-05:00')];
      const windows = [interval('2026-07-16T22:00:00.000-05:00', '2026-07-17T01:30:00.000-05:00')];
      expect(totalIntervalMinutes(intersectMarkedWithWindows(marked, windows))).toBe(60);
    });

    it('marcación fuera de la ventana → 0', () => {
      const marked = [interval('2026-07-16T18:00:00.000-05:00', '2026-07-16T19:00:00.000-05:00')];
      const windows = [interval('2026-07-16T22:00:00.000-05:00', '2026-07-17T01:30:00.000-05:00')];
      expect(intersectMarkedWithWindows(marked, windows)).toEqual([]);
    });

    it('ventana que cruza medianoche', () => {
      const marked = [interval('2026-07-16T23:00:00.000-05:00', '2026-07-17T01:00:00.000-05:00')];
      const windows = [interval('2026-07-16T22:00:00.000-05:00', '2026-07-17T02:00:00.000-05:00')];
      expect(totalIntervalMinutes(intersectMarkedWithWindows(marked, windows))).toBe(120);
    });
  });

  describe('computeLiquidableOvertimeIntervals', () => {
    const marked = [interval('2026-07-16T22:00:00.000-05:00', '2026-07-17T02:00:00.000-05:00')];

    it('admin aprobada sin marcación → 0', () => {
      const result = computeLiquidableOvertimeIntervals({
        markedOvertimeIntervals: [],
        automaticApproved: false,
        approvedAdminWindows: [
          interval('2026-07-16T22:00:00.000-05:00', '2026-07-17T01:30:00.000-05:00'),
        ],
      });
      expect(result.liquidableMinutes).toBe(0);
    });

    it('dos ventanas admin superpuestas no duplican minutos', () => {
      const result = computeLiquidableOvertimeIntervals({
        markedOvertimeIntervals: marked,
        automaticApproved: false,
        approvedAdminWindows: [
          interval('2026-07-16T22:00:00.000-05:00', '2026-07-17T00:30:00.000-05:00'),
          interval('2026-07-16T23:30:00.000-05:00', '2026-07-17T01:30:00.000-05:00'),
        ],
      });
      expect(result.liquidableMinutes).toBe(210);
    });

    it('automática + administrativa sin solape', () => {
      const result = computeLiquidableOvertimeIntervals({
        markedOvertimeIntervals: [
          interval('2026-07-16T18:00:00.000-05:00', '2026-07-16T19:00:00.000-05:00'),
          interval('2026-07-16T22:00:00.000-05:00', '2026-07-16T23:00:00.000-05:00'),
        ],
        automaticApproved: true,
        approvedAdminWindows: [
          interval('2026-07-16T22:00:00.000-05:00', '2026-07-16T23:00:00.000-05:00'),
        ],
      });
      expect(result.liquidableMinutes).toBe(120);
      expect(totalIntervalMinutes(result.fromAutomaticOnly)).toBe(60);
      expect(totalIntervalMinutes(result.fromBoth)).toBe(60);
      expect(totalIntervalMinutes(result.fromAdministrativeOnly)).toBe(0);
    });

    it('automática + administrativa con solape parcial — sin doble conteo', () => {
      const result = computeLiquidableOvertimeIntervals({
        markedOvertimeIntervals: marked,
        automaticApproved: true,
        approvedAdminWindows: [
          interval('2026-07-16T23:00:00.000-05:00', '2026-07-17T01:00:00.000-05:00'),
        ],
      });
      expect(result.liquidableMinutes).toBe(240);
      expect(totalIntervalMinutes(result.fromBoth)).toBe(120);
      expect(totalIntervalMinutes(result.fromAutomaticOnly)).toBe(120);
    });

    it('automática contenida completamente en admin', () => {
      const result = computeLiquidableOvertimeIntervals({
        markedOvertimeIntervals: [
          interval('2026-07-16T22:30:00.000-05:00', '2026-07-16T23:30:00.000-05:00'),
        ],
        automaticApproved: true,
        approvedAdminWindows: [
          interval('2026-07-16T22:00:00.000-05:00', '2026-07-17T01:00:00.000-05:00'),
        ],
      });
      expect(result.liquidableMinutes).toBe(60);
      expect(totalIntervalMinutes(result.fromBoth)).toBe(60);
      expect(totalIntervalMinutes(result.fromAutomaticOnly)).toBe(0);
    });

    it('admin contenida completamente en automática', () => {
      const result = computeLiquidableOvertimeIntervals({
        markedOvertimeIntervals: marked,
        automaticApproved: true,
        approvedAdminWindows: [
          interval('2026-07-16T22:30:00.000-05:00', '2026-07-16T23:00:00.000-05:00'),
        ],
      });
      expect(result.liquidableMinutes).toBe(240);
      expect(totalIntervalMinutes(result.fromBoth)).toBe(30);
      expect(totalIntervalMinutes(result.fromAutomaticOnly)).toBe(210);
    });
  });

  describe('subtractIntervals', () => {
    it('resta bloqueadores del origen', () => {
      expect(
        subtractIntervals(
          [interval('2026-07-16T22:00:00.000-05:00', '2026-07-17T02:00:00.000-05:00')],
          [interval('2026-07-16T23:00:00.000-05:00', '2026-07-17T01:00:00.000-05:00')],
        ),
      ).toEqual([
        interval('2026-07-16T22:00:00.000-05:00', '2026-07-16T23:00:00.000-05:00'),
        interval('2026-07-17T01:00:00.000-05:00', '2026-07-17T02:00:00.000-05:00'),
      ]);
    });
  });

  describe('pairOvertimeMarkingIntervals', () => {
    it('empareja solo markingScope OVERTIME activos', () => {
      const pairs = pairOvertimeMarkingIntervals([
        {
          eventType: AttendanceEventType.ENTRY,
          markingScope: AttendanceMarkingScope.ORDINARY,
          timestamp: new Date('2026-07-16T13:00:00.000Z'),
          isActive: true,
        },
        {
          eventType: AttendanceEventType.EXIT,
          markingScope: AttendanceMarkingScope.ORDINARY,
          timestamp: new Date('2026-07-16T22:00:00.000Z'),
          isActive: true,
        },
        {
          eventType: AttendanceEventType.ENTRY,
          markingScope: AttendanceMarkingScope.OVERTIME,
          timestamp: new Date('2026-07-16T22:05:00.000-05:00'),
          isActive: true,
        },
        {
          eventType: AttendanceEventType.EXIT,
          markingScope: AttendanceMarkingScope.OVERTIME,
          timestamp: new Date('2026-07-16T23:05:00.000-05:00'),
          isActive: true,
        },
      ]);
      expect(totalIntervalMinutes(pairs)).toBe(60);
    });
  });
});

describe('decideNom07OvertimeLiquidation', () => {
  it('solicitud pendiente → no liquida admin; sin auto → zero', () => {
    const decision = decideNom07OvertimeLiquidation({
      logs: [
        {
          eventType: AttendanceEventType.ENTRY,
          markingScope: AttendanceMarkingScope.OVERTIME,
          timestamp: new Date('2026-07-16T22:00:00.000-05:00'),
          isActive: true,
        },
        {
          eventType: AttendanceEventType.EXIT,
          markingScope: AttendanceMarkingScope.OVERTIME,
          timestamp: new Date('2026-07-16T23:00:00.000-05:00'),
          isActive: true,
        },
      ],
      automaticStatus: 'PENDIENTE_GERENCIA_OPERACIONES',
      approvedAdminWindows: [],
    });
    expect(decision.zeroOvertime).toBe(true);
    expect(decision.useLegacyAutomaticSummary).toBe(false);
  });

  it('solicitud objetada no aporta ventanas (solo APROBADA llega al util)', () => {
    const decision = decideNom07OvertimeLiquidation({
      logs: [
        {
          eventType: AttendanceEventType.ENTRY,
          markingScope: AttendanceMarkingScope.OVERTIME,
          timestamp: new Date('2026-07-16T22:00:00.000-05:00'),
          isActive: true,
        },
        {
          eventType: AttendanceEventType.EXIT,
          markingScope: AttendanceMarkingScope.OVERTIME,
          timestamp: new Date('2026-07-16T23:00:00.000-05:00'),
          isActive: true,
        },
      ],
      automaticStatus: 'OBJETADA',
      approvedAdminWindows: [],
    });
    expect(decision.zeroOvertime).toBe(true);
  });

  it('auto APROBADA sin pares OVERTIME → legacy CONN-04a', () => {
    const decision = decideNom07OvertimeLiquidation({
      logs: [
        {
          eventType: AttendanceEventType.ENTRY,
          markingScope: AttendanceMarkingScope.ORDINARY,
          timestamp: new Date('2026-07-16T11:00:00.000Z'),
          isActive: true,
        },
        {
          eventType: AttendanceEventType.EXIT,
          markingScope: AttendanceMarkingScope.ORDINARY,
          timestamp: new Date('2026-07-16T21:00:00.000Z'),
          isActive: true,
        },
      ],
      automaticStatus: 'APROBADA',
      approvedAdminWindows: [],
    });
    expect(decision.useLegacyAutomaticSummary).toBe(true);
    expect(decision.zeroOvertime).toBe(false);
  });

  it('fila administrativa incompleta se ignora vía resolveAdminWindows vacío', () => {
    const decision = decideNom07OvertimeLiquidation({
      logs: [
        {
          eventType: AttendanceEventType.ENTRY,
          markingScope: AttendanceMarkingScope.OVERTIME,
          timestamp: new Date('2026-07-16T22:00:00.000-05:00'),
          isActive: true,
        },
        {
          eventType: AttendanceEventType.EXIT,
          markingScope: AttendanceMarkingScope.OVERTIME,
          timestamp: new Date('2026-07-16T23:00:00.000-05:00'),
          isActive: true,
        },
      ],
      automaticStatus: null,
      approvedAdminWindows: [
        {
          employeeId: 'emp-1',
          locationId: 'loc-1',
          workDate: new Date('2026-07-16T00:00:00.000Z'),
          proposedStartTime: new Date('invalid'),
          proposedEndTime: new Date('invalid'),
          proposedMinutes: 90,
        },
      ],
    });
    expect(decision.adminWindowCount).toBe(0);
    expect(decision.zeroOvertime).toBe(true);
  });
});
