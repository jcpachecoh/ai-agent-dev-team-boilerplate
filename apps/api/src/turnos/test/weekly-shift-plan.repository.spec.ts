import { Test, TestingModule } from '@nestjs/testing';
import { WeeklyShiftPlanStatus } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { WeeklyShiftPlanRepository } from '../repository/weekly-shift-plan.repository';

const TENANT = 'tenant-1';
const LOCATION = 'loc-1';
const WEEK_START = new Date('2026-07-20T00:00:00.000Z');

function row(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'plan-1',
    tenantId: TENANT,
    locationId: LOCATION,
    weekStart: WEEK_START,
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
    ...overrides,
  };
}

describe('WeeklyShiftPlanRepository', () => {
  let repository: WeeklyShiftPlanRepository;
  let prisma: {
    weeklyShiftPlan: Record<string, jest.Mock>;
    location: Record<string, jest.Mock>;
  };

  beforeEach(async () => {
    prisma = {
      weeklyShiftPlan: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      location: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [WeeklyShiftPlanRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();

    repository = module.get(WeeklyShiftPlanRepository);
  });

  it('findById filtra por tenantId', async () => {
    prisma.weeklyShiftPlan.findFirst.mockResolvedValue(row());

    const result = await repository.findById(TENANT, 'plan-1');

    expect(prisma.weeklyShiftPlan.findFirst).toHaveBeenCalledWith({
      where: { id: 'plan-1', tenantId: TENANT },
    });
    expect(result?.status).toBe(WeeklyShiftPlanStatus.DRAFT);
  });

  it('createDraft crea plan en DRAFT', async () => {
    prisma.weeklyShiftPlan.create.mockResolvedValue(row());

    const result = await repository.createDraft(TENANT, LOCATION, WEEK_START);

    expect(prisma.weeklyShiftPlan.create).toHaveBeenCalledWith({
      data: {
        tenantId: TENANT,
        locationId: LOCATION,
        weekStart: WEEK_START,
        status: 'DRAFT',
      },
    });
    expect(result.status).toBe(WeeklyShiftPlanStatus.DRAFT);
  });

  it('findByLocationAndWeek usa unique tenant+location+weekStart', async () => {
    prisma.weeklyShiftPlan.findUnique.mockResolvedValue(
      row({ status: WeeklyShiftPlanStatus.APPROVED }),
    );

    const result = await repository.findByLocationAndWeek(TENANT, LOCATION, WEEK_START);

    expect(prisma.weeklyShiftPlan.findUnique).toHaveBeenCalledWith({
      where: {
        tenantId_locationId_weekStart: {
          tenantId: TENANT,
          locationId: LOCATION,
          weekStart: WEEK_START,
        },
      },
    });
    expect(result?.status).toBe(WeeklyShiftPlanStatus.APPROVED);
  });

  it('findByLocationAndWeek retorna null si no existe', async () => {
    prisma.weeklyShiftPlan.findUnique.mockResolvedValue(null);
    await expect(
      repository.findByLocationAndWeek(TENANT, LOCATION, WEEK_START),
    ).resolves.toBeNull();
  });

  it('updateStatus no actualiza si el plan no pertenece al tenant', async () => {
    prisma.weeklyShiftPlan.findFirst.mockResolvedValue(null);

    const result = await repository.updateStatus(TENANT, 'plan-x', {
      status: WeeklyShiftPlanStatus.APPROVED,
    });

    expect(result).toBeNull();
    expect(prisma.weeklyShiftPlan.update).not.toHaveBeenCalled();
  });

  it('updateStatus persiste transición de estado', async () => {
    prisma.weeklyShiftPlan.findFirst.mockResolvedValue({ id: 'plan-1' });
    prisma.weeklyShiftPlan.update.mockResolvedValue(
      row({ status: WeeklyShiftPlanStatus.PENDING_APPROVAL, submittedByUserId: 'user-1' }),
    );

    const result = await repository.updateStatus(TENANT, 'plan-1', {
      status: WeeklyShiftPlanStatus.PENDING_APPROVAL,
      submittedByUserId: 'user-1',
      submittedAt: new Date('2026-07-16T12:00:00.000Z'),
    });

    expect(prisma.weeklyShiftPlan.update).toHaveBeenCalled();
    expect(result?.status).toBe(WeeklyShiftPlanStatus.PENDING_APPROVAL);
  });

  it('locationExists exige sede activa del tenant', async () => {
    prisma.location.findFirst.mockResolvedValue({ id: LOCATION });

    await expect(repository.locationExists(TENANT, LOCATION)).resolves.toBe(true);
    expect(prisma.location.findFirst).toHaveBeenCalledWith({
      where: { id: LOCATION, tenantId: TENANT, deletedAt: null },
      select: { id: true },
    });
  });
});
