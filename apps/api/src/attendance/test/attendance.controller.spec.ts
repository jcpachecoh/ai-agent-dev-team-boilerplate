import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceController } from '../controller/attendance.controller';
import { AttendanceService } from '../service/attendance.service';
import { AttendanceMonitorSummaryService } from '../service/attendance-monitor-summary.service';
import { AttendanceControlPanelService } from '../service/attendance-control-panel.service';
import { AttendanceComparisonService } from '../service/attendance-comparison.service';
import { KioskAuthDto } from '../controller/dto/kiosk-auth.dto';
import { RegisterEntryDto, RegisterExitDto } from '../controller/dto/register-event.dto';
import {
  ListAttendanceQueryDto,
  ActiveAttendanceQueryDto,
} from '../controller/dto/list-attendance-query.dto';
import { MonitorSummaryQueryDto } from '../controller/dto/monitor-summary-query.dto';
import { ControlPanelQueryDto } from '../controller/dto/control-panel-query.dto';
import { DismissAlertDto } from '../controller/dto/dismiss-alert.dto';
import { AttendanceComparisonQueryDto } from '../controller/dto/attendance-comparison-query.dto';

const serviceMock = {
  kioskAuth: jest.fn(),
  registerEntry: jest.fn(),
  registerExit: jest.fn(),
  listHistory: jest.fn(),
  listActive: jest.fn(),
  getOvertimeSummary: jest.fn(),
};

const monitorSummaryServiceMock = {
  getMonitorSummary: jest.fn(),
};

const controlPanelServiceMock = {
  getControlPanel: jest.fn(),
  dismissAlert: jest.fn(),
};

const comparisonServiceMock = {
  getComparison: jest.fn(),
};

const TENANT = 'test-tenant';

const kioskAuthResult = {
  userId: 'user-001',
  fullName: 'carlos',
  locationId: 'loc-001',
  employeeId: 'emp-001',
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
};

describe('AttendanceController', () => {
  let controller: AttendanceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendanceController],
      providers: [
        { provide: AttendanceService, useValue: serviceMock },
        { provide: AttendanceMonitorSummaryService, useValue: monitorSummaryServiceMock },
        { provide: AttendanceControlPanelService, useValue: controlPanelServiceMock },
        { provide: AttendanceComparisonService, useValue: comparisonServiceMock },
      ],
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

  describe('getMonitorSummary', () => {
    it('delega al monitor summary service', async () => {
      const user = { tenantId: TENANT };
      const query = Object.assign(new MonitorSummaryQueryDto(), {
        period: 'day',
        anchorDate: '2026-06-18',
      });
      const summary = { locationId: 'loc-001', metrics: { total: 1 } };
      monitorSummaryServiceMock.getMonitorSummary.mockResolvedValue(summary);

      const result = await controller.getMonitorSummary(user, '', 'loc-001', query);

      expect(monitorSummaryServiceMock.getMonitorSummary).toHaveBeenCalledWith(
        { locationId: 'loc-001', period: 'day', anchorDate: '2026-06-18' },
        TENANT,
      );
      expect(result).toEqual(summary);
    });
  });

  describe('getControlPanel', () => {
    it('delega al control panel service con el userId del JWT', async () => {
      const user = { tenantId: TENANT, sub: 'user-001' };
      const query = Object.assign(new ControlPanelQueryDto(), {
        anchorDate: '2026-07-01',
        period: 'day',
      });
      const summary = { metrics: { workingNow: 2 } };
      controlPanelServiceMock.getControlPanel.mockResolvedValue(summary);

      const result = await controller.getControlPanel(user, '', query);

      expect(controlPanelServiceMock.getControlPanel).toHaveBeenCalledWith(
        TENANT,
        'user-001',
        query,
      );
      expect(result).toEqual(summary);
    });

    it('lanza BadRequestException cuando no hay tenantId', () => {
      expect(() => controller.getControlPanel(null, '', new ControlPanelQueryDto())).toThrow(
        BadRequestException,
      );
    });
  });

  describe('dismissControlPanelAlert', () => {
    it('delega al control panel service con tenantId, userId y alertKey', async () => {
      const user = { tenantId: TENANT, sub: 'user-001' };
      const dto = Object.assign(new DismissAlertDto(), { alertKey: 'geo-log-1' });
      const dismissResult = { alertKey: 'geo-log-1', dismissedAt: '2026-07-02T10:00:00.000Z' };
      controlPanelServiceMock.dismissAlert.mockResolvedValue(dismissResult);

      const result = await controller.dismissControlPanelAlert(user, '', dto);

      expect(controlPanelServiceMock.dismissAlert).toHaveBeenCalledWith(
        TENANT,
        'user-001',
        'geo-log-1',
      );
      expect(result).toEqual(dismissResult);
    });

    it('lanza BadRequestException cuando no hay tenantId', () => {
      const dto = Object.assign(new DismissAlertDto(), { alertKey: 'geo-log-1' });
      expect(() => controller.dismissControlPanelAlert(null, '', dto)).toThrow(BadRequestException);
    });
  });

  describe('getControlPanelComparison', () => {
    it('delega al comparison service', async () => {
      const user = { tenantId: TENANT };
      const query = Object.assign(new AttendanceComparisonQueryDto(), {
        anchorDate: '2026-07-01',
        period: 'week',
      });
      const summary = { period: 'week', points: [] };
      comparisonServiceMock.getComparison.mockResolvedValue(summary);

      const result = await controller.getControlPanelComparison(user, '', query);

      expect(comparisonServiceMock.getComparison).toHaveBeenCalledWith(TENANT, query);
      expect(result).toEqual(summary);
    });

    it('usa tenantId del header cuando no hay JWT', async () => {
      const query = Object.assign(new AttendanceComparisonQueryDto(), {
        anchorDate: '2026-07-01',
      });
      comparisonServiceMock.getComparison.mockResolvedValue({ period: 'day', points: [] });

      await controller.getControlPanelComparison(null, TENANT, query);

      expect(comparisonServiceMock.getComparison).toHaveBeenCalledWith(TENANT, query);
    });
  });
});
