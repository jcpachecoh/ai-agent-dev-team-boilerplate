import { NovedadRequestSource, NovedadStatus, NovedadType } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';

import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PayrollNovedadesController } from '../controller/payroll-novedades.controller';
import { NovedadTypeConfigService } from '../service/novedad-type-config.service';
import { PayrollNovedadesService } from '../service/payroll-novedades.service';

const TENANT_ID = 'tenant-1';
const USER_ID = 'user-nomina';

const mockUser: JwtPayload = {
  sub: USER_ID,
  email: 'nomina@test.com',
  tenantId: TENANT_ID,
  roleId: 'role-nomina',
  roleCode: 'NOMINA',
};

const mockNovedad = {
  id: 'nov-1',
  tenantId: TENANT_ID,
  employeeId: 'emp-1',
  type: NovedadType.PERMISO_REMUNERADO,
  startDate: new Date('2026-07-01T00:00:00.000Z'),
  endDate: new Date('2026-07-03T00:00:00.000Z'),
  isPaid: true,
  isEditable: true,
  linkedLeaveId: null,
  supportStorageObjectId: null,
  notes: null,
  requestedBy: NovedadRequestSource.RRHH,
  status: NovedadStatus.PENDIENTE_RRHH,
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
};

describe('PayrollNovedadesController', () => {
  let controller: PayrollNovedadesController;
  let service: jest.Mocked<
    Pick<PayrollNovedadesService, 'submit' | 'list' | 'findOne' | 'edit' | 'listAuditLogs'>
  >;
  let typeConfigService: jest.Mocked<Pick<NovedadTypeConfigService, 'listConfigs'>>;

  beforeEach(async () => {
    service = {
      submit: jest.fn(),
      list: jest.fn(),
      findOne: jest.fn(),
      edit: jest.fn(),
      listAuditLogs: jest.fn(),
    };
    typeConfigService = {
      listConfigs: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PayrollNovedadesController],
      providers: [
        { provide: PayrollNovedadesService, useValue: service },
        { provide: NovedadTypeConfigService, useValue: typeConfigService },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(PayrollNovedadesController);
  });

  it('submit delega al service', async () => {
    service.submit.mockResolvedValue({ novedad: mockNovedad });

    const result = await controller.submit(mockUser, {
      employeeId: 'emp-1',
      type: NovedadType.PERMISO_REMUNERADO,
      startDate: '2026-07-01',
      endDate: '2026-07-03',
      requestedBy: NovedadRequestSource.RRHH,
    });

    expect(result.novedad.id).toBe('nov-1');
    expect(service.submit).toHaveBeenCalled();
  });

  it('list delega al service', async () => {
    service.list.mockResolvedValue([
      {
        ...mockNovedad,
        employeeName: 'Ana',
        locationId: 'loc-1',
        locationName: 'Sede',
      },
    ]);

    const result = await controller.list(mockUser, { rrhhInbox: true });

    expect(result).toHaveLength(1);
    expect(service.list).toHaveBeenCalledWith(
      TENANT_ID,
      USER_ID,
      expect.objectContaining({ rrhhInbox: true }),
    );
  });

  it('edit delega al service', async () => {
    const auditLog = {
      id: 'audit-1',
      tenantId: TENANT_ID,
      novedadId: 'nov-1',
      changedBy: USER_ID,
      changedAt: new Date(),
      previousValue: { endDate: '2026-07-03' },
      newValue: { endDate: '2026-07-02' },
    };
    service.edit.mockResolvedValue({ novedad: mockNovedad, auditLog });

    const result = await controller.edit(mockUser, 'nov-1', {
      endDate: '2026-07-02',
    });

    expect(result.novedad.id).toBe('nov-1');
    expect(result.auditLog.id).toBe('audit-1');
    expect(service.edit).toHaveBeenCalledWith(
      TENANT_ID,
      USER_ID,
      'nov-1',
      expect.objectContaining({
        endDate: expect.any(Date),
      }),
    );
  });

  it('listAuditLogs delega al service', async () => {
    service.listAuditLogs.mockResolvedValue([
      {
        id: 'audit-1',
        tenantId: TENANT_ID,
        novedadId: 'nov-1',
        changedBy: USER_ID,
        changedAt: new Date(),
        previousValue: {},
        newValue: { notes: 'Actualizado' },
      },
    ]);

    const result = await controller.listAuditLogs(mockUser, 'nov-1');

    expect(result).toHaveLength(1);
    expect(service.listAuditLogs).toHaveBeenCalledWith(TENANT_ID, USER_ID, 'nov-1');
  });
});
