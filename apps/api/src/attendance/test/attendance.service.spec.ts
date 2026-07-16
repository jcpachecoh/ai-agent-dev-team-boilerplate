import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  AttendanceEventType,
  AttendanceLogSource,
  AttendanceMarkingScope,
  AttendanceShift,
  AttendanceValidationStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AttendanceService } from '../service/attendance.service';
import { AttendanceRepository } from '../repository/attendance.repository';
import { MobileAttendanceRepository } from '../mobile/repository/mobile-attendance.repository';
import { AuthService } from '../../auth/service/auth.service';
import { UserLocationsService } from '../../locations/service/user-locations.service';
import { ShiftResolutionService } from '../../turnos/service/shift-resolution.service';
import { VacationsService } from '../../vacations/service/vacations.service';
import { VACATION_MARKING_BLOCKED_MESSAGE } from '../service/vacation-attendance.guard';
import { LaborLegalParametersService } from '../../labor-legal-parameters/service/labor-legal-parameters.service';
import { OvertimeDetectionService } from '../../overtime/service/overtime-detection.service';
import { DailyCostCenterService } from '../../daily-cost-center/service/daily-cost-center.service';
import { JornadaCutoffService } from '../service/jornada-cutoff.service';

const shiftResolutionMock = {
  resolveForDay: jest.fn().mockResolvedValue({ kind: 'NONE', targetMinutes: 0 }),
  getTargetMinutesForDay: jest.fn().mockResolvedValue(0),
};

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

const bcryptCompare = bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>;

// ── Shared fixtures ───────────────────────────────────────────────────────────

const TENANT = 'test-tenant';
const LOCATION_ID = 'loc-001';
const WORK_DATE = new Date('2026-06-10T00:00:00.000Z');

function makeUser(overrides?: Partial<{ id: string; email: string }>) {
  return {
    id: overrides?.id ?? 'user-001',
    email: overrides?.email ?? 'carlos@palos-de-lena.dev',
    tenantId: TENANT,
    isActive: true,
    cedula: '12345678',
  };
}

function makeEmployee(id: string, overrides?: Partial<{ pinHash: string | null; userId: string }>) {
  return {
    id,
    userId: overrides?.userId ?? 'user-001',
    tenantId: TENANT,
    locationId: LOCATION_ID,
    isActive: true,
    deletedAt: null,
    pinHash: overrides?.pinHash !== undefined ? overrides.pinHash : '$2b$12$hash',
    user: makeUser(),
  };
}

