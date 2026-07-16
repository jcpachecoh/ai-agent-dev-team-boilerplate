import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceController } from '../controller/attendance.controller';
import { AttendanceService } from '../service/attendance.service';
import { AttendanceCardService } from '../service/attendance-card.service';
import { AttendanceMonitorSummaryService } from '../service/attendance-monitor-summary.service';
import { AttendanceControlPanelService } from '../service/attendance-control-panel.service';
import { AttendanceComparisonService } from '../service/attendance-comparison.service';
import { AttendanceCollaboratorsService } from '../service/attendance-collaborators.service';
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
import { AttendanceCardQueryDto } from '../controller/dto/attendance-card-query.dto';
import { UpsertAttendanceObservationDto } from '../controller/dto/upsert-attendance-observation.dto';
import { CreateManualMarkingDto } from '../controller/dto/create-manual-marking.dto';
import { MANUAL_MARKING_REASON_CATALOG } from '../manual-marking-reason.constants';
import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';

function makeJwtUser(overrides?: Partial<JwtPayload>): JwtPayload {
  return {
    sub: 'user-001',
    email: 'user@test.dev',
    tenantId: 'test-tenant',
    roleId: 'role-1',
    roleCode: 'OWNER',
    ...overrides,
  };
}

const serviceMock = {
  kioskAuth: jest.fn(),
  registerEntry: jest.fn(),
  registerExit: jest.fn(),
  listHistory: jest.fn(),
  listActive: jest.fn(),
  getOvertimeSummary: jest.fn(),
};

