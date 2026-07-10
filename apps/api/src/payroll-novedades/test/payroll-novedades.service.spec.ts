import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NovedadRequestSource, NovedadStatus, NovedadType } from '@prisma/client';

import { UserLocationsService } from '../../locations/service/user-locations.service';
import { StorageService } from '../../storage/service/storage.service';
import { PayrollNovedadesRepository } from '../repository/payroll-novedades.repository';
import { NovedadTypeConfigService } from '../service/novedad-type-config.service';
import { PayrollNovedadesNotificationService } from '../service/payroll-novedades-notification.service';
import { PayrollNovedadesService } from '../service/payroll-novedades.service';
import { NO_SUPERVISOR_ASSIGNED_WARNING } from '../service/payroll-novedades-notification.service';

const TENANT = 'tenant-1';
const EMPLOYEE_ID = 'emp-1';
const RRHH_USER = 'user-rrhh';
const SUPERVISOR_USER = 'user-supervisor';

function buildNovedad(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'nov-1',
    tenantId: TENANT,
    employeeId: EMPLOYEE_ID,
    type: NovedadType.PERMISO_REMUNERADO,
    startDate: new Date('2026-07-01T00:00:00.000Z'),
    endDate: new Date('2026-07-03T00:00:00.000Z'),
    isPaid: true,
    linkedLeaveId: null,
    supportStorageObjectId: null,
    notes: null,
    requestedBy: NovedadRequestSource.EMPLEADO,
    status: NovedadStatus.PENDIENTE_SUPERVISOR,
    supervisorApproverId: null,
    supervisorDecisionAt: null,
    supervisorComment: null,
    rrhhApproverId: null,
    rrhhDecisionAt: null,
    rejectionReason: null,
    overlapWarningAck: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

function buildTypeConfig(type: NovedadType, overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: `cfg-${type}`,
    tenantId: TENANT,
    type,
    requiresSupervisorApproval: true,
    requiresSupportDocument: false,
    isPaidDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('PayrollNovedadesService', () => {
  let service: PayrollNovedadesService;
  let repository: jest.Mocked<PayrollNovedadesRepository>;
  let typeConfigService: jest.Mocked<NovedadTypeConfigService>;
  let userLocationsService: jest.Mocked<UserLocationsService>;
  let storageService: jest.Mocked<Pick<StorageService, 'uploadFile' | 'getPresignedUrl'>>;
  let notificationService: jest.Mocked<
    Pick<
      PayrollNovedadesNotificationService,
      'notifySupervisorPending' | 'notifyEmployeeStatusChange' | 'notifyRrhhInbox'
    >
  >;

  beforeEach(async () => {
    repository = {
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      listSummaries: jest.fn(),
      findOverlapping: jest.fn(),
      findApprovedForPeriodByEmployeeIds: jest.fn(),
      findSubordinatePositionIds: jest.fn(),
      findEmployeeApprovalContext: jest.fn(),
      findActorUser: jest.fn(),
      findEmployeeIdByUserId: jest.fn(),
      findSupervisorCandidatesInLocation: jest.fn(),
      findEmployeeIdsInScope: jest.fn(),
    } as unknown as jest.Mocked<PayrollNovedadesRepository>;

    typeConfigService = {
      getConfigForTenant: jest.fn(),
      listConfigs: jest.fn(),
      updateConfig: jest.fn(),
      ensureDefaults: jest.fn(),
    } as unknown as jest.Mocked<NovedadTypeConfigService>;

    userLocationsService = {
      getActiveUserLocations: jest.fn(),
    } as unknown as jest.Mocked<UserLocationsService>;

    storageService = {
      uploadFile: jest.fn(),
      getPresignedUrl: jest.fn(),
    };

    notificationService = {
      notifySupervisorPending: jest.fn(),
      notifyEmployeeStatusChange: jest.fn(),
      notifyRrhhInbox: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayrollNovedadesService,
        { provide: PayrollNovedadesRepository, useValue: repository },
        { provide: NovedadTypeConfigService, useValue: typeConfigService },
        { provide: UserLocationsService, useValue: userLocationsService },
        { provide: StorageService, useValue: storageService },
        { provide: PayrollNovedadesNotificationService, useValue: notificationService },
      ],
    }).compile();

    service = module.get(PayrollNovedadesService);
  });

  describe('submit', () => {
    it('envía PERMISO_REMUNERADO a PENDIENTE_SUPERVISOR cuando hay supervisor', async () => {
      repository.findActorUser.mockImplementation(async (_tenant, userId) => {
        if (userId === SUPERVISOR_USER) {
          return { roleCode: 'SUPERVISOR', positionId: 'pos-boss' };
        }
        return { roleCode: 'OPERATOR', positionId: null };
      });
      repository.findEmployeeIdByUserId.mockResolvedValue(EMPLOYEE_ID);
      repository.findOverlapping.mockResolvedValue({
        hasOverlap: false,
        conflictingNovedadIds: [],
      });
      typeConfigService.getConfigForTenant.mockResolvedValue(
        buildTypeConfig(NovedadType.PERMISO_REMUNERADO),
      );
      repository.findEmployeeApprovalContext.mockResolvedValue({
        userId: 'emp-user',
        locationId: 'loc-1',
        positionId: 'pos-emp',
      });
      repository.findSupervisorCandidatesInLocation.mockResolvedValue([
        { id: SUPERVISOR_USER, positionId: 'pos-boss' },
      ]);
      repository.findSubordinatePositionIds.mockResolvedValue(['pos-emp']);
      userLocationsService.getActiveUserLocations.mockResolvedValue([
        { id: 'loc-1', name: 'Sede', tenantId: TENANT } as never,
      ]);
      repository.create.mockResolvedValue(
        buildNovedad({ status: NovedadStatus.PENDIENTE_SUPERVISOR }),
      );

      const result = await service.submit(TENANT, 'emp-user', {
        employeeId: EMPLOYEE_ID,
        type: NovedadType.PERMISO_REMUNERADO,
        startDate: new Date('2026-07-01T00:00:00.000Z'),
        endDate: new Date('2026-07-03T00:00:00.000Z'),
        requestedBy: NovedadRequestSource.EMPLEADO,
      });

      expect(result.novedad.status).toBe(NovedadStatus.PENDIENTE_SUPERVISOR);
      expect(repository.create).toHaveBeenCalledWith(
        TENANT,
        expect.objectContaining({ status: NovedadStatus.PENDIENTE_SUPERVISOR }),
      );
    });

    it('envía LICENCIA_MATERNIDAD directo a PENDIENTE_RRHH', async () => {
      repository.findActorUser.mockResolvedValue({ roleCode: 'OPERATOR', positionId: null });
      repository.findEmployeeIdByUserId.mockResolvedValue(EMPLOYEE_ID);
      repository.findOverlapping.mockResolvedValue({
        hasOverlap: false,
        conflictingNovedadIds: [],
      });
      typeConfigService.getConfigForTenant.mockResolvedValue(
        buildTypeConfig(NovedadType.LICENCIA_MATERNIDAD, {
          requiresSupervisorApproval: false,
          requiresSupportDocument: true,
        }),
      );
      repository.create.mockResolvedValue(
        buildNovedad({
          type: NovedadType.LICENCIA_MATERNIDAD,
          status: NovedadStatus.PENDIENTE_RRHH,
        }),
      );

      const result = await service.submit(TENANT, 'emp-user', {
        employeeId: EMPLOYEE_ID,
        type: NovedadType.LICENCIA_MATERNIDAD,
        startDate: new Date('2026-07-01T00:00:00.000Z'),
        endDate: new Date('2026-07-10T00:00:00.000Z'),
        requestedBy: NovedadRequestSource.EMPLEADO,
        supportStorageObjectId: 'storage-1',
      });

      expect(result.novedad.status).toBe(NovedadStatus.PENDIENTE_RRHH);
    });

    it('cae a RRHH con warning si no hay supervisor resoluble', async () => {
      repository.findActorUser.mockResolvedValue({ roleCode: 'OPERATOR', positionId: null });
      repository.findEmployeeIdByUserId.mockResolvedValue(EMPLOYEE_ID);
      repository.findOverlapping.mockResolvedValue({
        hasOverlap: false,
        conflictingNovedadIds: [],
      });
      typeConfigService.getConfigForTenant.mockResolvedValue(
        buildTypeConfig(NovedadType.PERMISO_REMUNERADO),
      );
      repository.findEmployeeApprovalContext.mockResolvedValue({
        userId: 'emp-user',
        locationId: 'loc-1',
        positionId: 'pos-emp',
      });
      repository.findSupervisorCandidatesInLocation.mockResolvedValue([]);
      repository.create.mockResolvedValue(buildNovedad({ status: NovedadStatus.PENDIENTE_RRHH }));

      const result = await service.submit(TENANT, 'emp-user', {
        employeeId: EMPLOYEE_ID,
        type: NovedadType.PERMISO_REMUNERADO,
        startDate: new Date('2026-07-01T00:00:00.000Z'),
        endDate: new Date('2026-07-03T00:00:00.000Z'),
        requestedBy: NovedadRequestSource.EMPLEADO,
      });

      expect(result.novedad.status).toBe(NovedadStatus.PENDIENTE_RRHH);
      expect(result.warnings).toContain(NO_SUPERVISOR_ASSIGNED_WARNING);
    });

    it('bloquea solapamiento sin ack', async () => {
      repository.findActorUser.mockResolvedValue({ roleCode: 'NOMINA', positionId: null });
      repository.findOverlapping.mockResolvedValue({
        hasOverlap: true,
        conflictingNovedadIds: ['other-1'],
      });
      typeConfigService.getConfigForTenant.mockResolvedValue(
        buildTypeConfig(NovedadType.PERMISO_REMUNERADO),
      );

      await expect(
        service.submit(TENANT, RRHH_USER, {
          employeeId: EMPLOYEE_ID,
          type: NovedadType.PERMISO_REMUNERADO,
          startDate: new Date('2026-07-01T00:00:00.000Z'),
          endDate: new Date('2026-07-03T00:00:00.000Z'),
          requestedBy: NovedadRequestSource.RRHH,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rechaza ausencia injustificada solicitada por empleado', async () => {
      repository.findActorUser.mockResolvedValue({ roleCode: 'OPERATOR', positionId: null });
      repository.findEmployeeIdByUserId.mockResolvedValue(EMPLOYEE_ID);
      typeConfigService.getConfigForTenant.mockResolvedValue(
        buildTypeConfig(NovedadType.AUSENCIA_INJUSTIFICADA, {
          requiresSupervisorApproval: false,
          isPaidDefault: false,
        }),
      );

      await expect(
        service.submit(TENANT, 'emp-user', {
          employeeId: EMPLOYEE_ID,
          type: NovedadType.AUSENCIA_INJUSTIFICADA,
          startDate: new Date('2026-07-01T00:00:00.000Z'),
          endDate: new Date('2026-07-01T00:00:00.000Z'),
          requestedBy: NovedadRequestSource.EMPLEADO,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('exige soporte cuando el tipo lo requiere', async () => {
      repository.findActorUser.mockResolvedValue({ roleCode: 'NOMINA', positionId: null });
      repository.findOverlapping.mockResolvedValue({
        hasOverlap: false,
        conflictingNovedadIds: [],
      });
      typeConfigService.getConfigForTenant.mockResolvedValue(
        buildTypeConfig(NovedadType.LICENCIA_LUTO, {
          requiresSupervisorApproval: false,
          requiresSupportDocument: true,
        }),
      );

      await expect(
        service.submit(TENANT, RRHH_USER, {
          employeeId: EMPLOYEE_ID,
          type: NovedadType.LICENCIA_LUTO,
          startDate: new Date('2026-07-01T00:00:00.000Z'),
          endDate: new Date('2026-07-03T00:00:00.000Z'),
          requestedBy: NovedadRequestSource.RRHH,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza fechas invertidas', async () => {
      repository.findActorUser.mockResolvedValue({ roleCode: 'NOMINA', positionId: null });

      await expect(
        service.submit(TENANT, RRHH_USER, {
          employeeId: EMPLOYEE_ID,
          type: NovedadType.PERMISO_REMUNERADO,
          startDate: new Date('2026-07-05T00:00:00.000Z'),
          endDate: new Date('2026-07-01T00:00:00.000Z'),
          requestedBy: NovedadRequestSource.RRHH,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('permite solapamiento con ack', async () => {
      repository.findActorUser.mockResolvedValue({ roleCode: 'NOMINA', positionId: null });
      repository.findOverlapping.mockResolvedValue({
        hasOverlap: true,
        conflictingNovedadIds: ['other-1'],
      });
      typeConfigService.getConfigForTenant.mockResolvedValue(
        buildTypeConfig(NovedadType.PERMISO_REMUNERADO, { requiresSupervisorApproval: false }),
      );
      repository.create.mockResolvedValue(
        buildNovedad({ status: NovedadStatus.PENDIENTE_RRHH, overlapWarningAck: true }),
      );

      const result = await service.submit(TENANT, RRHH_USER, {
        employeeId: EMPLOYEE_ID,
        type: NovedadType.PERMISO_REMUNERADO,
        startDate: new Date('2026-07-01T00:00:00.000Z'),
        endDate: new Date('2026-07-03T00:00:00.000Z'),
        requestedBy: NovedadRequestSource.RRHH,
        overlapWarningAck: true,
      });

      expect(result.novedad.status).toBe(NovedadStatus.PENDIENTE_RRHH);
    });

    it('auto-aprueba cuando RRHH envía con autoApprove', async () => {
      repository.findActorUser.mockResolvedValue({ roleCode: 'NOMINA', positionId: null });
      repository.findOverlapping.mockResolvedValue({
        hasOverlap: false,
        conflictingNovedadIds: [],
      });
      typeConfigService.getConfigForTenant.mockResolvedValue(
        buildTypeConfig(NovedadType.PERMISO_REMUNERADO, { requiresSupervisorApproval: false }),
      );
      repository.create.mockResolvedValue(
        buildNovedad({ status: NovedadStatus.APROBADA, requestedBy: NovedadRequestSource.RRHH }),
      );

      const result = await service.submit(TENANT, RRHH_USER, {
        employeeId: EMPLOYEE_ID,
        type: NovedadType.PERMISO_REMUNERADO,
        startDate: new Date('2026-07-01T00:00:00.000Z'),
        endDate: new Date('2026-07-03T00:00:00.000Z'),
        requestedBy: NovedadRequestSource.RRHH,
        autoApprove: true,
      });

      expect(result.novedad.status).toBe(NovedadStatus.APROBADA);
      expect(repository.create).toHaveBeenCalledWith(
        TENANT,
        expect.objectContaining({
          status: NovedadStatus.APROBADA,
          rrhhApproverId: RRHH_USER,
        }),
      );
    });

    it('rechaza empleado que solicita para otro perfil', async () => {
      repository.findActorUser.mockResolvedValue({ roleCode: 'OPERATOR', positionId: null });
      repository.findEmployeeIdByUserId.mockResolvedValue('other-emp');

      await expect(
        service.submit(TENANT, 'emp-user', {
          employeeId: EMPLOYEE_ID,
          type: NovedadType.PERMISO_REMUNERADO,
          startDate: new Date('2026-07-01T00:00:00.000Z'),
          endDate: new Date('2026-07-03T00:00:00.000Z'),
          requestedBy: NovedadRequestSource.EMPLEADO,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rechaza RRHH sin rol de escritura', async () => {
      repository.findActorUser.mockResolvedValue({ roleCode: 'OPERATOR', positionId: null });

      await expect(
        service.submit(TENANT, 'user-op', {
          employeeId: EMPLOYEE_ID,
          type: NovedadType.PERMISO_REMUNERADO,
          startDate: new Date('2026-07-01T00:00:00.000Z'),
          endDate: new Date('2026-07-03T00:00:00.000Z'),
          requestedBy: NovedadRequestSource.RRHH,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('approveBySupervisor', () => {
    it('pasa a PENDIENTE_RRHH tras aprobación del supervisor', async () => {
      repository.findById.mockResolvedValue(
        buildNovedad({ status: NovedadStatus.PENDIENTE_SUPERVISOR }),
      );
      repository.findActorUser.mockResolvedValue({
        roleCode: 'SUPERVISOR',
        positionId: 'pos-boss',
      });
      repository.findEmployeeApprovalContext.mockResolvedValue({
        userId: 'emp-user',
        locationId: 'loc-1',
        positionId: 'pos-emp',
      });
      userLocationsService.getActiveUserLocations.mockResolvedValue([
        { id: 'loc-1', name: 'Sede', tenantId: TENANT } as never,
      ]);
      repository.findSubordinatePositionIds.mockResolvedValue(['pos-emp']);
      repository.update.mockResolvedValue(buildNovedad({ status: NovedadStatus.PENDIENTE_RRHH }));

      const result = await service.approveBySupervisor(TENANT, SUPERVISOR_USER, 'nov-1');

      expect(result.status).toBe(NovedadStatus.PENDIENTE_RRHH);
    });

    it('rechaza si la novedad no está pendiente de supervisor', async () => {
      repository.findById.mockResolvedValue(buildNovedad({ status: NovedadStatus.PENDIENTE_RRHH }));

      await expect(service.approveBySupervisor(TENANT, SUPERVISOR_USER, 'nov-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('rejectBySupervisor', () => {
    it('rechaza con motivo obligatorio', async () => {
      repository.findById.mockResolvedValue(
        buildNovedad({ status: NovedadStatus.PENDIENTE_SUPERVISOR }),
      );
      repository.findActorUser.mockResolvedValue({
        roleCode: 'SUPERVISOR',
        positionId: 'pos-boss',
      });
      repository.findEmployeeApprovalContext.mockResolvedValue({
        userId: 'emp-user',
        locationId: 'loc-1',
        positionId: 'pos-emp',
      });
      userLocationsService.getActiveUserLocations.mockResolvedValue([
        { id: 'loc-1', name: 'Sede', tenantId: TENANT } as never,
      ]);
      repository.findSubordinatePositionIds.mockResolvedValue(['pos-emp']);
      repository.update.mockResolvedValue(
        buildNovedad({ status: NovedadStatus.RECHAZADA, rejectionReason: 'No procede' }),
      );

      const result = await service.rejectBySupervisor(TENANT, SUPERVISOR_USER, {
        novedadId: 'nov-1',
        rejectionReason: 'No procede',
        comment: '  Sin cobertura  ',
      });

      expect(result.status).toBe(NovedadStatus.RECHAZADA);
      expect(repository.update).toHaveBeenCalledWith(
        TENANT,
        'nov-1',
        expect.objectContaining({
          rejectionReason: 'No procede',
          supervisorComment: 'Sin cobertura',
        }),
      );
    });

    it('exige motivo de rechazo', async () => {
      await expect(
        service.rejectBySupervisor(TENANT, SUPERVISOR_USER, {
          novedadId: 'nov-1',
          rejectionReason: '   ',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza si la novedad no está pendiente de supervisor', async () => {
      repository.findById.mockResolvedValue(buildNovedad({ status: NovedadStatus.PENDIENTE_RRHH }));

      await expect(
        service.rejectBySupervisor(TENANT, SUPERVISOR_USER, {
          novedadId: 'nov-1',
          rejectionReason: 'No procede',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('approveByRRHH', () => {
    it('aprueba novedad pendiente de RRHH', async () => {
      repository.findById.mockResolvedValue(buildNovedad({ status: NovedadStatus.PENDIENTE_RRHH }));
      repository.findActorUser.mockResolvedValue({ roleCode: 'NOMINA', positionId: null });
      repository.update.mockResolvedValue(buildNovedad({ status: NovedadStatus.APROBADA }));

      const result = await service.approveByRRHH(TENANT, RRHH_USER, 'nov-1');

      expect(result.status).toBe(NovedadStatus.APROBADA);
    });

    it('rechaza si el actor no tiene rol RRHH', async () => {
      repository.findById.mockResolvedValue(buildNovedad({ status: NovedadStatus.PENDIENTE_RRHH }));
      repository.findActorUser.mockResolvedValue({ roleCode: 'OPERATOR', positionId: null });

      await expect(service.approveByRRHH(TENANT, 'user-op', 'nov-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('rechaza si la novedad no está pendiente de RRHH', async () => {
      repository.findById.mockResolvedValue(
        buildNovedad({ status: NovedadStatus.PENDIENTE_SUPERVISOR }),
      );

      await expect(service.approveByRRHH(TENANT, RRHH_USER, 'nov-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('rejectByRRHH', () => {
    it('rechaza novedad pendiente de RRHH', async () => {
      repository.findById.mockResolvedValue(buildNovedad({ status: NovedadStatus.PENDIENTE_RRHH }));
      repository.findActorUser.mockResolvedValue({ roleCode: 'NOMINA', positionId: null });
      repository.update.mockResolvedValue(
        buildNovedad({
          status: NovedadStatus.RECHAZADA,
          rejectionReason: 'Documentación incompleta',
        }),
      );

      const result = await service.rejectByRRHH(TENANT, RRHH_USER, {
        novedadId: 'nov-1',
        rejectionReason: 'Documentación incompleta',
      });

      expect(result.status).toBe(NovedadStatus.RECHAZADA);
    });

    it('exige motivo de rechazo', async () => {
      await expect(
        service.rejectByRRHH(TENANT, RRHH_USER, {
          novedadId: 'nov-1',
          rejectionReason: '',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('list', () => {
    it('filtra bandeja RRHH', async () => {
      repository.findActorUser.mockResolvedValue({ roleCode: 'NOMINA', positionId: null });
      repository.listSummaries.mockResolvedValue([
        {
          ...buildNovedad({ status: NovedadStatus.PENDIENTE_RRHH }),
          employeeName: 'Ana',
          locationId: 'loc-1',
          locationName: 'Sede',
        },
      ]);

      const result = await service.list(TENANT, RRHH_USER, { rrhhInbox: true });

      expect(result).toHaveLength(1);
      expect(repository.listSummaries).toHaveBeenCalledWith(
        TENANT,
        expect.objectContaining({ status: [NovedadStatus.PENDIENTE_RRHH] }),
      );
    });

    it('retorna vacío cuando supervisor no tiene empleados a cargo', async () => {
      repository.findActorUser.mockResolvedValue({
        roleCode: 'SUPERVISOR',
        positionId: 'pos-boss',
      });
      userLocationsService.getActiveUserLocations.mockResolvedValue([
        { id: 'loc-1', name: 'Sede', tenantId: TENANT } as never,
      ]);
      repository.findSubordinatePositionIds.mockResolvedValue([]);
      repository.findEmployeeIdsInScope.mockResolvedValue([]);

      const result = await service.list(TENANT, SUPERVISOR_USER, { supervisorInbox: true });

      expect(result).toEqual([]);
      expect(repository.listSummaries).not.toHaveBeenCalled();
    });

    it('rechaza usuarios sin permiso de consulta', async () => {
      repository.findActorUser.mockResolvedValue({ roleCode: 'OPERATOR', positionId: null });

      await expect(service.list(TENANT, 'user-op', {})).rejects.toThrow(ForbiddenException);
    });

    it('limita listado general de supervisor a sus empleados', async () => {
      repository.findActorUser.mockResolvedValue({
        roleCode: 'SUPERVISOR',
        positionId: 'pos-boss',
      });
      userLocationsService.getActiveUserLocations.mockResolvedValue([
        { id: 'loc-1', name: 'Sede', tenantId: TENANT } as never,
      ]);
      repository.findSubordinatePositionIds.mockResolvedValue(['pos-emp']);
      repository.findEmployeeIdsInScope.mockResolvedValue([EMPLOYEE_ID]);
      repository.listSummaries.mockResolvedValue([]);

      await service.list(TENANT, SUPERVISOR_USER, {});

      expect(repository.listSummaries).toHaveBeenCalledWith(
        TENANT,
        expect.objectContaining({ employeeIds: [EMPLOYEE_ID] }),
      );
    });
  });

  describe('listMyNovedades', () => {
    it('lista novedades del empleado vinculado al usuario', async () => {
      repository.findEmployeeIdByUserId.mockResolvedValue(EMPLOYEE_ID);
      repository.listSummaries.mockResolvedValue([
        {
          ...buildNovedad(),
          employeeName: 'Ana',
          locationId: 'loc-1',
          locationName: 'Sede',
        },
      ]);

      const result = await service.listMyNovedades(TENANT, 'emp-user', {});

      expect(result).toHaveLength(1);
      expect(repository.listSummaries).toHaveBeenCalledWith(
        TENANT,
        expect.objectContaining({ employeeId: EMPLOYEE_ID }),
      );
    });

    it('rechaza cuando el usuario no tiene empleado vinculado', async () => {
      repository.findEmployeeIdByUserId.mockResolvedValue(null);

      await expect(service.listMyNovedades(TENANT, 'user-op', {})).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('listEmployeeTypeConfigs', () => {
    it('excluye AUSENCIA_INJUSTIFICADA del listado empleado', async () => {
      typeConfigService.listConfigs.mockResolvedValue([
        buildTypeConfig(NovedadType.PERMISO_REMUNERADO),
        buildTypeConfig(NovedadType.AUSENCIA_INJUSTIFICADA, { isPaidDefault: false }),
      ]);

      const result = await service.listEmployeeTypeConfigs(TENANT);

      expect(result).toHaveLength(1);
      expect(result[0]?.type).toBe(NovedadType.PERMISO_REMUNERADO);
    });
  });

  describe('findOne', () => {
    it('permite ver la novedad propia al empleado', async () => {
      const novedad = buildNovedad();
      repository.findById.mockResolvedValue(novedad);
      repository.findActorUser.mockResolvedValue({ roleCode: 'OPERATOR', positionId: null });
      repository.findEmployeeIdByUserId.mockResolvedValue(EMPLOYEE_ID);

      const result = await service.findOne(TENANT, 'emp-user', 'nov-1');

      expect(result.id).toBe('nov-1');
    });

    it('lanza NotFound cuando la novedad no existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne(TENANT, RRHH_USER, 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('permite ver la novedad a RRHH', async () => {
      repository.findById.mockResolvedValue(buildNovedad());
      repository.findActorUser.mockResolvedValue({ roleCode: 'NOMINA', positionId: null });
      repository.findEmployeeIdByUserId.mockResolvedValue('other-emp');

      const result = await service.findOne(TENANT, RRHH_USER, 'nov-1');

      expect(result.id).toBe('nov-1');
    });

    it('permite ver la novedad a supervisor con jerarquía válida', async () => {
      repository.findById.mockResolvedValue(buildNovedad());
      repository.findActorUser.mockResolvedValue({
        roleCode: 'SUPERVISOR',
        positionId: 'pos-boss',
      });
      repository.findEmployeeIdByUserId.mockResolvedValue('other-emp');
      repository.findEmployeeApprovalContext.mockResolvedValue({
        userId: 'emp-user',
        locationId: 'loc-1',
        positionId: 'pos-emp',
      });
      userLocationsService.getActiveUserLocations.mockResolvedValue([
        { id: 'loc-1', name: 'Sede', tenantId: TENANT } as never,
      ]);
      repository.findSubordinatePositionIds.mockResolvedValue(['pos-emp']);

      const result = await service.findOne(TENANT, SUPERVISOR_USER, 'nov-1');

      expect(result.id).toBe('nov-1');
    });

    it('rechaza supervisor sin permiso sobre la novedad', async () => {
      repository.findById.mockResolvedValue(buildNovedad());
      repository.findActorUser.mockResolvedValue({
        roleCode: 'SUPERVISOR',
        positionId: 'pos-boss',
      });
      repository.findEmployeeIdByUserId.mockResolvedValue('other-emp');
      repository.findEmployeeApprovalContext.mockResolvedValue({
        userId: 'emp-user',
        locationId: 'loc-2',
        positionId: 'pos-emp',
      });
      userLocationsService.getActiveUserLocations.mockResolvedValue([
        { id: 'loc-1', name: 'Sede', tenantId: TENANT } as never,
      ]);

      await expect(service.findOne(TENANT, SUPERVISOR_USER, 'nov-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('attachSupportDocument', () => {
    it('sube soporte y actualiza la novedad', async () => {
      repository.findActorUser.mockResolvedValue({ roleCode: 'NOMINA', positionId: null });
      repository.findById.mockResolvedValue(buildNovedad());
      storageService.uploadFile.mockResolvedValue({ id: 'storage-1' } as never);
      repository.update.mockResolvedValue(buildNovedad({ supportStorageObjectId: 'storage-1' }));

      const result = await service.attachSupportDocument(TENANT, RRHH_USER, 'nov-1', {
        buffer: Buffer.from('pdf'),
        mimetype: 'application/pdf',
        originalname: 'soporte.pdf',
        size: 1024,
      });

      expect(result.supportStorageObjectId).toBe('storage-1');
    });

    it('rechaza tipos de archivo no permitidos', async () => {
      repository.findActorUser.mockResolvedValue({ roleCode: 'NOMINA', positionId: null });
      repository.findById.mockResolvedValue(buildNovedad());

      await expect(
        service.attachSupportDocument(TENANT, RRHH_USER, 'nov-1', {
          buffer: Buffer.from('exe'),
          mimetype: 'application/octet-stream',
          originalname: 'virus.exe',
          size: 1024,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza archivos mayores a 10 MB', async () => {
      repository.findActorUser.mockResolvedValue({ roleCode: 'NOMINA', positionId: null });
      repository.findById.mockResolvedValue(buildNovedad());

      await expect(
        service.attachSupportDocument(TENANT, RRHH_USER, 'nov-1', {
          buffer: Buffer.alloc(1),
          mimetype: 'application/pdf',
          originalname: 'grande.pdf',
          size: 10 * 1024 * 1024 + 1,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza usuarios sin permiso de escritura', async () => {
      repository.findActorUser.mockResolvedValue({ roleCode: 'OPERATOR', positionId: null });

      await expect(
        service.attachSupportDocument(TENANT, 'user-op', 'nov-1', {
          buffer: Buffer.from('pdf'),
          mimetype: 'application/pdf',
          originalname: 'soporte.pdf',
          size: 1024,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getSupportDocumentUrl', () => {
    it('retorna URL presignada cuando hay soporte', async () => {
      const novedad = buildNovedad({ supportStorageObjectId: 'storage-1' });
      repository.findById.mockResolvedValue(novedad);
      repository.findActorUser.mockResolvedValue({ roleCode: 'NOMINA', positionId: null });
      storageService.getPresignedUrl.mockResolvedValue('https://signed-url');

      const result = await service.getSupportDocumentUrl(TENANT, RRHH_USER, 'nov-1');

      expect(result).toBe('https://signed-url');
    });

    it('lanza NotFound cuando no hay soporte adjunto', async () => {
      repository.findById.mockResolvedValue(buildNovedad());
      repository.findActorUser.mockResolvedValue({ roleCode: 'NOMINA', positionId: null });

      await expect(service.getSupportDocumentUrl(TENANT, RRHH_USER, 'nov-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('assertSupervisorCanActOnEmployee', () => {
    it('rechaza supervisor de otra sede', async () => {
      repository.findActorUser.mockResolvedValue({
        roleCode: 'SUPERVISOR',
        positionId: 'pos-boss',
      });
      repository.findEmployeeApprovalContext.mockResolvedValue({
        userId: 'emp-user',
        locationId: 'loc-2',
        positionId: 'pos-emp',
      });
      userLocationsService.getActiveUserLocations.mockResolvedValue([
        { id: 'loc-1', name: 'Sede', tenantId: TENANT } as never,
      ]);

      await expect(
        service.assertSupervisorCanActOnEmployee(TENANT, SUPERVISOR_USER, EMPLOYEE_ID),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rechaza supervisor fuera de la jerarquía de cargo', async () => {
      repository.findActorUser.mockResolvedValue({
        roleCode: 'SUPERVISOR',
        positionId: 'pos-boss',
      });
      repository.findEmployeeApprovalContext.mockResolvedValue({
        userId: 'emp-user',
        locationId: 'loc-1',
        positionId: 'pos-other',
      });
      userLocationsService.getActiveUserLocations.mockResolvedValue([
        { id: 'loc-1', name: 'Sede', tenantId: TENANT } as never,
      ]);
      repository.findSubordinatePositionIds.mockResolvedValue(['pos-emp']);

      await expect(
        service.assertSupervisorCanActOnEmployee(TENANT, SUPERVISOR_USER, EMPLOYEE_ID),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
