import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceEventType } from '@prisma/client';
import { AuditService } from '../../audit/service/audit.service';
import { ShiftResolutionService } from '../../turnos/service/shift-resolution.service';
import type { AttendanceActingUser } from '../interfaces/attendance.interfaces';
import { AttendanceRepository } from '../repository/attendance.repository';
import { AttendanceCardService } from '../service/attendance-card.service';
import { AttendanceService } from '../service/attendance.service';
import { ManualMarkingProvisionService } from '../service/manual-marking-provision.service';
import { UserLocationsService } from '../../locations/service/user-locations.service';
import { VacationsService } from '../../vacations/service/vacations.service';
import { PayrollNovedadesRepository } from '../../payroll-novedades/repository/payroll-novedades.repository';
import { MedicalLeavesRepository } from '../../medical-leaves/repository/medical-leaves.repository';
import { VacationType } from '@prisma/client';

const TENANT = 'tenant-1';
const LOCATION_A = 'loc-A';
const LOCATION_B = 'loc-B';

function makeEmployee(overrides?: Partial<{ id: string; locationId: string }>) {
  return {
    id: overrides?.id ?? 'emp-1',
    userId: 'user-1',
    tenantId: TENANT,
    locationId: overrides?.locationId ?? LOCATION_A,
    isActive: true,
    deletedAt: null,
    user: { id: 'user-1', email: 'ana@restopsiq.dev' },
  };
}

function makeActingUser(overrides?: Partial<AttendanceActingUser>): AttendanceActingUser {
  return {
    sub: 'actor-1',
    roleCode: 'OWNER',
    locationId: LOCATION_A,
    ...overrides,
  };
}