const cardServiceMock = {
  getCard: jest.fn(),
  upsertObservation: jest.fn(),
  createManualMarking: jest.fn(),
  deleteManualMarking: jest.fn(),
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

const collaboratorsServiceMock = {
  list: jest.fn(),
  listSupervisorOptions: jest.fn(),
  setPortalWorkerEnabled: jest.fn(),
  exportFile: jest.fn(),
  emailExport: jest.fn(),
  getAuditHistory: jest.fn(),
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
        { provide: AttendanceCardService, useValue: cardServiceMock },
        { provide: AttendanceMonitorSummaryService, useValue: monitorSummaryServiceMock },
        { provide: AttendanceControlPanelService, useValue: controlPanelServiceMock },
        { provide: AttendanceComparisonService, useValue: comparisonServiceMock },
        { provide: AttendanceCollaboratorsService, useValue: collaboratorsServiceMock },
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
      const user = makeJwtUser();
      serviceMock.listHistory.mockResolvedValue([]);

      await controller.listHistory(user, '', new ListAttendanceQueryDto());

      expect(serviceMock.listHistory).toHaveBeenCalledWith(expect.anything(), TENANT, {
        sub: user.sub,
        roleCode: user.roleCode,
      });
    });

    it('usa tenantId del header cuando no hay JWT', async () => {
      serviceMock.listHistory.mockResolvedValue([]);

      await controller.listHistory(
        null as unknown as JwtPayload,
        TENANT,
        new ListAttendanceQueryDto(),
      );

      expect(serviceMock.listHistory).toHaveBeenCalledWith(
        expect.anything(),
        TENANT,
        expect.anything(),
      );
    });

    it('lanza BadRequestException cuando no hay tenantId en JWT ni en header', () => {
      expect(() =>
        controller.listHistory(null as unknown as JwtPayload, '', new ListAttendanceQueryDto()),
      ).toThrow(BadRequestException);
    });
  });

  // ── listActive ────────────────────────────────────────────────────────────

  describe('listActive', () => {
    it('lanza BadRequestException cuando no se provee locationId', () => {
      const user = makeJwtUser();
      const query = new ActiveAttendanceQueryDto();
      // locationId not set → undefined

      expect(() => controller.listActive(user, '', query)).toThrow(BadRequestException);
      expect(serviceMock.listActive).not.toHaveBeenCalled();
    });

    it('delega al service cuando locationId está presente', async () => {
      const user = makeJwtUser();
      const query = Object.assign(new ActiveAttendanceQueryDto(), { locationId: 'loc-001' });
      serviceMock.listActive.mockResolvedValue([]);

      await controller.listActive(user, '', query);

      expect(serviceMock.listActive).toHaveBeenCalledWith('loc-001', TENANT, {
        sub: 'user-001',
        roleCode: 'OWNER',
      });
    });
  });

  describe('getMonitorSummary', () => {
    it('delega al monitor summary service', async () => {
      const user = makeJwtUser();
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
        { sub: 'user-001', roleCode: 'OWNER' },
      );
      expect(result).toEqual(summary);
    });
  });

  describe('getControlPanel', () => {
    it('delega al control panel service con el userId del JWT', async () => {
      const user = makeJwtUser({ sub: 'user-001' });
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
        { sub: 'user-001', roleCode: 'OWNER' },
      );
      expect(result).toEqual(summary);
    });

    it('lanza BadRequestException cuando no hay tenantId', () => {
      expect(() =>
        controller.getControlPanel(null as unknown as JwtPayload, '', new ControlPanelQueryDto()),
      ).toThrow(BadRequestException);
    });
  });

  describe('dismissControlPanelAlert', () => {
    it('delega al control panel service con tenantId, userId y alertKey', async () => {
      const user = makeJwtUser({ sub: 'user-001' });
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
      expect(() =>
        controller.dismissControlPanelAlert(null as unknown as JwtPayload, '', dto),
      ).toThrow(BadRequestException);
    });
  });

  describe('getControlPanelComparison', () => {
    it('delega al comparison service', async () => {
      const user = makeJwtUser();
      const query = Object.assign(new AttendanceComparisonQueryDto(), {
        anchorDate: '2026-07-01',
        period: 'week',
      });
      const summary = { period: 'week', points: [] };
      comparisonServiceMock.getComparison.mockResolvedValue(summary);

      const result = await controller.getControlPanelComparison(user, '', query);

      expect(comparisonServiceMock.getComparison).toHaveBeenCalledWith(TENANT, query, {
        sub: 'user-001',
        roleCode: 'OWNER',
      });
      expect(result).toEqual(summary);
    });

    it('usa tenantId del header cuando no hay JWT', async () => {
      const query = Object.assign(new AttendanceComparisonQueryDto(), {
        anchorDate: '2026-07-01',
      });
      comparisonServiceMock.getComparison.mockResolvedValue({ period: 'day', points: [] });

      await controller.getControlPanelComparison(null as unknown as JwtPayload, TENANT, query);

      expect(comparisonServiceMock.getComparison).toHaveBeenCalledWith(TENANT, query, {
        sub: '',
        roleCode: '',
      });
    });
  });

  // ── OS-551 — Tarjeta de Asistencia ───────────────────────────────────────

  describe('getAttendanceCard', () => {
    it('delega al AttendanceCardService con userId + tenantId + rango', async () => {
      const user = makeJwtUser();
      const query = Object.assign(new AttendanceCardQueryDto(), {
        dateFrom: '2026-06-01',
        dateTo: '2026-06-30',
      });
      cardServiceMock.getCard.mockResolvedValue({ logs: [], observations: [], daySummaries: [] });

      const result = await controller.getAttendanceCard(user, '', 'user-1', query);

      expect(cardServiceMock.getCard).toHaveBeenCalledWith(
        'user-1',
        TENANT,
        '2026-06-01',
        '2026-06-30',
        { sub: 'user-001', roleCode: 'OWNER', locationId: undefined },
        undefined,
      );
      expect(result).toEqual({ logs: [], observations: [], daySummaries: [] });
    });
  });

  describe('getObservations', () => {
    it('devuelve solo las observaciones de la tarjeta', async () => {
      const user = makeJwtUser();
      const query = Object.assign(new AttendanceCardQueryDto(), {
        dateFrom: '2026-06-01',
        dateTo: '2026-06-30',
      });
      cardServiceMock.getCard.mockResolvedValue({
        logs: [{ id: 'log-1' }],
        observations: [{ id: 'obs-1' }],
      });

      const result = await controller.getObservations(user, '', 'user-1', query);

      expect(result).toEqual([{ id: 'obs-1' }]);
    });
  });

  describe('upsertObservation', () => {
    it('delega al AttendanceCardService pasando el JwtPayload completo (para scoping de sede)', async () => {
      const user = makeJwtUser({ sub: 'actor-1', locationId: 'loc-1' });
      const dto = Object.assign(new UpsertAttendanceObservationDto(), {
        workDate: '2026-06-10',
        note: 'Llegó tarde',
      });
      cardServiceMock.upsertObservation.mockResolvedValue({ id: 'obs-1' });

      const result = await controller.upsertObservation(user, '', 'user-1', dto);

      expect(cardServiceMock.upsertObservation).toHaveBeenCalledWith('user-1', TENANT, user, dto);
      expect(result).toEqual({ id: 'obs-1' });
    });
  });

  describe('listManualMarkingReasons', () => {
    it('retorna el catálogo unificado CONN-05', () => {
      const result = controller.listManualMarkingReasons();

      expect(result).toEqual(MANUAL_MARKING_REASON_CATALOG);
      expect(result.some((option) => option.code === 'CORRECCION_MARCACION')).toBe(true);
      expect(result.some((option) => option.code === 'PERMISO_REMUNERADO')).toBe(true);
      expect(result.some((option) => option.code === 'INCAPACIDAD_COMUN')).toBe(true);
    });
  });

  describe('createManualMarking', () => {
    it('delega al AttendanceCardService pasando el JwtPayload completo (para scoping de sede)', async () => {
      const user = makeJwtUser({ sub: 'actor-1', roleCode: 'SUPERVISOR', locationId: 'loc-1' });
      const dto = Object.assign(new CreateManualMarkingDto(), {
        workDate: '2026-06-10',
        eventType: 'ENTRY',
        timestamp: '2026-06-10T08:00:00.000Z',
        reason: 'CORRECCION_MARCACION',
      });
      cardServiceMock.createManualMarking.mockResolvedValue({ id: 'log-manual-1' });

      const result = await controller.createManualMarking(user, '', 'user-1', dto);

      expect(cardServiceMock.createManualMarking).toHaveBeenCalledWith('user-1', TENANT, user, dto);
      expect(result).toEqual({ id: 'log-manual-1' });
    });
  });

  describe('deleteManualMarking', () => {
    it('delega al AttendanceCardService con id + tenantId + JwtPayload completo', async () => {
      const user = makeJwtUser({ sub: 'actor-1', locationId: 'loc-1' });
      cardServiceMock.deleteManualMarking.mockResolvedValue(undefined);

      await controller.deleteManualMarking(user, '', 'log-manual-1');

      expect(cardServiceMock.deleteManualMarking).toHaveBeenCalledWith(
        'log-manual-1',
        TENANT,
        user,
      );
    });
  });

  describe('getCollaborators', () => {
    it('delega al AttendanceCollaboratorsService con el actor resuelto del JWT y defaults de paginación', async () => {
      const user = makeJwtUser({ sub: 'actor-1', roleCode: 'SUPERVISOR' });
      collaboratorsServiceMock.list.mockResolvedValue({
        items: [],
        pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
      });

      const result = await controller.getCollaborators(user, '', {});

      expect(collaboratorsServiceMock.list).toHaveBeenCalledWith(
        TENANT,
        { userId: 'actor-1', roleCode: 'SUPERVISOR' },
        expect.objectContaining({ status: 'all', page: 1, pageSize: 20 }),
      );
      expect(result.pagination.total).toBe(0);
    });

    it('propaga los filtros de la query al service sin transformarlos', async () => {
      const user = makeJwtUser({ sub: 'actor-1' });
      collaboratorsServiceMock.list.mockResolvedValue({
        items: [],
        pagination: { page: 2, pageSize: 50, total: 0, totalPages: 1 },
      });

      await controller.getCollaborators(user, '', {
        search: 'josé',
        positionId: 'pos-1',
        supervisorUserId: 'sup-1',
        laborClassification: 'operaciones',
        status: 'active',
        page: 2,
        pageSize: 50,
      } as never);

      expect(collaboratorsServiceMock.list).toHaveBeenCalledWith(
        TENANT,
        { userId: 'actor-1', roleCode: 'OWNER' },
        expect.objectContaining({
          search: 'josé',
          positionId: 'pos-1',
          supervisorUserId: 'sup-1',
          laborClassification: 'operaciones',
          status: 'active',
          page: 2,
          pageSize: 50,
        }),
      );
    });
  });

  describe('getCollaboratorSupervisors', () => {
    it('delega al AttendanceCollaboratorsService con el actor resuelto del JWT', async () => {
      const user = makeJwtUser({ sub: 'actor-1', roleCode: 'MANAGER' });
      collaboratorsServiceMock.listSupervisorOptions.mockResolvedValue([
        { id: 'sup-1', name: 'Sup Uno', email: 'sup1@example.com' },
      ]);

      const result = await controller.getCollaboratorSupervisors(user, '');

      expect(collaboratorsServiceMock.listSupervisorOptions).toHaveBeenCalledWith(TENANT, {
        userId: 'actor-1',
        roleCode: 'MANAGER',
      });
      expect(result).toEqual([{ id: 'sup-1', name: 'Sup Uno', email: 'sup1@example.com' }]);
    });

    // Bug OS-550: la respuesta vacía es un caso válido (tenant sin SUPERVISOR/MANAGER
    // configurados) — el endpoint debe devolver 200 con `[]`, nunca un error.
    it('devuelve [] sin error cuando el service no encuentra supervisores', async () => {
      const user = makeJwtUser({ sub: 'actor-1', roleCode: 'OWNER' });
      collaboratorsServiceMock.listSupervisorOptions.mockResolvedValue([]);

      const result = await controller.getCollaboratorSupervisors(user, '');

      expect(result).toEqual([]);
    });
  });

  describe('setCollaboratorPortalWorker', () => {
    it('delega al service con tenantId/employeeDetailsId/enabled/actorUserId', async () => {
      const user = makeJwtUser({ sub: 'actor-1' });
      collaboratorsServiceMock.setPortalWorkerEnabled.mockResolvedValue({
        portalWorkerEnabled: true,
      });

      const result = await controller.setCollaboratorPortalWorker(user, '', 'emp-1', {
        enabled: true,
      } as never);

      expect(collaboratorsServiceMock.setPortalWorkerEnabled).toHaveBeenCalledWith(
        TENANT,
        'emp-1',
        true,
        'actor-1',
      );
      expect(result).toEqual({ portalWorkerEnabled: true });
    });
  });

  describe('exportCollaborators', () => {
    it('escribe Content-Type/Content-Disposition y envía el buffer', async () => {
      const user = makeJwtUser({ sub: 'actor-1' });
      collaboratorsServiceMock.exportFile.mockResolvedValue({
        buffer: Buffer.from('data'),
        filename: 'colaboradores_asistencia_2026-07-06.xlsx',
      });
      const res = { setHeader: jest.fn(), send: jest.fn() };

      await controller.exportCollaborators(user, '', { format: 'excel' } as never, res as never);

      expect(collaboratorsServiceMock.exportFile).toHaveBeenCalledWith(
        TENANT,
        { userId: 'actor-1', roleCode: 'OWNER' },
        expect.objectContaining({ status: 'all' }),
        'excel',
        'actor-1',
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="colaboradores_asistencia_2026-07-06.xlsx"',
      );
      expect(res.send).toHaveBeenCalledWith(Buffer.from('data'));
    });
  });

  describe('emailExportCollaborators', () => {
    it('delega al service con recipients/format/filters y el email del actor', async () => {
      const user = makeJwtUser({ sub: 'actor-1', email: 'owner@x.com' });
      collaboratorsServiceMock.emailExport.mockResolvedValue(undefined);

      const result = await controller.emailExportCollaborators(user, '', {
        recipients: ['a@example.com'],
        format: 'pdf',
        filters: { area: 'Cocina' },
      } as never);

      expect(collaboratorsServiceMock.emailExport).toHaveBeenCalledWith(
        TENANT,
        { userId: 'actor-1', roleCode: 'OWNER' },
        'owner@x.com',
        {
          recipients: ['a@example.com'],
          format: 'pdf',
          filters: expect.objectContaining({ area: 'Cocina', status: 'all' }),
        },
        'actor-1',
      );
      expect(result).toEqual({ sent: true });
    });
  });

  describe('getCollaboratorAudit', () => {
    it('delega al service y envuelve el resultado en { items }', async () => {
      const user = makeJwtUser({ sub: 'actor-1', roleCode: 'SUPER_ADMIN' });
      collaboratorsServiceMock.getAuditHistory.mockResolvedValue([
        {
          id: 'audit-1',
          action: 'UPDATE',
          actorName: 'owner@x.com',
          createdAt: new Date(),
          oldValue: null,
          newValue: null,
        },
      ]);

      const result = await controller.getCollaboratorAudit(user, '', 'emp-1');

      expect(collaboratorsServiceMock.getAuditHistory).toHaveBeenCalledWith(TENANT, 'emp-1');
      expect(result.items).toHaveLength(1);
    });
  });
});
