import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LeaveOrigin, NovedadRequestSource, NovedadType } from '@prisma/client';

import { MedicalLeavesService } from '../../medical-leaves/service/medical-leaves.service';
import { NovedadTypeConfigService } from '../../payroll-novedades/service/novedad-type-config.service';
import { PayrollNovedadesService } from '../../payroll-novedades/service/payroll-novedades.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ManualMarkingProvisionService } from '../service/manual-marking-provision.service';

const TENANT = 'tenant-1';
const ACTOR_ID = 'actor-1';
const EMPLOYEE_ID = 'emp-1';
const LOG_ID = 'log-manual-1';
const WORK_DATE = new Date('2026-06-10T00:00:00.000Z');

describe('ManualMarkingProvisionService', () => {
  let service: ManualMarkingProvisionService;
  let payrollNovedadesService: jest.Mocked<Pick<PayrollNovedadesService, 'submit'>>;
  let medicalLeavesService: jest.Mocked<Pick<MedicalLeavesService, 'register'>>;
  let novedadTypeConfigService: jest.Mocked<Pick<NovedadTypeConfigService, 'getConfigForTenant'>>;
  let prisma: { payrollNovedad: { update: jest.Mock }; medicalLeave: { update: jest.Mock } };

  beforeEach(async () => {
    payrollNovedadesService = { submit: jest.fn() };
    medicalLeavesService = { register: jest.fn() };
    novedadTypeConfigService = {
      getConfigForTenant: jest.fn().mockResolvedValue({ requiresSupportDocument: false }),
    };
    prisma = {
      payrollNovedad: { update: jest.fn().mockResolvedValue({}) },
      medicalLeave: { update: jest.fn().mockResolvedValue({}) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ManualMarkingProvisionService,
        { provide: PayrollNovedadesService, useValue: payrollNovedadesService },
        { provide: MedicalLeavesService, useValue: medicalLeavesService },
        { provide: NovedadTypeConfigService, useValue: novedadTypeConfigService },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(ManualMarkingProvisionService);
  });

  const baseInput = {
    tenantId: TENANT,
    actorUserId: ACTOR_ID,
    actorRoleCode: 'NOMINA',
    employeeId: EMPLOYEE_ID,
    attendanceLogId: LOG_ID,
    workDate: WORK_DATE,
  };

  describe('validateBeforeManualMarking', () => {
    it('LICENCIA_LUTO sin soporte lanza BadRequestException', async () => {
      novedadTypeConfigService.getConfigForTenant.mockResolvedValue({
        requiresSupportDocument: true,
      } as never);

      await expect(
        service.validateBeforeManualMarking(TENANT, 'NOMINA', NovedadType.LICENCIA_LUTO),
      ).rejects.toThrow(BadRequestException);
    });

    it('LICENCIA_LUTO con soporte no lanza', async () => {
      novedadTypeConfigService.getConfigForTenant.mockResolvedValue({
        requiresSupportDocument: true,
      } as never);

      await expect(
        service.validateBeforeManualMarking(
          TENANT,
          'NOMINA',
          NovedadType.LICENCIA_LUTO,
          'storage-1',
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe('provisionAfterManualMarking', () => {
    it('CORRECCION_MARCACION no llama payroll ni medical services', async () => {
      const result = await service.provisionAfterManualMarking({
        ...baseInput,
        reason: 'CORRECCION_MARCACION',
      });

      expect(result).toEqual({ provisioned: false });
      expect(payrollNovedadesService.submit).not.toHaveBeenCalled();
      expect(medicalLeavesService.register).not.toHaveBeenCalled();
    });

    it('PERMISO_REMUNERADO crea PayrollNovedad con vínculo al log', async () => {
      payrollNovedadesService.submit.mockResolvedValue({
        novedad: { id: 'nov-1' },
      } as never);

      const result = await service.provisionAfterManualMarking({
        ...baseInput,
        reason: NovedadType.PERMISO_REMUNERADO,
      });

      expect(payrollNovedadesService.submit).toHaveBeenCalledWith(TENANT, ACTOR_ID, {
        employeeId: EMPLOYEE_ID,
        type: NovedadType.PERMISO_REMUNERADO,
        startDate: WORK_DATE,
        endDate: WORK_DATE,
        requestedBy: NovedadRequestSource.RRHH,
        overlapWarningAck: true,
        notes: 'Provisionado desde marcación manual de asistencia',
        supportStorageObjectId: undefined,
      });
      expect(prisma.payrollNovedad.update).toHaveBeenCalledWith({
        where: { id: 'nov-1' },
        data: { sourceAttendanceLogId: LOG_ID },
      });
      expect(result).toEqual({ provisioned: true, payrollNovedadId: 'nov-1' });
    });

    it('INCAPACIDAD_COMUN crea MedicalLeave con vínculo al log', async () => {
      medicalLeavesService.register.mockResolvedValue({
        id: 'leave-1',
      } as never);

      const result = await service.provisionAfterManualMarking({
        ...baseInput,
        reason: 'INCAPACIDAD_COMUN',
      });

      expect(medicalLeavesService.register).toHaveBeenCalledWith(TENANT, ACTOR_ID, {
        employeeId: EMPLOYEE_ID,
        origin: LeaveOrigin.COMUN,
        startDate: WORK_DATE,
        endDate: WORK_DATE,
      });
      expect(prisma.medicalLeave.update).toHaveBeenCalledWith({
        where: { id: 'leave-1' },
        data: { sourceAttendanceLogId: LOG_ID },
      });
      expect(result).toEqual({ provisioned: true, medicalLeaveId: 'leave-1' });
    });

    it('motivo de nómina sin permiso RRHH lanza ForbiddenException', async () => {
      await expect(
        service.provisionAfterManualMarking({
          ...baseInput,
          actorRoleCode: 'SUPERVISOR',
          reason: NovedadType.PERMISO_REMUNERADO,
        }),
      ).rejects.toThrow(ForbiddenException);

      expect(payrollNovedadesService.submit).not.toHaveBeenCalled();
    });

    it('motivo desconocido no provisiona', async () => {
      const result = await service.provisionAfterManualMarking({
        ...baseInput,
        reason: 'FORGOT',
      });

      expect(result).toEqual({ provisioned: false });
      expect(payrollNovedadesService.submit).not.toHaveBeenCalled();
      expect(medicalLeavesService.register).not.toHaveBeenCalled();
    });
  });
});
