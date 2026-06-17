import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceController } from '../controller/attendance.controller';
import { AttendanceService } from '../service/attendance.service';
import { KioskAuthDto } from '../controller/dto/kiosk-auth.dto';
import { RegisterEntryDto, RegisterExitDto } from '../controller/dto/register-event.dto';
import {
  ListAttendanceQueryDto,
  ActiveAttendanceQueryDto,
} from '../controller/dto/list-attendance-query.dto';

const serviceMock = {
  kioskAuth: jest.fn(),
  registerEntry: jest.fn(),
  registerExit: jest.fn(),
  listHistory: jest.fn(),
  listActive: jest.fn(),
  getOvertimeSummary: jest.fn(),
};

const TENANT = 'test-tenant';

const kioskAuthResult = {
  userId: 'user-001',
  fullName: 'carlos',
  locationId: 'loc-001',
  employeeId: 'emp-001',
};

describe('AttendanceController', () => {
  let controller: AttendanceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendanceController],
      providers: [{ provide: AttendanceService, useValue: serviceMock }],
    }).compile();

    controller = module.get<AttendanceController>(AttendanceController);
    jest.clearAllMocks();
  });

  // ── kioskAuth ──────────────────────────────────────────────────────────────

  describe('kioskAuth', () => {
    const dto: KioskAuthDto = Object.assign(new KioskAuthDto(), {
      cedula: '12345678',
      pin: '1234',
      locationId: 'loc-001',
    });

    it('delega al service y retorna el resultado', async () => {
      serviceMock.kioskAuth.mockResolvedValue(kioskAuthResult);

      const result = await controller.kioskAuth(TENANT, dto);

      expect(serviceMock.kioskAuth).toHaveBeenCalledWith(dto, TENANT);
      expect(result).toEqual(kioskAuthResult);
    });

    it('lanza BadRequestException si falta el header x-tenant-id', () => {
      // requireTenantFromHeader throws synchronously before the async service call
      expect(() => controller.kioskAuth('', dto)).toThrow(BadRequestException);
      expect(() => controller.kioskAuth('   ', dto)).toThrow(BadRequestException);
      expect(serviceMock.kioskAuth).not.toHaveBeenCalled();
    });
  });

  // ── registerEntry ─────────────────────────────────────────────────────────

  describe('registerEntry', () => {
    const dto: RegisterEntryDto = Object.assign(new RegisterEntryDto(), {
      userId: 'user-001',
      locationId: 'loc-001',
    });

    it('delega al service con el tenantId del header', async () => {
      const entryResult = { logId: 'log-1', employeeId: 'emp-1', userId: 'user-001' };
      serviceMock.registerEntry.mockResolvedValue(entryResult);

      await controller.registerEntry(TENANT, dto);

      expect(serviceMock.registerEntry).toHaveBeenCalledWith(dto, TENANT);
    });

    it('lanza BadRequestException si falta el header x-tenant-id', () => {
      expect(() => controller.registerEntry('', dto)).toThrow(BadRequestException);
    });
  });

  // ── registerExit ──────────────────────────────────────────────────────────

  describe('registerExit', () => {
    const dto: RegisterExitDto = Object.assign(new RegisterExitDto(), {
      userId: 'user-001',
      locationId: 'loc-001',
    });

    it('delega al service con el tenantId del header', async () => {
      const exitResult = { logId: 'log-2', totalMinutes: 120 };
      serviceMock.registerExit.mockResolvedValue(exitResult);

      await controller.registerExit(TENANT, dto);

      expect(serviceMock.registerExit).toHaveBeenCalledWith(dto, TENANT);
    });
  });

  // ── listHistory ───────────────────────────────────────────────────────────

  describe('listHistory', () => {
    it('usa tenantId del JWT cuando está disponible', async () => {
      const user = { tenantId: TENANT };
      serviceMock.listHistory.mockResolvedValue([]);

      await controller.listHistory(user, '', new ListAttendanceQueryDto());

      expect(serviceMock.listHistory).toHaveBeenCalledWith(expect.anything(), TENANT);
    });

    it('usa tenantId del header cuando no hay JWT', async () => {
      serviceMock.listHistory.mockResolvedValue([]);

      await controller.listHistory(null, TENANT, new ListAttendanceQueryDto());

      expect(serviceMock.listHistory).toHaveBeenCalledWith(expect.anything(), TENANT);
    });

    it('lanza BadRequestException cuando no hay tenantId en JWT ni en header', () => {
      expect(() => controller.listHistory(null, '', new ListAttendanceQueryDto())).toThrow(
        BadRequestException,
      );
    });
  });

  // ── listActive ────────────────────────────────────────────────────────────

  describe('listActive', () => {
    it('lanza BadRequestException cuando no se provee locationId', () => {
      const user = { tenantId: TENANT };
      const query = new ActiveAttendanceQueryDto();
      // locationId not set → undefined

      expect(() => controller.listActive(user, '', query)).toThrow(BadRequestException);
      expect(serviceMock.listActive).not.toHaveBeenCalled();
    });

    it('delega al service cuando locationId está presente', async () => {
      const user = { tenantId: TENANT };
      const query = Object.assign(new ActiveAttendanceQueryDto(), { locationId: 'loc-001' });
      serviceMock.listActive.mockResolvedValue([]);

      await controller.listActive(user, '', query);

      expect(serviceMock.listActive).toHaveBeenCalledWith('loc-001', TENANT);
    });
  });
});
