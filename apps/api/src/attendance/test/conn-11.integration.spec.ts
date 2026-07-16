/**
 * CONN-11 — Integration acceptance scenarios E1–E7.
 * Wires shift-window, jornada cutoff, payable minutes, and overtime detection
 * without full AppModule / database (deterministic unit-integration).
 */
import { Test, TestingModule } from '@nestjs/testing';
import {
  AttendanceEventType,
  AttendanceMarkingScope,
  OvertimeRequestType,
  OvertimeStatus,
  TurnoJornada,
} from '@prisma/client';

import { ShiftResolutionService } from '../../turnos/service/shift-resolution.service';
import { OvertimeRepository } from '../../overtime/repository/overtime.repository';
import { OvertimeDetectionService } from '../../overtime/service/overtime-detection.service';
import { OvertimeNotificationService } from '../../overtime/service/overtime-notification.service';
import type { CutoffCandidate } from '../interfaces/jornada-cutoff.interfaces';
import { JornadaCutoffRepository } from '../repository/jornada-cutoff.repository';
import { JornadaCutoffService } from '../service/jornada-cutoff.service';
import { calculatePayableDayMinutes } from '../utils/attendance-calculation.util';
import {
  computeDayMinutesByScope,
  computeOrdinaryPairMinutes,
  resolveShiftWindow,
} from '../utils/shift-window.util';

const TENANT = 'tenant-conn11';
const EMPLOYEE_ID = 'emp-conn11';
const LOCATION_ID = 'loc-conn11';
const WORK_DATE = new Date('2026-07-10T00:00:00.000Z');
const HORA_INICIO = '08:00';
const HORA_FIN = '17:00';

const ASSIGNED_SHIFT = {
  kind: 'ASSIGNED' as const,
  source: 'CALENDAR' as const,
  targetMinutes: 540,
  turno: {
    id: 'turno-1',
    nombre: 'Administrativo',
    sigla: 'ADM',
    horaInicio: HORA_INICIO,
    horaFin: HORA_FIN,
    jornada: TurnoJornada.DIURNO,
    locationId: LOCATION_ID,
    daysOfWeek: [4],
  },
};

/** Mirrors ReportsService.applyOvertimeApprovalGate (CONN-04a / NOM-07). */
function payrollOvertimeMinutes(
  accumulatedMinutes: number,
  approvalStatus: OvertimeStatus | null,
): number {
  if (approvalStatus !== OvertimeStatus.APROBADA) return 0;
  return accumulatedMinutes;
}

function atUtcHour(hour: number, minute = 0): Date {
  return new Date(Date.UTC(2026, 6, 10, hour, minute, 0, 0));
}

