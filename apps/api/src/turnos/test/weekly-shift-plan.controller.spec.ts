import { BadRequestException, type CanActivate } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { WeeklyShiftPlanStatus } from '@prisma/client';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { WeeklyShiftPlanController } from '../controller/weekly-shift-plan.controller';
import type { WeeklyShiftPlanRecord } from '../interfaces/weekly-shift-plan.interfaces';
import { WeeklyShiftPlanService } from '../service/weekly-shift-plan.service';

const allowGuard: CanActivate = { canActivate: (): boolean => true };

describe('WeeklyShiftPlanController', () => {
  let controller: WeeklyShiftPlanController;
  let service: jest.Mocked<WeeklyShiftPlanService>;

  const tenantId = 'tenant-1';
  const user = { tenantId, sub: 'user-1', roleCode: 'MANAGER' } as const;

  const plan: WeeklyShiftPlanRecord = {
    id: 'plan-1',
    tenantId,
    locationId: 'loc-1',
    weekStart: new Date('2026-07-13T00:00:00.000Z'),
    status: WeeklyShiftPlanStatus.DRAFT,
    submittedByUserId: null,
    submittedAt: null,
    approvedByUserId: null,
    approvedAt: null,
    rejectedByUserId: null,
    rejectedAt: null,
    rejectionReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WeeklyShiftPlanController],
      providers: [
        {
          provide: WeeklyShiftPlanService,
          useValue: {
            getOrCreatePlan: jest.fn(),
            submitForApproval: jest.fn(),
            approve: jest.fn(),
            reject: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(allowGuard)
      .overrideGuard(RolesGuard)
      .useValue(allowGuard)
      .overrideGuard(PermissionsGuard)
      .useValue(allowGuard)
      .compile();

    controller = module.get(WeeklyShiftPlanController);
    service = module.get(WeeklyShiftPlanService);
  });

  it('GET delega getOrCreatePlan con tenant del JWT', async () => {
    service.getOrCreatePlan.mockResolvedValue(plan);

    const result = await controller.getOrCreate(user as never, tenantId, {
      locationId: 'loc-1',
      weekStart: '2026-07-15',
    });

    expect(service.getOrCreatePlan).toHaveBeenCalledWith(
      tenantId,
      { userId: user.sub, roleCode: user.roleCode },
      'loc-1',
      new Date('2026-07-15T00:00:00.000Z'),
    );
    expect(result.weekStart).toBe('2026-07-13');
    expect(result.status).toBe(WeeklyShiftPlanStatus.DRAFT);
  });

  it('falla sin tenant', async () => {
    await expect(
      controller.getOrCreate({ sub: 'u', roleCode: 'OWNER' } as never, '', {
        locationId: 'loc-1',
        weekStart: '2026-07-13',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('POST submit / approve / reject delegan al service', async () => {
    service.submitForApproval.mockResolvedValue({
      ...plan,
      status: WeeklyShiftPlanStatus.PENDING_APPROVAL,
    });
    service.approve.mockResolvedValue({ ...plan, status: WeeklyShiftPlanStatus.APPROVED });
    service.reject.mockResolvedValue({
      ...plan,
      status: WeeklyShiftPlanStatus.REJECTED,
      rejectionReason: 'x',
    });

    await controller.submit(user as never, tenantId, 'plan-1');
    await controller.approve(user as never, tenantId, 'plan-1');
    await controller.reject(user as never, tenantId, 'plan-1', { reason: 'x' });

    expect(service.submitForApproval).toHaveBeenCalledWith(
      tenantId,
      { userId: user.sub, roleCode: user.roleCode },
      'plan-1',
    );
    expect(service.approve).toHaveBeenCalled();
    expect(service.reject).toHaveBeenCalledWith(
      tenantId,
      { userId: user.sub, roleCode: user.roleCode },
      'plan-1',
      'x',
    );
  });
});