function makeAttendanceLog(
  id: string,
  eventType: AttendanceEventType,
  timestamp: Date,
  workDate = WORK_DATE,
  markingScope: AttendanceMarkingScope = AttendanceMarkingScope.ORDINARY,
) {
  return {
    id,
    tenantId: TENANT,
    employeeId: 'emp-001',
    locationId: LOCATION_ID,
    eventType,
    shift: AttendanceShift.MORNING,
    markingScope,
    timestamp,
    workDate,
    notes: null,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function makeAttendanceLogFull(
  id: string,
  empId: string,
  eventType: AttendanceEventType,
  timestamp: Date,
) {
  const emp = makeEmployee(empId);
  return {
    ...makeAttendanceLog(id, eventType, timestamp),
    employeeId: empId,
    employee: emp,
    location: { id: LOCATION_ID, tenantId: TENANT, name: 'Sede Test' },
  } as any;
}

// ── Repo mock ────────────────────────────────────────────────────────────────

const repoMock = {
  findUserByCedula: jest.fn(),
  findEmployeeByUserAndLocation: jest.fn(),
  findEmployeeByUserId: jest.fn(),
  findOpenEntry: jest.fn(),
  findOpenEntryByScope: jest.fn(),
  findAllForDay: jest.fn(),
  create: jest.fn(),
  listHistory: jest.fn(),
  listActiveAtLocation: jest.fn(),
  findById: jest.fn(),
  findDuplicateEvent: jest.fn(),
  createEventLog: jest.fn(),
  findLocationById: jest.fn(),
};

const mobileRepoMock = {
  create: jest.fn(),
};

const authServiceMock = {
  issueKioskAuthTokens: jest.fn(),
};

const userLocationsServiceMock = {
  resolveAllowedLocationIds: jest.fn().mockResolvedValue(null),
  assertLocationAllowed: jest.fn(),
};

const vacationsServiceMock = {
  findApprovedDisfruteByDate: jest.fn().mockResolvedValue(null),
  getApprovedDisfruteRanges: jest.fn().mockResolvedValue([]),
};

// HORARIO_NOCTURNO_INICIO — resolves to 21 (the old NOCTURNO_START_HOUR default) so existing
// nocturno-classification assertions keep passing unchanged.
const legalParametersServiceMock = {
  getValueAt: jest.fn().mockResolvedValue(21),
};

const dailyCostCenterServiceMock = {
  resolveFromAttendance: jest.fn().mockResolvedValue(null),
};

const overtimeDetectionServiceMock = {
  onExitRegistered: jest.fn().mockResolvedValue(undefined),
};

const jornadaCutoffServiceMock = {
  isBeforeCutoff: jest.fn().mockResolvedValue(true),
  getCutoff: jest.fn().mockResolvedValue(null),
};

const ACTOR = { sub: 'user-001', roleCode: 'OWNER' };

describe('AttendanceService', () => {
  let service: AttendanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: AttendanceRepository, useValue: repoMock },
        { provide: MobileAttendanceRepository, useValue: mobileRepoMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: ShiftResolutionService, useValue: shiftResolutionMock },
        { provide: UserLocationsService, useValue: userLocationsServiceMock },
        { provide: VacationsService, useValue: vacationsServiceMock },
        { provide: LaborLegalParametersService, useValue: legalParametersServiceMock },
        { provide: OvertimeDetectionService, useValue: overtimeDetectionServiceMock },
        { provide: DailyCostCenterService, useValue: dailyCostCenterServiceMock },
        { provide: JornadaCutoffService, useValue: jornadaCutoffServiceMock },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
    jest.clearAllMocks();
    authServiceMock.issueKioskAuthTokens.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    userLocationsServiceMock.resolveAllowedLocationIds.mockResolvedValue(null);
    vacationsServiceMock.findApprovedDisfruteByDate.mockResolvedValue(null);
  });

  // ── kioskAuth ──────────────────────────────────────────────────────────────

  describe('kioskAuth', () => {
    const dto = { cedula: '12345678', pin: '1234' };

    it('retorna KioskAuthResult cuando cédula y PIN son correctos', async () => {
      const emp = makeEmployee('emp-kiosk-ok');
      repoMock.findUserByCedula.mockResolvedValue(makeUser());
      repoMock.findEmployeeByUserId.mockResolvedValue(emp);
      (bcryptCompare as jest.Mock).mockResolvedValue(true);

      const result = await service.kioskAuth(dto, TENANT);

      expect(result.userId).toBe('user-001');
      expect(result.employeeId).toBe('emp-kiosk-ok');
      expect(result.locationId).toBe(LOCATION_ID);
      expect(typeof result.fullName).toBe('string');
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(authServiceMock.issueKioskAuthTokens).toHaveBeenCalledWith(
        'user-001',
        TENANT,
        LOCATION_ID,
      );
    });

    it('lanza UnauthorizedException cuando el PIN es incorrecto', async () => {
      const emp = makeEmployee('emp-kiosk-bad-pin');
      repoMock.findUserByCedula.mockResolvedValue(makeUser());
      repoMock.findEmployeeByUserId.mockResolvedValue(emp);
      (bcryptCompare as jest.Mock).mockResolvedValue(false);

      await expect(service.kioskAuth(dto, TENANT)).rejects.toThrow(UnauthorizedException);
    });

    it('lanza UnprocessableEntityException cuando el empleado no tiene pinHash', async () => {
      const emp = makeEmployee('emp-kiosk-no-pin', { pinHash: null });
      repoMock.findUserByCedula.mockResolvedValue(makeUser());
      repoMock.findEmployeeByUserId.mockResolvedValue(emp);

      await expect(service.kioskAuth(dto, TENANT)).rejects.toThrow(UnprocessableEntityException);
      expect(bcryptCompare).not.toHaveBeenCalled();
    });

    it('lanza NotFoundException cuando el usuario no tiene empleado', async () => {
      repoMock.findUserByCedula.mockResolvedValue(makeUser());
      repoMock.findEmployeeByUserId.mockResolvedValue(null);

      await expect(service.kioskAuth(dto, TENANT)).rejects.toThrow(NotFoundException);
    });

    it('lanza UnauthorizedException cuando el usuario no existe', async () => {
      repoMock.findUserByCedula.mockResolvedValue(null);

      await expect(service.kioskAuth(dto, TENANT)).rejects.toThrow(UnauthorizedException);
    });

    it('bloquea la cuenta tras 3 intentos fallidos (ForbiddenException en intento 4)', async () => {
      // Uses unique empId so the module-level lockout Map doesn't interfere with other tests
      const emp = makeEmployee('emp-lockout-seq');
      repoMock.findUserByCedula.mockResolvedValue(makeUser());
      repoMock.findEmployeeByUserId.mockResolvedValue(emp);
      (bcryptCompare as jest.Mock).mockResolvedValue(false);

      // Attempts 1-3 → UnauthorizedException, increments lockout counter each time
      await expect(service.kioskAuth(dto, TENANT)).rejects.toThrow(UnauthorizedException);
      await expect(service.kioskAuth(dto, TENANT)).rejects.toThrow(UnauthorizedException);
      await expect(service.kioskAuth(dto, TENANT)).rejects.toThrow(UnauthorizedException);

      // Attempt 4 → ForbiddenException (account locked)
      await expect(service.kioskAuth(dto, TENANT)).rejects.toThrow(ForbiddenException);
    });
  });

  // ── registerEntry ─────────────────────────────────────────────────────────

  describe('registerEntry', () => {
    const dto = { userId: 'user-001', locationId: LOCATION_ID };

    it('lanza ConflictException cuando ya existe una ENTRY activa sin EXIT', async () => {
      const emp = makeEmployee('emp-entry-conflict');
      const openEntry = makeAttendanceLog('log-open', AttendanceEventType.ENTRY, new Date());

      repoMock.findEmployeeByUserAndLocation.mockResolvedValue(emp);
      repoMock.findOpenEntry.mockResolvedValue(openEntry);

      await expect(service.registerEntry(dto, TENANT)).rejects.toThrow(ConflictException);
      expect(repoMock.create).not.toHaveBeenCalled();
    });

    it('lanza NotFoundException cuando el empleado no pertenece a la sede', async () => {
      repoMock.findEmployeeByUserAndLocation.mockResolvedValue(null);

      await expect(service.registerEntry(dto, TENANT)).rejects.toThrow(NotFoundException);
      expect(repoMock.create).not.toHaveBeenCalled();
    });

    it('crea AttendanceLog ENTRY cuando no hay entrada activa previa', async () => {
      const emp = makeEmployee('emp-entry-ok');
      const createdLog = makeAttendanceLog('log-new-entry', AttendanceEventType.ENTRY, new Date());

      repoMock.findEmployeeByUserAndLocation.mockResolvedValue(emp);
      repoMock.findOpenEntry.mockResolvedValue(null);
      repoMock.create.mockResolvedValue(createdLog);

      const result = await service.registerEntry(dto, TENANT);

      expect(repoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: TENANT,
          employeeId: emp.id,
          locationId: LOCATION_ID,
          eventType: AttendanceEventType.ENTRY,
        }),
      );
      expect(result.logId).toBe('log-new-entry');
      expect(result.employeeId).toBe(emp.id);
      expect(result.userId).toBe(dto.userId);
    });

    it('rechaza marcación cuando el empleado tiene vacaciones aprobadas (D6)', async () => {
      const emp = makeEmployee('emp-vacation');
      repoMock.findEmployeeByUserAndLocation.mockResolvedValue(emp);
      repoMock.findOpenEntry.mockResolvedValue(null);
      vacationsServiceMock.findApprovedDisfruteByDate.mockResolvedValue({
        employeeId: emp.id,
        startDate: WORK_DATE,
        endDate: WORK_DATE,
        type: 'DISFRUTE',
      });

      await expect(service.registerEntry(dto, TENANT)).rejects.toThrow(
        VACATION_MARKING_BLOCKED_MESSAGE,
      );
      expect(repoMock.create).not.toHaveBeenCalled();
    });
  });

  // ── registerExit ──────────────────────────────────────────────────────────

  describe('registerExit', () => {
    const dto = { userId: 'user-001', locationId: LOCATION_ID };

    it('lanza NotFoundException cuando el empleado no pertenece a la sede', async () => {
      repoMock.findEmployeeByUserAndLocation.mockResolvedValue(null);

      await expect(service.registerExit(dto, TENANT)).rejects.toThrow(NotFoundException);
      expect(repoMock.create).not.toHaveBeenCalled();
    });

    it('lanza BadRequestException cuando no hay ENTRY activa', async () => {
      const emp = makeEmployee('emp-exit-no-entry');

      repoMock.findEmployeeByUserAndLocation.mockResolvedValue(emp);
      repoMock.findOpenEntry.mockResolvedValue(null);

      await expect(service.registerExit(dto, TENANT)).rejects.toThrow(BadRequestException);
      expect(repoMock.create).not.toHaveBeenCalled();
    });

    it('calcula totalMinutes y overtimeMinutes correctamente (jornada de 2h → 0 overtime)', async () => {
      const emp = makeEmployee('emp-exit-ok');
      const entryTs = new Date('2026-06-10T13:00:00.000Z'); // 08:00 Bogotá
      const exitTs = new Date('2026-06-10T15:00:00.000Z'); // 10:00 Bogotá — 2h

      const openEntry = makeAttendanceLog('log-entry', AttendanceEventType.ENTRY, entryTs);
      const exitLog = makeAttendanceLog('log-exit', AttendanceEventType.EXIT, exitTs);

      repoMock.findEmployeeByUserAndLocation.mockResolvedValue(emp);
      repoMock.findOpenEntry.mockResolvedValue(openEntry);
      repoMock.create.mockResolvedValue(exitLog);
      repoMock.findAllForDay.mockResolvedValue([openEntry, exitLog]);

      const result = await service.registerExit(dto, TENANT);

      expect(result.logId).toBe('log-exit');
      expect(result.totalMinutes).toBe(120);
      expect(result.overtimeMinutes).toBe(0);
      expect(result.isNocturno).toBe(false);
    });

    it('jornada exacta de 8h: overtimeMinutes = 0', async () => {
      const emp = makeEmployee('emp-exit-8h');
      const entryTs = new Date('2026-06-10T13:00:00.000Z'); // 08:00 Bogotá
      const exitTs = new Date('2026-06-10T21:00:00.000Z'); // 16:00 Bogotá — exactamente 8h

      const openEntry = makeAttendanceLog('log-entry-8h', AttendanceEventType.ENTRY, entryTs);
      const exitLog = makeAttendanceLog('log-exit-8h', AttendanceEventType.EXIT, exitTs);

      repoMock.findEmployeeByUserAndLocation.mockResolvedValue(emp);
      repoMock.findOpenEntry.mockResolvedValue(openEntry);
      repoMock.create.mockResolvedValue(exitLog);
      repoMock.findAllForDay.mockResolvedValue([openEntry, exitLog]);

      const result = await service.registerExit(dto, TENANT);

      expect(result.totalMinutes).toBe(480);
      expect(result.overtimeMinutes).toBe(0); // 480 - 480 = 0
    });

    it('registerExit kiosk no dispara detección HE (solo EXIT OVERTIME)', async () => {
      const emp = makeEmployee('emp-exit-no-detect');
      const entryTs = new Date('2026-06-10T13:00:00.000Z');
      const exitTs = new Date('2026-06-10T23:30:00.000Z');
      const openEntry = makeAttendanceLog('log-entry', AttendanceEventType.ENTRY, entryTs);
      const exitLog = makeAttendanceLog('log-exit', AttendanceEventType.EXIT, exitTs);

      repoMock.findEmployeeByUserAndLocation.mockResolvedValue(emp);
      repoMock.findOpenEntry.mockResolvedValue(openEntry);
      repoMock.create.mockResolvedValue(exitLog);
      repoMock.findAllForDay.mockResolvedValue([openEntry, exitLog]);
      overtimeDetectionServiceMock.onExitRegistered.mockClear();

      await service.registerExit({ userId: 'user-001', locationId: LOCATION_ID }, TENANT);

      expect(overtimeDetectionServiceMock.onExitRegistered).not.toHaveBeenCalled();
    });

    it('detecta overtime cuando la jornada supera las 8 horas (10.5h → 150 overtime)', async () => {
      const emp = makeEmployee('emp-exit-overtime');
      const entryTs = new Date('2026-06-10T13:00:00.000Z'); // 08:00 Bogotá
      const exitTs = new Date('2026-06-10T23:30:00.000Z'); // 18:30 Bogotá — 10.5h

      const openEntry = makeAttendanceLog('log-entry-ot', AttendanceEventType.ENTRY, entryTs);
      const exitLog = makeAttendanceLog('log-exit-ot', AttendanceEventType.EXIT, exitTs);

      repoMock.findEmployeeByUserAndLocation.mockResolvedValue(emp);
      repoMock.findOpenEntry.mockResolvedValue(openEntry);
      repoMock.create.mockResolvedValue(exitLog);
      repoMock.findAllForDay.mockResolvedValue([openEntry, exitLog]);

      const result = await service.registerExit(dto, TENANT);

      // 10.5h = 630 min; overtime = 630 - 480 = 150
      expect(result.totalMinutes).toBe(630);
      expect(result.overtimeMinutes).toBe(150);
    });

    it('calcula correctamente múltiples pares (turno mañana + tarde con almuerzo)', async () => {
      const emp = makeEmployee('emp-exit-lunch');
      // Turno mañana: 08:00–12:00 Bogotá (13:00–17:00 UTC) = 4h
      // Turno tarde: 13:00–17:00 Bogotá (18:00–22:00 UTC) = 4h
      // Total: 8h → 0 overtime
      const entry1Ts = new Date('2026-06-10T13:00:00.000Z');
      const exit1Ts = new Date('2026-06-10T17:00:00.000Z');
      const entry2Ts = new Date('2026-06-10T18:00:00.000Z');
      const exit2Ts = new Date('2026-06-10T22:00:00.000Z');

      const entry1 = makeAttendanceLog('log-e1', AttendanceEventType.ENTRY, entry1Ts);
      const exit1 = makeAttendanceLog('log-x1', AttendanceEventType.EXIT, exit1Ts);
      const entry2 = makeAttendanceLog('log-e2', AttendanceEventType.ENTRY, entry2Ts);
      const exit2 = makeAttendanceLog('log-x2', AttendanceEventType.EXIT, exit2Ts);

      // findOpenEntry returns the last ENTRY (entry2 is not yet closed, but we're processing the exit)
      const openEntry = makeAttendanceLog('log-e2', AttendanceEventType.ENTRY, entry2Ts);
      const exitLog = makeAttendanceLog('log-x2', AttendanceEventType.EXIT, exit2Ts);

      repoMock.findEmployeeByUserAndLocation.mockResolvedValue(emp);
      repoMock.findOpenEntry.mockResolvedValue(openEntry);
      repoMock.create.mockResolvedValue(exitLog);
      // findAllForDay returns all 4 logs in chronological order
      repoMock.findAllForDay.mockResolvedValue([entry1, exit1, entry2, exit2]);

      const result = await service.registerExit(dto, TENANT);

      expect(result.totalMinutes).toBe(480); // 4h + 4h
      expect(result.overtimeMinutes).toBe(0);
    });

    it('detecta recargo nocturno cuando entry o exit ocurre a las ≥21h Bogotá', async () => {
      const emp = makeEmployee('emp-exit-nocturno');
      // 02:00 UTC = 21:00 Bogotá → entryHour = 21 ≥ 21 → isNocturno = true
      const entryTs = new Date('2026-06-11T02:00:00.000Z');
      const exitTs = new Date('2026-06-11T04:00:00.000Z'); // 23:00 Bogotá — 2h nocturnas

      const openEntry = makeAttendanceLog('log-entry-noc', AttendanceEventType.ENTRY, entryTs);
      const exitLog = makeAttendanceLog('log-exit-noc', AttendanceEventType.EXIT, exitTs);

      repoMock.findEmployeeByUserAndLocation.mockResolvedValue(emp);
      repoMock.findOpenEntry.mockResolvedValue(openEntry);
      repoMock.create.mockResolvedValue(exitLog);
      repoMock.findAllForDay.mockResolvedValue([openEntry, exitLog]);

      const result = await service.registerExit(dto, TENANT);

      expect(result.isNocturno).toBe(true);
    });

    it.todo('festivo: recargo 75% sobre horas trabajadas en día festivo — pendiente NOM-04');
  });

  // ── registerEvent (ASIS-UNI) ─────────────────────────────────────────────

  describe('registerEvent', () => {
    const baseInput = {
      tenantId: TENANT,
      employeeId: 'emp-001',
      locationId: LOCATION_ID,
      eventType: AttendanceEventType.ENTRY,
      timestamp: new Date('2026-06-10T13:00:00.000Z'),
    };

    beforeEach(() => {
      repoMock.findDuplicateEvent.mockResolvedValue(null);
      repoMock.findOpenEntry.mockResolvedValue(null);
      repoMock.findOpenEntryByScope.mockResolvedValue(null);
      repoMock.findLocationById.mockResolvedValue({
        id: LOCATION_ID,
        geoLatitude: 4.6097,
        geoLongitude: -74.0817,
        checkInRadiusMeters: 100,
      });
      mobileRepoMock.create.mockReset();
      jornadaCutoffServiceMock.isBeforeCutoff.mockResolvedValue(true);
      overtimeDetectionServiceMock.onExitRegistered.mockClear();
    });

    it('lanza ConflictException si hay marcación duplicada en la misma ventana y source', async () => {
      repoMock.findDuplicateEvent.mockResolvedValue(
        makeAttendanceLog('dup', AttendanceEventType.ENTRY, new Date()),
      );

      await expect(
        service.registerEvent({
          ...baseInput,
          source: AttendanceLogSource.APP_MOVIL,
          clientLatitude: 4.6097,
          clientLongitude: -74.0817,
        }),
      ).rejects.toThrow(ConflictException);

      expect(repoMock.createEventLog).not.toHaveBeenCalled();
      expect(mobileRepoMock.create).not.toHaveBeenCalled();
    });

    it('rechaza marcación móvil cuando el empleado tiene vacaciones aprobadas (D6)', async () => {
      vacationsServiceMock.findApprovedDisfruteByDate.mockResolvedValue({
        employeeId: 'emp-001',
        startDate: WORK_DATE,
        endDate: WORK_DATE,
        type: 'DISFRUTE',
      });

      await expect(
        service.registerEvent({
          ...baseInput,
          source: AttendanceLogSource.APP_MOVIL,
          clientLatitude: 4.6097,
          clientLongitude: -74.0817,
        }),
      ).rejects.toThrow(VACATION_MARKING_BLOCKED_MESSAGE);

      expect(mobileRepoMock.create).not.toHaveBeenCalled();
    });

    it('permite APP_MOVIL y MANUAL el mismo día sin conflicto de duplicado', async () => {
      repoMock.createEventLog.mockResolvedValue(
        makeAttendanceLog('log-manual', AttendanceEventType.ENTRY, new Date()),
      );

      await service.registerEvent({
        ...baseInput,
        source: AttendanceLogSource.MANUAL,
        workDate: WORK_DATE,
        createdByUserId: 'actor-1',
        manualReason: 'FORGOT',
      });

      expect(repoMock.findDuplicateEvent).toHaveBeenCalledWith(
        expect.objectContaining({ source: AttendanceLogSource.MANUAL }),
      );
      expect(repoMock.createEventLog).toHaveBeenCalled();
    });

    it('CONN-06: dispara resolveFromAttendance con tenantId/employeeId/locationId/workDate', async () => {
      const createdLog = makeAttendanceLog('log-manual-2', AttendanceEventType.ENTRY, new Date());
      repoMock.createEventLog.mockResolvedValue(createdLog);

      await service.registerEvent({
        ...baseInput,
        source: AttendanceLogSource.MANUAL,
        workDate: WORK_DATE,
        createdByUserId: 'actor-1',
        manualReason: 'FORGOT',
      });

      expect(dailyCostCenterServiceMock.resolveFromAttendance).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: TENANT,
          employeeId: 'emp-001',
          locationId: LOCATION_ID,
          eventDate: createdLog.workDate,
        }),
      );
    });

    it('aplica geocerca solo para source=APP_MOVIL', async () => {
      mobileRepoMock.create.mockResolvedValue(
        makeAttendanceLog('log-app', AttendanceEventType.ENTRY, new Date()),
      );

      await service.registerEvent({
        ...baseInput,
        source: AttendanceLogSource.APP_MOVIL,
        clientLatitude: 4.7,
        clientLongitude: -74.0817,
      });

      expect(repoMock.findLocationById).toHaveBeenCalledWith(LOCATION_ID, TENANT);
      expect(mobileRepoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          source: AttendanceLogSource.APP_MOVIL,
          validationStatus: AttendanceValidationStatus.REJECTED,
          rejectionReason: 'OUTSIDE_RADIUS',
        }),
      );
      expect(repoMock.createEventLog).not.toHaveBeenCalled();
    });

    it('MANUAL no consulta geocerca ni persiste validationStatus', async () => {
      repoMock.createEventLog.mockResolvedValue(
        makeAttendanceLog('log-manual-geo', AttendanceEventType.ENTRY, new Date()),
      );

      await service.registerEvent({
        ...baseInput,
        source: AttendanceLogSource.MANUAL,
        workDate: WORK_DATE,
        createdByUserId: 'actor-1',
        manualReason: 'FORGOT',
        clientLatitude: 4.7,
        clientLongitude: -74.0817,
      });

      expect(repoMock.findLocationById).not.toHaveBeenCalled();
      expect(repoMock.createEventLog).toHaveBeenCalledWith(
        expect.objectContaining({
          source: AttendanceLogSource.MANUAL,
          validationStatus: null,
        }),
      );
    });

    it('MANUAL rechaza marcación fuera de la ventana del turno asignado', async () => {
      shiftResolutionMock.resolveForDay.mockResolvedValueOnce({
        kind: 'ASSIGNED',
        source: 'EMPLOYEE_ASSIGNMENT',
        targetMinutes: 480,
        turno: {
          id: 'turno-1',
          nombre: 'Mañana',
          sigla: 'TM',
          horaInicio: '08:00',
          horaFin: '16:00',
          jornada: 'DIURNO',
          locationId: LOCATION_ID,
          daysOfWeek: [1, 2, 3, 4, 5],
          estado: true,
        },
      });

      await expect(
        service.registerEvent({
          ...baseInput,
          source: AttendanceLogSource.MANUAL,
          workDate: WORK_DATE,
          timestamp: new Date('2026-06-10T23:00:00.000Z'),
          createdByUserId: 'actor-1',
          manualReason: 'FORGOT',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(repoMock.createEventLog).not.toHaveBeenCalled();
    });

    it('APP_MOVIL EXIT hereda workDate del ENTRY abierto (turno nocturno)', async () => {
      const openEntry = makeAttendanceLog(
        'log-open',
        AttendanceEventType.ENTRY,
        new Date('2026-06-10T13:00:00.000Z'),
      );
      repoMock.findOpenEntryByScope.mockResolvedValue(openEntry);
      mobileRepoMock.create.mockResolvedValue(
        makeAttendanceLog(
          'log-exit',
          AttendanceEventType.EXIT,
          new Date('2026-06-11T02:00:00.000Z'),
          WORK_DATE,
        ),
      );

      await service.registerEvent({
        ...baseInput,
        eventType: AttendanceEventType.EXIT,
        timestamp: new Date('2026-06-11T02:00:00.000Z'),
        source: AttendanceLogSource.APP_MOVIL,
        clientLatitude: 4.6097,
        clientLongitude: -74.0817,
      });

      expect(mobileRepoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ workDate: openEntry.workDate, shift: openEntry.shift }),
      );
      expect(overtimeDetectionServiceMock.onExitRegistered).not.toHaveBeenCalled();
      expect(repoMock.createEventLog).not.toHaveBeenCalled();
    });

    it('rechaza ENTRY ordinaria post-corte', async () => {
      jornadaCutoffServiceMock.isBeforeCutoff.mockResolvedValue(false);

      await expect(
        service.registerEvent({
          ...baseInput,
          source: AttendanceLogSource.APP_MOVIL,
          clientLatitude: 4.6097,
          clientLongitude: -74.0817,
        }),
      ).rejects.toThrow(ConflictException);

      expect(mobileRepoMock.create).not.toHaveBeenCalled();
    });

    it('rechaza ENTRY OVERTIME pre-corte', async () => {
      jornadaCutoffServiceMock.isBeforeCutoff.mockResolvedValue(true);

      await expect(
        service.registerEvent({
          ...baseInput,
          source: AttendanceLogSource.APP_MOVIL,
          markingScope: AttendanceMarkingScope.OVERTIME,
          clientLatitude: 4.6097,
          clientLongitude: -74.0817,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('persiste par OVERTIME ENTRY→EXIT post-corte y dispara detección HE', async () => {
      jornadaCutoffServiceMock.isBeforeCutoff.mockResolvedValue(false);
      const openOvertimeEntry = {
        ...makeAttendanceLog('log-ot-entry', AttendanceEventType.ENTRY, new Date()),
        markingScope: AttendanceMarkingScope.OVERTIME,
      };
      repoMock.findOpenEntryByScope
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(openOvertimeEntry);
      mobileRepoMock.create
        .mockResolvedValueOnce({
          ...openOvertimeEntry,
          id: 'log-ot-entry',
        })
        .mockResolvedValueOnce({
          ...makeAttendanceLog(
            'log-ot-exit',
            AttendanceEventType.EXIT,
            new Date('2026-06-10T18:00:00.000Z'),
          ),
          markingScope: AttendanceMarkingScope.OVERTIME,
        });

      await service.registerEvent({
        ...baseInput,
        source: AttendanceLogSource.APP_MOVIL,
        markingScope: AttendanceMarkingScope.OVERTIME,
        clientLatitude: 4.6097,
        clientLongitude: -74.0817,
      });

      await service.registerEvent({
        ...baseInput,
        eventType: AttendanceEventType.EXIT,
        timestamp: new Date('2026-06-10T18:00:00.000Z'),
        source: AttendanceLogSource.APP_MOVIL,
        markingScope: AttendanceMarkingScope.OVERTIME,
        clientLatitude: 4.6097,
        clientLongitude: -74.0817,
      });

      expect(mobileRepoMock.create).toHaveBeenCalledTimes(2);
      expect(overtimeDetectionServiceMock.onExitRegistered).toHaveBeenCalledTimes(1);
    });
  });

  // ── listHistory ───────────────────────────────────────────────────────────

  describe('listHistory', () => {
    it('delega al repositorio sin filtro de empleado cuando no se provee userId', async () => {
      repoMock.listHistory.mockResolvedValue([]);

      const result = await service.listHistory({}, TENANT, ACTOR);

      expect(repoMock.findEmployeeByUserId).not.toHaveBeenCalled();
      expect(repoMock.listHistory).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: TENANT, employeeId: undefined }),
      );
      expect(result).toEqual([]);
    });

    it('resuelve employeeId desde userId cuando se provee userId', async () => {
      const emp = makeEmployee('emp-hist-001');
      repoMock.findEmployeeByUserId.mockResolvedValue(emp);
      repoMock.listHistory.mockResolvedValue([]);

      await service.listHistory({ userId: 'user-001' }, TENANT, ACTOR);

      expect(repoMock.findEmployeeByUserId).toHaveBeenCalledWith('user-001', TENANT);
      expect(repoMock.listHistory).toHaveBeenCalledWith(
        expect.objectContaining({ employeeId: emp.id }),
      );
    });

    it('lanza NotFoundException cuando userId no corresponde a ningún empleado', async () => {
      repoMock.findEmployeeByUserId.mockResolvedValue(null);

      await expect(service.listHistory({ userId: 'user-ghost' }, TENANT, ACTOR)).rejects.toThrow(
        NotFoundException,
      );
      expect(repoMock.listHistory).not.toHaveBeenCalled();
    });
  });

  // ── listActive ────────────────────────────────────────────────────────────

  describe('listActive', () => {
    it('retorna empleados activos mapeados desde listActiveAtLocation', async () => {
      const ts = new Date('2026-06-10T13:00:00.000Z');
      const logFull = makeAttendanceLogFull(
        'log-active-1',
        'emp-active-1',
        AttendanceEventType.ENTRY,
        ts,
      );

      repoMock.listActiveAtLocation.mockResolvedValue([logFull]);

      const result = await service.listActive(LOCATION_ID, TENANT, ACTOR);

      expect(result).toHaveLength(1);
      expect(result[0].logId).toBe('log-active-1');
      expect(result[0].locationId).toBe(LOCATION_ID);
      expect(result[0].entryTimestamp).toBe(ts);
      expect(repoMock.listActiveAtLocation).toHaveBeenCalledWith(LOCATION_ID, TENANT);
    });

    it('retorna array vacío cuando no hay empleados activos', async () => {
      repoMock.listActiveAtLocation.mockResolvedValue([]);

      const result = await service.listActive(LOCATION_ID, TENANT, ACTOR);

      expect(result).toEqual([]);
    });
  });

  // ── getOvertimeSummary ────────────────────────────────────────────────────

  describe('getOvertimeSummary', () => {
    const USER_ID = 'user-001';

    it('lanza NotFoundException cuando el empleado no existe', async () => {
      repoMock.findEmployeeByUserId.mockResolvedValue(null);

      await expect(service.getOvertimeSummary(USER_ID, TENANT, ACTOR)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('devuelve resumen con pares y overtimeMinutes para jornada completada', async () => {
      const emp = makeEmployee('emp-ot-summary');
      const entryTs = new Date('2026-06-10T08:00:00.000Z');
      const exitTs = new Date('2026-06-10T16:00:00.000Z');
      const entryLog = makeAttendanceLog('log-s-e', AttendanceEventType.ENTRY, entryTs);
      const exitLog = makeAttendanceLog('log-s-x', AttendanceEventType.EXIT, exitTs);

      shiftResolutionMock.resolveForDay.mockResolvedValue({
        kind: 'ASSIGNED',
        source: 'EMPLOYEE_ASSIGNMENT',
        targetMinutes: 480,
        turno: {
          id: 'turno-1',
          nombre: 'Mañana',
          horaInicio: '08:00',
          horaFin: '16:00',
          locationId: LOCATION_ID,
          daysOfWeek: [1, 2, 3, 4, 5],
        },
      });

      repoMock.findEmployeeByUserId.mockResolvedValue(emp);
      repoMock.findAllForDay.mockResolvedValue([entryLog, exitLog]);

      const result = await service.getOvertimeSummary(
        USER_ID,
        TENANT,
        ACTOR,
        new Date('2026-06-10T20:00:00.000Z'),
      );

      expect(result.employeeId).toBe('emp-ot-summary');
      expect(result.userId).toBe(USER_ID);
      expect(result.workDate).toBe('2026-06-10');
      expect(result.totalMinutes).toBe(480);
      expect(result.overtimeMinutes).toBe(0);
      expect(result.pairs).toHaveLength(1);
    });

    it('CONN-11: salida tardía ordinaria no genera overtime sin remarcación OVERTIME', async () => {
      const emp = makeEmployee('emp-ot-late');
      const entryTs = new Date('2026-06-10T08:00:00.000Z');
      const exitTs = new Date('2026-06-10T17:45:00.000Z');
      const entryLog = makeAttendanceLog('log-late-e', AttendanceEventType.ENTRY, entryTs);
      const exitLog = makeAttendanceLog('log-late-x', AttendanceEventType.EXIT, exitTs);

      shiftResolutionMock.resolveForDay.mockResolvedValue({
        kind: 'ASSIGNED',
        source: 'EMPLOYEE_ASSIGNMENT',
        targetMinutes: 540,
        turno: {
          id: 'turno-1',
          nombre: 'Admin',
          horaInicio: '08:00',
          horaFin: '17:00',
          locationId: LOCATION_ID,
          daysOfWeek: [1, 2, 3, 4, 5],
        },
      });

      repoMock.findEmployeeByUserId.mockResolvedValue(emp);
      repoMock.findAllForDay.mockResolvedValue([entryLog, exitLog]);

      const result = await service.getOvertimeSummary(
        USER_ID,
        TENANT,
        ACTOR,
        new Date('2026-06-10T20:00:00.000Z'),
      );

      expect(result.totalMinutes).toBe(540);
      expect(result.overtimeMinutes).toBe(0);
    });

    it('open shift: par sin exitTimestamp cuando no hay EXIT registrado', async () => {
      const emp = makeEmployee('emp-ot-open');
      const entryTs = new Date('2026-06-10T13:00:00.000Z');
      const entryLog = makeAttendanceLog('log-open-e', AttendanceEventType.ENTRY, entryTs);

      repoMock.findEmployeeByUserId.mockResolvedValue(emp);
      repoMock.findAllForDay.mockResolvedValue([entryLog]);

      const result = await service.getOvertimeSummary(
        USER_ID,
        TENANT,
        ACTOR,
        new Date('2026-06-10T20:00:00.000Z'),
      );

      expect(result.pairs).toHaveLength(1);
      expect(result.pairs[0].exitTimestamp).toBeUndefined();
      expect(result.totalMinutes).toBeGreaterThanOrEqual(0);
    });
  });
});
