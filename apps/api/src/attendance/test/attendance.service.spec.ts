import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceEventType, AttendanceShift } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AttendanceService } from '../service/attendance.service';
import { AttendanceRepository } from '../repository/attendance.repository';

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
) {
  return {
    id,
    tenantId: TENANT,
    employeeId: 'emp-001',
    locationId: LOCATION_ID,
    eventType,
    shift: AttendanceShift.MORNING,
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
  findAllForDay: jest.fn(),
  create: jest.fn(),
  listHistory: jest.fn(),
  listActiveAtLocation: jest.fn(),
  findById: jest.fn(),
};

describe('AttendanceService', () => {
  let service: AttendanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AttendanceService, { provide: AttendanceRepository, useValue: repoMock }],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
    jest.clearAllMocks();
  });

  // ── kioskAuth ──────────────────────────────────────────────────────────────

  describe('kioskAuth', () => {
    const dto = { cedula: '12345678', pin: '1234', locationId: LOCATION_ID };

    it('retorna KioskAuthResult cuando cédula y PIN son correctos', async () => {
      const emp = makeEmployee('emp-kiosk-ok');
      repoMock.findUserByCedula.mockResolvedValue(makeUser());
      repoMock.findEmployeeByUserAndLocation.mockResolvedValue(emp);
      (bcryptCompare as jest.Mock).mockResolvedValue(true);

      const result = await service.kioskAuth(dto, TENANT);

      expect(result.userId).toBe('user-001');
      expect(result.employeeId).toBe('emp-kiosk-ok');
      expect(result.locationId).toBe(LOCATION_ID);
      expect(typeof result.fullName).toBe('string');
    });

    it('lanza UnauthorizedException cuando el PIN es incorrecto', async () => {
      const emp = makeEmployee('emp-kiosk-bad-pin');
      repoMock.findUserByCedula.mockResolvedValue(makeUser());
      repoMock.findEmployeeByUserAndLocation.mockResolvedValue(emp);
      (bcryptCompare as jest.Mock).mockResolvedValue(false);

      await expect(service.kioskAuth(dto, TENANT)).rejects.toThrow(UnauthorizedException);
    });

    it('lanza UnprocessableEntityException cuando el empleado no tiene pinHash', async () => {
      const emp = makeEmployee('emp-kiosk-no-pin', { pinHash: null });
      repoMock.findUserByCedula.mockResolvedValue(makeUser());
      repoMock.findEmployeeByUserAndLocation.mockResolvedValue(emp);

      await expect(service.kioskAuth(dto, TENANT)).rejects.toThrow(UnprocessableEntityException);
      expect(bcryptCompare).not.toHaveBeenCalled();
    });

    it('lanza ForbiddenException cuando el empleado no pertenece a la sede', async () => {
      repoMock.findUserByCedula.mockResolvedValue(makeUser());
      repoMock.findEmployeeByUserAndLocation.mockResolvedValue(null);

      await expect(service.kioskAuth(dto, TENANT)).rejects.toThrow(ForbiddenException);
    });

    it('lanza UnauthorizedException cuando el usuario no existe', async () => {
      repoMock.findUserByCedula.mockResolvedValue(null);

      await expect(service.kioskAuth(dto, TENANT)).rejects.toThrow(UnauthorizedException);
    });

    it('bloquea la cuenta tras 3 intentos fallidos (ForbiddenException en intento 4)', async () => {
      // Uses unique empId so the module-level lockout Map doesn't interfere with other tests
      const emp = makeEmployee('emp-lockout-seq');
      repoMock.findUserByCedula.mockResolvedValue(makeUser());
      repoMock.findEmployeeByUserAndLocation.mockResolvedValue(emp);
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

  // ── listHistory ───────────────────────────────────────────────────────────

  describe('listHistory', () => {
    it('delega al repositorio sin filtro de empleado cuando no se provee userId', async () => {
      repoMock.listHistory.mockResolvedValue([]);

      const result = await service.listHistory({}, TENANT);

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

      await service.listHistory({ userId: 'user-001' }, TENANT);

      expect(repoMock.findEmployeeByUserId).toHaveBeenCalledWith('user-001', TENANT);
      expect(repoMock.listHistory).toHaveBeenCalledWith(
        expect.objectContaining({ employeeId: emp.id }),
      );
    });

    it('lanza NotFoundException cuando userId no corresponde a ningún empleado', async () => {
      repoMock.findEmployeeByUserId.mockResolvedValue(null);

      await expect(service.listHistory({ userId: 'user-ghost' }, TENANT)).rejects.toThrow(
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

      const result = await service.listActive(LOCATION_ID, TENANT);

      expect(result).toHaveLength(1);
      expect(result[0].logId).toBe('log-active-1');
      expect(result[0].locationId).toBe(LOCATION_ID);
      expect(result[0].entryTimestamp).toBe(ts);
      expect(repoMock.listActiveAtLocation).toHaveBeenCalledWith(LOCATION_ID, TENANT);
    });

    it('retorna array vacío cuando no hay empleados activos', async () => {
      repoMock.listActiveAtLocation.mockResolvedValue([]);

      const result = await service.listActive(LOCATION_ID, TENANT);

      expect(result).toEqual([]);
    });
  });

  // ── getOvertimeSummary ────────────────────────────────────────────────────

  describe('getOvertimeSummary', () => {
    const USER_ID = 'user-001';

    it('lanza NotFoundException cuando el empleado no existe', async () => {
      repoMock.findEmployeeByUserId.mockResolvedValue(null);

      await expect(service.getOvertimeSummary(USER_ID, TENANT)).rejects.toThrow(NotFoundException);
    });

    it('devuelve resumen con pares y overtimeMinutes para jornada completada', async () => {
      const emp = makeEmployee('emp-ot-summary');
      const entryTs = new Date('2026-06-10T13:00:00.000Z'); // 08:00 Bogotá
      const exitTs = new Date('2026-06-10T21:00:00.000Z'); // 16:00 Bogotá — 8h exactas
      const entryLog = makeAttendanceLog('log-s-e', AttendanceEventType.ENTRY, entryTs);
      const exitLog = makeAttendanceLog('log-s-x', AttendanceEventType.EXIT, exitTs);

      repoMock.findEmployeeByUserId.mockResolvedValue(emp);
      repoMock.findAllForDay.mockResolvedValue([entryLog, exitLog]);

      const result = await service.getOvertimeSummary(
        USER_ID,
        TENANT,
        new Date('2026-06-10T20:00:00.000Z'),
      );

      expect(result.employeeId).toBe('emp-ot-summary');
      expect(result.userId).toBe(USER_ID);
      expect(result.workDate).toBe('2026-06-10');
      expect(result.totalMinutes).toBe(480);
      expect(result.overtimeMinutes).toBe(0);
      expect(result.pairs).toHaveLength(1);
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
        new Date('2026-06-10T20:00:00.000Z'),
      );

      expect(result.pairs).toHaveLength(1);
      expect(result.pairs[0].exitTimestamp).toBeUndefined();
      expect(result.totalMinutes).toBeGreaterThanOrEqual(0);
    });
  });
});