describe('CONN-11 integration (E1–E7)', () => {
  describe('E1 — entrada anticipada no paga anticipación', () => {
    it('recorta 15 min de anticipación; ordinary = 540', () => {
      const { shiftStartTime, shiftEndTime } = resolveShiftWindow(WORK_DATE, HORA_INICIO, HORA_FIN);
      const result = computeOrdinaryPairMinutes({
        entryTimestamp: atUtcHour(7, 45),
        exitTimestamp: atUtcHour(17, 0),
        shiftStartTime,
        shiftEndTime,
      });

      expect(result.ordinaryMinutes).toBe(540);
      expect(result.clippedEarlyMinutes).toBe(15);
      expect(result.clippedLateMinutes).toBe(0);
    });
  });

  describe('E2 — corte automático sin salida del empleado', () => {
    let cutoffService: JornadaCutoffService;
    const repositoryMock = {
      findByEmployeeAndWorkDate: jest.fn(),
      findOpenOrdinaryEntries: jest.fn(),
      createSystemExitLog: jest.fn(),
      create: jest.fn(),
    };
    const shiftResolutionMock = {
      resolveForDay: jest.fn().mockResolvedValue(ASSIGNED_SHIFT),
    };

    beforeEach(async () => {
      jest.clearAllMocks();
      repositoryMock.findByEmployeeAndWorkDate.mockResolvedValue(null);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          JornadaCutoffService,
          { provide: JornadaCutoffRepository, useValue: repositoryMock },
          { provide: ShiftResolutionService, useValue: shiftResolutionMock },
        ],
      }).compile();

      cutoffService = module.get(JornadaCutoffService);
    });

    it('job a las 17:01 crea EXIT SYSTEM, JornadaCutoff e isBeforeCutoff=false', async () => {
      const shiftEndTime = atUtcHour(17, 0);
      const candidate: CutoffCandidate = {
        tenantId: TENANT,
        employeeId: EMPLOYEE_ID,
        locationId: LOCATION_ID,
        workDate: WORK_DATE,
        entryLogId: 'entry-1',
        shiftEndTime,
      };

      repositoryMock.findOpenOrdinaryEntries.mockResolvedValue([
        {
          id: 'entry-1',
          tenantId: TENANT,
          employeeId: EMPLOYEE_ID,
          locationId: LOCATION_ID,
          workDate: WORK_DATE,
          timestamp: atUtcHour(8, 0),
          shift: 'MORNING',
        },
      ]);
      repositoryMock.createSystemExitLog.mockResolvedValue({ id: 'exit-system' });
      repositoryMock.create.mockResolvedValue({ id: 'cutoff-1' });

      await expect(cutoffService.isBeforeCutoff(TENANT, EMPLOYEE_ID, WORK_DATE)).resolves.toBe(
        true,
      );

      const result = await cutoffService.executeCutoffIfDue(candidate, atUtcHour(17, 1));

      expect(result).toEqual({ id: 'cutoff-1' });
      expect(repositoryMock.createSystemExitLog).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: shiftEndTime,
        }),
      );

      repositoryMock.findByEmployeeAndWorkDate.mockResolvedValue({ id: 'cutoff-1' });
      await expect(cutoffService.isBeforeCutoff(TENANT, EMPLOYEE_ID, WORK_DATE)).resolves.toBe(
        false,
      );
    });
  });

  describe('E3 — salida tardía sin re-marcación → no HE', () => {
    let detectionService: OvertimeDetectionService;
    const overtimeRepoMock = {
      findActiveAutomaticByPeriod: jest.fn().mockResolvedValue(null),
      findOvertimeScopeLogsForPeriod: jest.fn().mockResolvedValue([]),
      createRequest: jest.fn(),
      updateRequest: jest.fn(),
      upsertApproval: jest.fn(),
    };

    beforeEach(async () => {
      jest.clearAllMocks();
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          OvertimeDetectionService,
          { provide: OvertimeRepository, useValue: overtimeRepoMock },
          {
            provide: ShiftResolutionService,
            useValue: { resolveForDay: jest.fn().mockResolvedValue(ASSIGNED_SHIFT) },
          },
          {
            provide: OvertimeNotificationService,
            useValue: { notifyLevelPending: jest.fn() },
          },
        ],
      }).compile();

      detectionService = module.get(OvertimeDetectionService);
    });

    it('ordinary tardío recortado y sin OvertimeRequest', async () => {
      const { shiftStartTime, shiftEndTime } = resolveShiftWindow(WORK_DATE, HORA_INICIO, HORA_FIN);
      const scoped = computeDayMinutesByScope({
        logs: [
          {
            eventType: AttendanceEventType.ENTRY,
            markingScope: AttendanceMarkingScope.ORDINARY,
            timestamp: atUtcHour(8, 0),
            isActive: true,
          },
          {
            eventType: AttendanceEventType.EXIT,
            markingScope: AttendanceMarkingScope.ORDINARY,
            timestamp: atUtcHour(17, 45),
            isActive: true,
          },
        ],
        shiftStartTime,
        shiftEndTime,
      });

      expect(scoped.ordinaryMinutes).toBe(540);
      expect(scoped.overtimeScopeMinutes).toBe(0);

      await detectionService.onExitRegistered({
        tenantId: TENANT,
        employeeId: EMPLOYEE_ID,
        locationId: LOCATION_ID,
        workDate: WORK_DATE,
        actualEndTime: atUtcHour(17, 45),
      });

      expect(overtimeRepoMock.createRequest).not.toHaveBeenCalled();
    });
  });

  describe('E4 — re-marcación OVERTIME genera acumulado', () => {
    it('par 17:05–18:00 → 55 min OVERTIME scope', () => {
      const { shiftStartTime, shiftEndTime } = resolveShiftWindow(WORK_DATE, HORA_INICIO, HORA_FIN);
      const result = computeDayMinutesByScope({
        logs: [
          {
            eventType: AttendanceEventType.ENTRY,
            markingScope: AttendanceMarkingScope.ORDINARY,
            timestamp: atUtcHour(8, 0),
            isActive: true,
          },
          {
            eventType: AttendanceEventType.EXIT,
            markingScope: AttendanceMarkingScope.ORDINARY,
            timestamp: atUtcHour(17, 0),
            isActive: true,
          },
          {
            eventType: AttendanceEventType.ENTRY,
            markingScope: AttendanceMarkingScope.OVERTIME,
            timestamp: atUtcHour(17, 5),
            isActive: true,
          },
          {
            eventType: AttendanceEventType.EXIT,
            markingScope: AttendanceMarkingScope.OVERTIME,
            timestamp: atUtcHour(18, 0),
            isActive: true,
          },
        ],
        shiftStartTime,
        shiftEndTime,
      });

      expect(result.overtimeScopeMinutes).toBe(55);

      const payable = calculatePayableDayMinutes({
        logs: [
          {
            eventType: AttendanceEventType.ENTRY,
            markingScope: AttendanceMarkingScope.OVERTIME,
            timestamp: atUtcHour(17, 5),
            isActive: true,
          },
          {
            eventType: AttendanceEventType.EXIT,
            markingScope: AttendanceMarkingScope.OVERTIME,
            timestamp: atUtcHour(18, 0),
            isActive: true,
          },
        ] as never,
        shiftStartTime,
        shiftEndTime,
      });
      expect(payable.overtimeMinutes).toBe(55);
    });
  });

  describe('E5/E6 — liquidación según aprobación CONN-04a', () => {
    it('E5: APROBADA → minutos elegibles para NOM-07', () => {
      expect(payrollOvertimeMinutes(55, OvertimeStatus.APROBADA)).toBe(55);
    });

    it('E6: PENDIENTE_ADMIN → liquidación excluye minutos', () => {
      expect(payrollOvertimeMinutes(55, OvertimeStatus.PENDIENTE_ADMIN)).toBe(0);
    });
  });

  describe('E5 — solicitud tras acumulado OVERTIME > 30', () => {
    let detectionService: OvertimeDetectionService;
    const overtimeRepoMock = {
      findActiveAutomaticByPeriod: jest.fn().mockResolvedValue(null),
      findOvertimeScopeLogsForPeriod: jest.fn(),
      createRequest: jest.fn(),
      updateRequest: jest.fn(),
      upsertApproval: jest.fn(),
    };

    beforeEach(async () => {
      jest.clearAllMocks();
      overtimeRepoMock.findOvertimeScopeLogsForPeriod.mockResolvedValue([
        {
          id: 'ot-e',
          workDate: WORK_DATE,
          eventType: AttendanceEventType.ENTRY,
          timestamp: atUtcHour(17, 5),
        },
        {
          id: 'ot-x',
          workDate: WORK_DATE,
          eventType: AttendanceEventType.EXIT,
          timestamp: atUtcHour(18, 0),
        },
      ]);
      overtimeRepoMock.createRequest.mockResolvedValue({
        id: 'req-1',
        tenantId: TENANT,
        employeeId: EMPLOYEE_ID,
        locationId: LOCATION_ID,
        type: OvertimeRequestType.DETECCION_AUTOMATICA,
        shiftEndTime: atUtcHour(17, 0),
        actualEndTime: atUtcHour(18, 0),
        accumulatedMinutes: 55,
        status: OvertimeStatus.PENDIENTE_ADMIN,
        payrollPeriod: '2026-07',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          OvertimeDetectionService,
          { provide: OvertimeRepository, useValue: overtimeRepoMock },
          {
            provide: ShiftResolutionService,
            useValue: { resolveForDay: jest.fn().mockResolvedValue(ASSIGNED_SHIFT) },
          },
          {
            provide: OvertimeNotificationService,
            useValue: { notifyLevelPending: jest.fn().mockResolvedValue(undefined) },
          },
        ],
      }).compile();

      detectionService = module.get(OvertimeDetectionService);
    });

    it('crea OvertimeRequest PENDIENTE_ADMIN con 55 min acumulados', async () => {
      await detectionService.onExitRegistered({
        tenantId: TENANT,
        employeeId: EMPLOYEE_ID,
        locationId: LOCATION_ID,
        workDate: WORK_DATE,
        actualEndTime: atUtcHour(18, 0),
      });

      expect(overtimeRepoMock.createRequest).toHaveBeenCalledWith(
        TENANT,
        expect.objectContaining({
          accumulatedMinutes: 55,
          status: OvertimeStatus.PENDIENTE_ADMIN,
        }),
      );
    });
  });

  describe('E7 — isBeforeCutoff para consumidores (kiosk / correcciones)', () => {
    let cutoffService: JornadaCutoffService;
    const repositoryMock = {
      findByEmployeeAndWorkDate: jest.fn(),
      findOpenOrdinaryEntries: jest.fn(),
      createSystemExitLog: jest.fn(),
      create: jest.fn(),
    };

    beforeEach(async () => {
      jest.clearAllMocks();
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          JornadaCutoffService,
          { provide: JornadaCutoffRepository, useValue: repositoryMock },
          {
            provide: ShiftResolutionService,
            useValue: { resolveForDay: jest.fn().mockResolvedValue(ASSIGNED_SHIFT) },
          },
        ],
      }).compile();

      cutoffService = module.get(JornadaCutoffService);
    });

    it('pre shiftEnd / sin corte → true; post JornadaCutoff → false', async () => {
      repositoryMock.findByEmployeeAndWorkDate.mockResolvedValue(null);
      await expect(cutoffService.isBeforeCutoff(TENANT, EMPLOYEE_ID, WORK_DATE)).resolves.toBe(
        true,
      );

      repositoryMock.findByEmployeeAndWorkDate.mockResolvedValue({
        id: 'cutoff-1',
        shiftEndTime: atUtcHour(17, 0),
      });
      await expect(cutoffService.isBeforeCutoff(TENANT, EMPLOYEE_ID, WORK_DATE)).resolves.toBe(
        false,
      );
    });
  });
});
