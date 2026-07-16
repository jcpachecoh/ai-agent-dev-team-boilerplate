import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { WeeklyShiftPlanStatus } from '@prisma/client';

import { UserLocationsService } from '../../locations/service/user-locations.service';
import type { WeeklyShiftPlanRecord } from '../interfaces/weekly-shift-plan.interfaces';
import { WeeklyShiftPlanRepository } from '../repository/weekly-shift-plan.repository';
import { WeeklyShiftPlanService } from '../service/weekly-shift-plan.service';
import {
  WEEKLY_SHIFT_PLAN_APPROVE_FORBIDDEN_MESSAGE,
  WEEKLY_SHIFT_PLAN_INVALID_TRANSITION_MESSAGE,
} from '../turnos.constants';

describe('WeeklyShiftPlanService', () => {
  let service: WeeklyShiftPlanService;
  let repository: jest.Mocked<WeeklyShiftPlanRepository>;
  let userLocationsService: jest.Mocked<UserLocationsService>;

  const tenantId = 'tenant-1';
  const locationId = 'loc-1';
  const weekStart = new Date('2026-07-13T00:00:00.000Z'); // Monday
  const owner = { userId: 'owner-1', roleCode: 'OWNER' };
  const manager = { userId: 'mgr-1', roleCode: 'MANAGER' };
  const supervisor = { userId: 'sup-1', roleCode: 'SUPERVISOR' };

  function buildPlan(overrides: Partial<WeeklyShiftPlanRecord> = {}): WeeklyShiftPlanRecord {
    return {
      id: 'plan-1',
      tenantId,
      locationId,
      weekStart,
      status: WeeklyShiftPlanStatus.DRAFT,
      submittedByUserId: null,
      submittedAt: null,
      approvedByUserId: null,
      approvedAt: null,
      rejectedByUserId: null,
      rejectedAt: null,
      rejectionReason: null,
      createdAt: new Date('2026-07-10T00:00:00.000Z'),
      updatedAt: new Date('2026-07-10T00:00:00.000Z'),
      ...overrides,
    };
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeeklyShiftPlanService,
        {
          provide: WeeklyShiftPlanRepository,
          useValue: {
            findById: jest.fn(),
            findByLocationAndWeek: jest.fn(),
            createDraft: jest.fn(),
            updateStatus: jest.fn(),
            locationExists: jest.fn(),
          },
        },
        {
          provide: UserLocationsService,
          useValue: {
            resolveAllowedLocationIds: jest.fn(),
            assertLocationAllowed: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(WeeklyShiftPlanService);
    repository = module.get(WeeklyShiftPlanRepository);
    userLocationsService = module.get(UserLocationsService);

    repository.locationExists.mockResolvedValue(true);
    userLocationsService.resolveAllowedLocationIds.mockResolvedValue(null);
  });

  describe('getOrCreatePlan', () => {
    it('crea DRAFT si no existe', async () => {
      const created = buildPlan();
      repository.findByLocationAndWeek.mockResolvedValue(null);
      repository.createDraft.mockResolvedValue(created);

      const result = await service.getOrCreatePlan(tenantId, owner, locationId, weekStart);

      expect(repository.createDraft).toHaveBeenCalledWith(tenantId, locationId, weekStart);
      expect(result.status).toBe(WeeklyShiftPlanStatus.DRAFT);
    });

    it('devuelve existente sin recrear', async () => {
      const existing = buildPlan({ status: WeeklyShiftPlanStatus.APPROVED });
      repository.findByLocationAndWeek.mockResolvedValue(existing);

      const result = await service.getOrCreatePlan(tenantId, owner, locationId, weekStart);

      expect(repository.createDraft).not.toHaveBeenCalled();
      expect(result).toBe(existing);
    });

    it('404 si la sede no existe', async () => {
      repository.locationExists.mockResolvedValue(false);

      await expect(service.getOrCreatePlan(tenantId, owner, locationId, weekStart)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('submitForApproval', () => {
    it('DRAFT → PENDING_APPROVAL', async () => {
      const draft = buildPlan();
      const pending = buildPlan({ status: WeeklyShiftPlanStatus.PENDING_APPROVAL });
      repository.findById.mockResolvedValue(draft);
      repository.updateStatus.mockResolvedValue(pending);

      const result = await service.submitForApproval(tenantId, supervisor, draft.id);

      expect(result.status).toBe(WeeklyShiftPlanStatus.PENDING_APPROVAL);
      expect(repository.updateStatus).toHaveBeenCalledWith(
        tenantId,
        draft.id,
        expect.objectContaining({
          status: WeeklyShiftPlanStatus.PENDING_APPROVAL,
          submittedByUserId: supervisor.userId,
        }),
      );
    });

    it('REJECTED → PENDING_APPROVAL', async () => {
      const rejected = buildPlan({ status: WeeklyShiftPlanStatus.REJECTED });
      repository.findById.mockResolvedValue(rejected);
      repository.updateStatus.mockResolvedValue(
        buildPlan({ status: WeeklyShiftPlanStatus.PENDING_APPROVAL }),
      );

      await expect(service.submitForApproval(tenantId, supervisor, rejected.id)).resolves.toEqual(
        expect.objectContaining({ status: WeeklyShiftPlanStatus.PENDING_APPROVAL }),
      );
    });

    it('conflicto si ya está APPROVED', async () => {
      repository.findById.mockResolvedValue(buildPlan({ status: WeeklyShiftPlanStatus.APPROVED }));

      await expect(service.submitForApproval(tenantId, supervisor, 'plan-1')).rejects.toThrow(
        ConflictException,
      );
      await expect(service.submitForApproval(tenantId, supervisor, 'plan-1')).rejects.toThrow(
        WEEKLY_SHIFT_PLAN_INVALID_TRANSITION_MESSAGE,
      );
    });
  });

  describe('approve', () => {
    it('PENDING → APPROVED para MANAGER', async () => {
      repository.findById.mockResolvedValue(
        buildPlan({ status: WeeklyShiftPlanStatus.PENDING_APPROVAL }),
      );
      repository.updateStatus.mockResolvedValue(
        buildPlan({ status: WeeklyShiftPlanStatus.APPROVED }),
      );

      const result = await service.approve(tenantId, manager, 'plan-1');

      expect(result.status).toBe(WeeklyShiftPlanStatus.APPROVED);
    });

    it('forbidden para SUPERVISOR', async () => {
      await expect(service.approve(tenantId, supervisor, 'plan-1')).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.approve(tenantId, supervisor, 'plan-1')).rejects.toThrow(
        WEEKLY_SHIFT_PLAN_APPROVE_FORBIDDEN_MESSAGE,
      );
      expect(repository.findById).not.toHaveBeenCalled();
    });

    it('conflicto si no está PENDING', async () => {
      repository.findById.mockResolvedValue(buildPlan({ status: WeeklyShiftPlanStatus.DRAFT }));

      await expect(service.approve(tenantId, manager, 'plan-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('reject', () => {
    it('PENDING → REJECTED con motivo', async () => {
      repository.findById.mockResolvedValue(
        buildPlan({ status: WeeklyShiftPlanStatus.PENDING_APPROVAL }),
      );
      repository.updateStatus.mockResolvedValue(
        buildPlan({
          status: WeeklyShiftPlanStatus.REJECTED,
          rejectionReason: 'Falta cobertura viernes',
        }),
      );

      const result = await service.reject(tenantId, manager, 'plan-1', 'Falta cobertura viernes');

      expect(result.status).toBe(WeeklyShiftPlanStatus.REJECTED);
      expect(repository.updateStatus).toHaveBeenCalledWith(
        tenantId,
        'plan-1',
        expect.objectContaining({
          status: WeeklyShiftPlanStatus.REJECTED,
          rejectionReason: 'Falta cobertura viernes',
        }),
      );
    });

    it('400 si motivo vacío', async () => {
      await expect(service.reject(tenantId, manager, 'plan-1', '   ')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('forbidden para SUPERVISOR', async () => {
      await expect(service.reject(tenantId, supervisor, 'plan-1', 'motivo')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('assertPlanOperational', () => {
    it('true solo si APPROVED', async () => {
      repository.findByLocationAndWeek.mockResolvedValue(
        buildPlan({ status: WeeklyShiftPlanStatus.APPROVED }),
      );
      await expect(service.assertPlanOperational(tenantId, locationId, weekStart)).resolves.toBe(
        true,
      );

      repository.findByLocationAndWeek.mockResolvedValue(
        buildPlan({ status: WeeklyShiftPlanStatus.PENDING_APPROVAL }),
      );
      await expect(service.assertPlanOperational(tenantId, locationId, weekStart)).resolves.toBe(
        false,
      );

      repository.findByLocationAndWeek.mockResolvedValue(null);
      await expect(service.assertPlanOperational(tenantId, locationId, weekStart)).resolves.toBe(
        false,
      );
    });
  });
});