describe('AttendanceCardService', () => {
  let service: AttendanceCardService;
  let repo: jest.Mocked<AttendanceRepository>;
  let audit: jest.Mocked<AuditService>;
  let attendanceService: jest.Mocked<AttendanceService>;
  let userLocationsService: jest.Mocked<UserLocationsService>;
  let vacationsService: jest.Mocked<VacationsService>;
  let payrollNovedadesRepository: jest.Mocked<
    Pick<PayrollNovedadesRepository, 'findActiveRangesForEmployeeInPeriod'>
  >;
  let medicalLeavesRepository: jest.Mocked<
    Pick<MedicalLeavesRepository, 'findOverlappingForPayrollPeriod'>
  >;
  let manualMarkingProvisionService: jest.Mocked<
    Pick<
      ManualMarkingProvisionService,
      'provisionAfterManualMarking' | 'validateBeforeManualMarking'
    >
  >;

  beforeEach(async () => {
    manualMarkingProvisionService = {
      provisionAfterManualMarking: jest.fn().mockResolvedValue({ provisioned: false }),
      validateBeforeManualMarking: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceCardService,
        {
          provide: AttendanceRepository,
          useValue: {
            findEmployeeByUserId: jest.fn(),
            listHistory: jest.fn(),
            listObservationsInRange: jest.fn(),
            findObservation: jest.fn(),
            upsertObservation: jest.fn(),
            findLogById: jest.fn(),
            deleteManualLog: jest.fn(),
          },
        },
        { provide: AuditService, useValue: { log: jest.fn() } },
        { provide: AttendanceService, useValue: { registerEvent: jest.fn() } },
        {
          provide: ShiftResolutionService,
          useValue: {
            resolveForDay: jest.fn().mockResolvedValue({ kind: 'NONE', targetMinutes: 0 }),
            getTargetMinutesForDay: jest.fn().mockResolvedValue(0),
          },
        },
        {
          provide: UserLocationsService,
          useValue: {
            resolveAllowedLocationIds: jest.fn().mockResolvedValue(null),
            assertLocationAllowed: jest.fn(),
          },
        },
        {
          provide: VacationsService,
          useValue: {
            getApprovedDisfruteRanges: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: PayrollNovedadesRepository,
          useValue: {
            findActiveRangesForEmployeeInPeriod: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: MedicalLeavesRepository,
          useValue: {
            findOverlappingForPayrollPeriod: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: ManualMarkingProvisionService,
          useValue: manualMarkingProvisionService,
        },
      ],
    }).compile();

    service = module.get(AttendanceCardService);
    repo = module.get(AttendanceRepository);
    audit = module.get(AuditService);
    attendanceService = module.get(AttendanceService);
    userLocationsService = module.get(UserLocationsService);
    vacationsService = module.get(VacationsService);
    payrollNovedadesRepository = module.get(PayrollNovedadesRepository);
    medicalLeavesRepository = module.get(MedicalLeavesRepository);
  });

  describe('getCard', () => {
    it('resuelve historial + observaciones del rango', async () => {
      const employee = makeEmployee();
      repo.findEmployeeByUserId.mockResolvedValue(employee as never);
      const log = {
        id: 'log-1',
        workDate: new Date('2026-06-10T00:00:00.000Z'),
        eventType: 'ENTRY',
        timestamp: new Date('2026-06-10T13:00:00.000Z'),
      };
      repo.listHistory.mockResolvedValue([log] as never);
      repo.listObservationsInRange.mockResolvedValue([{ id: 'obs-1' }] as never);

      const result = await service.getCard(
        'user-1',
        TENANT,
        '2026-06-01',
        '2026-06-30',
        makeActingUser(),
      );

      expect(result.logs).toEqual([log]);
      expect(result.observations).toEqual([{ id: 'obs-1' }]);
      expect(result.daySummaries.length).toBeGreaterThan(0);
    });

    it('marca días de vacación aprobada como VACACIONES sin unworkedMinutes', async () => {
      const employee = makeEmployee();
      repo.findEmployeeByUserId.mockResolvedValue(employee as never);
      repo.listHistory.mockResolvedValue([] as never);
      repo.listObservationsInRange.mockResolvedValue([] as never);
      vacationsService.getApprovedDisfruteRanges.mockResolvedValue([
        {
          employeeId: employee.id,
          startDate: new Date('2026-06-10T00:00:00.000Z'),
          endDate: new Date('2026-06-10T00:00:00.000Z'),
          type: VacationType.DISFRUTE,
        },
      ]);

      const result = await service.getCard(
        'user-1',
        TENANT,
        '2026-06-10',
        '2026-06-10',
        makeActingUser(),
      );

      expect(result.daySummaries).toHaveLength(1);
      expect(result.daySummaries[0].resolvedKind).toBe('VACACIONES');
      expect(result.daySummaries[0].unworkedMinutes).toBe(0);
      expect(result.daySummaries[0].shiftName).toBe('Vacaciones');
      expect(result.daySummaries[0].absenceLabel).toBe('Vacaciones');
    });

    it('expone absenceLabel para novedad de nómina activa sin marcación', async () => {
      const employee = makeEmployee();
      repo.findEmployeeByUserId.mockResolvedValue(employee as never);
      repo.listHistory.mockResolvedValue([] as never);
      repo.listObservationsInRange.mockResolvedValue([] as never);
      payrollNovedadesRepository.findActiveRangesForEmployeeInPeriod.mockResolvedValue([
        {
          startDate: new Date('2026-06-10T00:00:00.000Z'),
          endDate: new Date('2026-06-10T00:00:00.000Z'),
          type: 'LICENCIA_LUTO',
        },
      ] as never);

      const result = await service.getCard(
        'user-1',
        TENANT,
        '2026-06-10',
        '2026-06-10',
        makeActingUser(),
      );

      expect(result.daySummaries[0].absenceLabel).toBe('Licencia de luto');
      expect(result.daySummaries[0].shiftName).toBe('Licencia de luto');
    });

    it('empleado fuera de tenant falla', async () => {
      repo.findEmployeeByUserId.mockResolvedValue(null);

      await expect(
        service.getCard('user-x', TENANT, '2026-06-01', '2026-06-30', makeActingUser()),
      ).rejects.toThrow(NotFoundException);
    });

    it('rango mayor a 3 meses falla', async () => {
      repo.findEmployeeByUserId.mockResolvedValue(makeEmployee() as never);

      await expect(
        service.getCard('user-1', TENANT, '2026-01-01', '2026-06-30', makeActingUser()),
      ).rejects.toThrow(BadRequestException);
    });

    it('supervisor fuera de sede falla en lectura', async () => {
      const employee = makeEmployee({ locationId: LOCATION_B });
      repo.findEmployeeByUserId.mockResolvedValue(employee as never);
      userLocationsService.resolveAllowedLocationIds.mockResolvedValue([LOCATION_A]);
      userLocationsService.assertLocationAllowed.mockImplementation((allowed, locationId) => {
        if (allowed && !allowed.includes(locationId)) {
          throw new ForbiddenException('No tiene acceso a esta sede');
        }
      });

      await expect(
        service.getCard(
          'user-1',
          TENANT,
          '2026-06-01',
          '2026-06-30',
          makeActingUser({ roleCode: 'SUPERVISOR' }),
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(repo.listHistory).not.toHaveBeenCalled();
    });
  });

  describe('upsertObservation', () => {
    it('crea observación nueva y audita action=CREATE', async () => {
      const employee = makeEmployee();
      repo.findEmployeeByUserId.mockResolvedValue(employee as never);
      repo.findObservation.mockResolvedValue(null);
      repo.upsertObservation.mockResolvedValue({ id: 'obs-1', note: 'Llegó tarde' } as never);

      const result = await service.upsertObservation('user-1', TENANT, makeActingUser(), {
        workDate: '2026-06-10',
        note: 'Llegó tarde',
      });

      expect(result.id).toBe('obs-1');
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE', entityType: 'AttendanceObservation' }),
      );
    });

    it('edita observación existente y audita action=UPDATE', async () => {
      const employee = makeEmployee();
      repo.findEmployeeByUserId.mockResolvedValue(employee as never);
      repo.findObservation.mockResolvedValue({ id: 'obs-1', note: 'Nota vieja' } as never);
      repo.upsertObservation.mockResolvedValue({ id: 'obs-1', note: 'Nota nueva' } as never);

      await service.upsertObservation('user-1', TENANT, makeActingUser(), {
        workDate: '2026-06-10',
        note: 'Nota nueva',
      });

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'UPDATE',
          entityType: 'AttendanceObservation',
          oldValue: { note: 'Nota vieja' },
        }),
      );
    });

    it('empleado fuera de tenant falla', async () => {
      repo.findEmployeeByUserId.mockResolvedValue(null);

      await expect(
        service.upsertObservation('user-x', TENANT, makeActingUser(), {
          workDate: '2026-06-10',
          note: 'nota',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('supervisor fuera de sede falla', async () => {
      const employee = makeEmployee({ locationId: LOCATION_B });
      repo.findEmployeeByUserId.mockResolvedValue(employee as never);
      userLocationsService.resolveAllowedLocationIds.mockResolvedValue([LOCATION_A]);
      userLocationsService.assertLocationAllowed.mockImplementation((allowed, locationId) => {
        if (allowed && !allowed.includes(locationId)) {
          throw new ForbiddenException('No tiene acceso a esta sede');
        }
      });

      await expect(
        service.upsertObservation('user-1', TENANT, makeActingUser({ roleCode: 'SUPERVISOR' }), {
          workDate: '2026-06-10',
          note: 'nota',
        }),
      ).rejects.toThrow(ForbiddenException);

      expect(repo.upsertObservation).not.toHaveBeenCalled();
    });

    it('OWNER puede operar sobre cualquier sede', async () => {
      const employee = makeEmployee({ locationId: LOCATION_B });
      repo.findEmployeeByUserId.mockResolvedValue(employee as never);
      repo.findObservation.mockResolvedValue(null);
      repo.upsertObservation.mockResolvedValue({ id: 'obs-1', note: 'nota' } as never);

      await expect(
        service.upsertObservation(
          'user-1',
          TENANT,
          makeActingUser({ roleCode: 'OWNER', locationId: LOCATION_A }),
          { workDate: '2026-06-10', note: 'nota' },
        ),
      ).resolves.toBeDefined();
    });
  });

  describe('createManualMarking', () => {
    const baseInput = {
      workDate: '2026-06-10',
      eventType: AttendanceEventType.ENTRY,
      timestamp: '2026-06-10T08:00:00.000Z',
      reason: 'CORRECCION_MARCACION',
    };

    it('crea marcación manual ENTRY con source=MANUAL', async () => {
      const employee = makeEmployee();
      repo.findEmployeeByUserId.mockResolvedValue(employee as never);
      attendanceService.registerEvent.mockResolvedValue({
        id: 'log-manual-1',
        source: 'MANUAL',
      } as never);

      await service.createManualMarking('user-1', TENANT, makeActingUser(), baseInput);

      expect(attendanceService.registerEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AttendanceEventType.ENTRY,
          source: 'MANUAL',
          createdByUserId: 'actor-1',
          manualReason: 'CORRECCION_MARCACION',
          manualParentLogId: null,
        }),
      );
      expect(manualMarkingProvisionService.provisionAfterManualMarking).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: TENANT,
          actorUserId: 'actor-1',
          reason: 'CORRECCION_MARCACION',
        }),
      );
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CREATE', entityType: 'AttendanceLog' }),
      );
    });

    it('crea marcación manual EXIT que cruza medianoche (turno nocturno)', async () => {
      const employee = makeEmployee();
      repo.findEmployeeByUserId.mockResolvedValue(employee as never);
      attendanceService.registerEvent.mockResolvedValue({
        id: 'log-manual-2',
        source: 'MANUAL',
      } as never);

      await service.createManualMarking('user-1', TENANT, makeActingUser(), {
        ...baseInput,
        eventType: AttendanceEventType.EXIT,
        timestamp: '2026-06-11T02:00:00.000Z',
      });

      expect(attendanceService.registerEvent).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: AttendanceEventType.EXIT, source: 'MANUAL' }),
      );
    });

    it('no modifica ningún AttendanceLog existente (solo crea uno nuevo)', async () => {
      const employee = makeEmployee();
      const parentLog = { id: 'log-device-1', employeeId: employee.id, tenantId: TENANT };
      repo.findEmployeeByUserId.mockResolvedValue(employee as never);
      repo.findLogById.mockResolvedValue(parentLog as never);
      attendanceService.registerEvent.mockResolvedValue({
        id: 'log-manual-3',
        source: 'MANUAL',
      } as never);

      await service.createManualMarking('user-1', TENANT, makeActingUser(), {
        ...baseInput,
        parentLogId: 'log-device-1',
      });

      expect(repo.findLogById).toHaveBeenCalledWith('log-device-1', TENANT);
      expect(attendanceService.registerEvent).toHaveBeenCalledWith(
        expect.objectContaining({ manualParentLogId: 'log-device-1', source: 'MANUAL' }),
      );
      // No existe ningún método de repositorio que edite un log existente.
      expect((repo as unknown as Record<string, unknown>).updateLog).toBeUndefined();
    });

    it('parentLogId inválido falla', async () => {
      const employee = makeEmployee();
      repo.findEmployeeByUserId.mockResolvedValue(employee as never);
      repo.findLogById.mockResolvedValue(null);

      await expect(
        service.createManualMarking('user-1', TENANT, makeActingUser(), {
          ...baseInput,
          parentLogId: 'log-inexistente',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(attendanceService.registerEvent).not.toHaveBeenCalled();
    });

    it('parentLogId de otro empleado falla', async () => {
      const employee = makeEmployee();
      const parentLog = { id: 'log-device-1', employeeId: 'otro-empleado', tenantId: TENANT };
      repo.findEmployeeByUserId.mockResolvedValue(employee as never);
      repo.findLogById.mockResolvedValue(parentLog as never);

      await expect(
        service.createManualMarking('user-1', TENANT, makeActingUser(), {
          ...baseInput,
          parentLogId: 'log-device-1',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(attendanceService.registerEvent).not.toHaveBeenCalled();
    });

    it('supervisor fuera de sede falla', async () => {
      const employee = makeEmployee({ locationId: LOCATION_B });
      repo.findEmployeeByUserId.mockResolvedValue(employee as never);
      userLocationsService.resolveAllowedLocationIds.mockResolvedValue([LOCATION_A]);
      userLocationsService.assertLocationAllowed.mockImplementation((allowed, locationId) => {
        if (allowed && !allowed.includes(locationId)) {
          throw new ForbiddenException('No tiene acceso a esta sede');
        }
      });

      await expect(
        service.createManualMarking(
          'user-1',
          TENANT,
          makeActingUser({ roleCode: 'SUPERVISOR' }),
          baseInput,
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(attendanceService.registerEvent).not.toHaveBeenCalled();
    });

    it('empleado fuera de tenant falla', async () => {
      repo.findEmployeeByUserId.mockResolvedValue(null);

      await expect(
        service.createManualMarking('user-x', TENANT, makeActingUser(), baseInput),
      ).rejects.toThrow(NotFoundException);
    });

    it('motivo de nómina registra ausencia del día sin crear AttendanceLog', async () => {
      const employee = makeEmployee();
      repo.findEmployeeByUserId.mockResolvedValue(employee as never);
      manualMarkingProvisionService.provisionAfterManualMarking.mockResolvedValue({
        provisioned: true,
        payrollNovedadId: 'nov-1',
      });

      await service.createManualMarking('user-1', TENANT, makeActingUser({ roleCode: 'NOMINA' }), {
        workDate: '2026-06-10',
        reason: 'LICENCIA_LUTO',
        supportStorageObjectId: 'storage-1',
      });

      expect(attendanceService.registerEvent).not.toHaveBeenCalled();
      expect(manualMarkingProvisionService.provisionAfterManualMarking).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: 'LICENCIA_LUTO',
          supportStorageObjectId: 'storage-1',
        }),
      );
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ entityType: 'PayrollNovedad', entityId: 'nov-1' }),
      );
    });
  });

  describe('deleteManualMarking', () => {
    function makeManualLog(overrides?: Partial<{ locationId: string; source: string }>) {
      return {
        id: 'log-manual-1',
        eventType: AttendanceEventType.ENTRY,
        timestamp: new Date('2026-06-10T08:00:00.000Z'),
        workDate: new Date('2026-06-10T00:00:00.000Z'),
        source: overrides?.source ?? 'MANUAL',
        employee: { locationId: overrides?.locationId ?? LOCATION_A },
      };
    }

    it('elimina una marcación manual exitosamente y audita action=DELETE', async () => {
      const log = makeManualLog();
      repo.findLogById.mockResolvedValue(log as never);
      repo.deleteManualLog.mockResolvedValue(log as never);

      await service.deleteManualMarking('log-manual-1', TENANT, makeActingUser());

      expect(repo.deleteManualLog).toHaveBeenCalledWith('log-manual-1', TENANT);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DELETE',
          entityType: 'AttendanceLog',
          entityId: 'log-manual-1',
          newValue: null,
        }),
      );
    });

    it('eliminar un log DEVICE falla (AttendanceLog es inmutable)', async () => {
      const log = makeManualLog({ source: 'DEVICE' });
      repo.findLogById.mockResolvedValue(log as never);

      await expect(
        service.deleteManualMarking('log-device-1', TENANT, makeActingUser()),
      ).rejects.toThrow(ForbiddenException);

      expect(repo.deleteManualLog).not.toHaveBeenCalled();
    });

    it('marcación inexistente falla', async () => {
      repo.findLogById.mockResolvedValue(null);

      await expect(
        service.deleteManualMarking('log-inexistente', TENANT, makeActingUser()),
      ).rejects.toThrow(NotFoundException);

      expect(repo.deleteManualLog).not.toHaveBeenCalled();
    });

    it('supervisor fuera de sede falla', async () => {
      const log = makeManualLog({ locationId: LOCATION_B });
      repo.findLogById.mockResolvedValue(log as never);
      userLocationsService.resolveAllowedLocationIds.mockResolvedValue([LOCATION_A]);
      userLocationsService.assertLocationAllowed.mockImplementation((allowed, locationId) => {
        if (allowed && !allowed.includes(locationId)) {
          throw new ForbiddenException('No tiene acceso a esta sede');
        }
      });

      await expect(
        service.deleteManualMarking(
          'log-manual-1',
          TENANT,
          makeActingUser({ roleCode: 'SUPERVISOR' }),
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(repo.deleteManualLog).not.toHaveBeenCalled();
    });

    it('OWNER puede eliminar sobre cualquier sede', async () => {
      const log = makeManualLog({ locationId: LOCATION_B });
      repo.findLogById.mockResolvedValue(log as never);
      repo.deleteManualLog.mockResolvedValue(log as never);

      await expect(
        service.deleteManualMarking(
          'log-manual-1',
          TENANT,
          makeActingUser({ roleCode: 'OWNER', locationId: LOCATION_A }),
        ),
      ).resolves.toBeUndefined();
    });
  });
});
