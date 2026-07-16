import { Test, TestingModule } from '@nestjs/testing';

import { DailyCostCenterRepository } from '../repository/daily-cost-center.repository';
import { RotanteProrationService } from '../service/rotante-proration.service';

const TENANT = 'tenant-1';
const EMPLOYEE = 'emp-rotante-1';
const PERIOD_START = new Date('2026-07-01');
const PERIOD_END = new Date('2026-07-31');

function assignment(date: string, locationId: string, locationName: string) {
  return {
    id: `a-${date}-${locationId}`,
    tenantId: TENANT,
    employeeId: EMPLOYEE,
    date: new Date(date),
    locationId,
    locationName,
    shiftId: null,
    source: 'TURNO_ASIGNADO' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('RotanteProrationService', () => {
  let service: RotanteProrationService;
  let repository: jest.Mocked<DailyCostCenterRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RotanteProrationService,
        {
          provide: DailyCostCenterRepository,
          useValue: {
            findByTenantAndDateRange: jest.fn(),
            findPendingDays: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(RotanteProrationService);
    repository = module.get(DailyCostCenterRepository);
  });

  it('prorratea 6 días sede A + 4 días sede B sobre 1.000.000 → 600.000 / 400.000', async () => {
    repository.findByTenantAndDateRange.mockResolvedValue([
      ...Array.from({ length: 6 }, (_, i) => assignment(`2026-07-0${i + 1}`, 'loc-a', 'Sede A')),
      ...Array.from({ length: 4 }, (_, i) => assignment(`2026-07-1${i + 1}`, 'loc-b', 'Sede B')),
    ]);
    repository.findPendingDays.mockResolvedValue([]);

    const result = await service.prorate({
      tenantId: TENANT,
      employeeId: EMPLOYEE,
      periodStart: PERIOD_START,
      periodEnd: PERIOD_END,
      totalLaborCost: 1_000_000,
    });

    expect(result.totalDaysAssigned).toBe(10);
    expect(result.pendingDaysCount).toBe(0);
    const byLocation = new Map(result.allocations.map((a) => [a.locationId, a]));
    expect(byLocation.get('loc-a')?.proratedCost).toBe(600_000);
    expect(byLocation.get('loc-b')?.proratedCost).toBe(400_000);
    const sumAllocated = result.allocations.reduce((sum, a) => sum + a.proratedCost, 0);
    expect(sumAllocated).toBeCloseTo(1_000_000, 2);
  });

  it('10 días sede A + 5 días sede B → 66.67% / 33.33%, la suma cuadra con el costo total', async () => {
    repository.findByTenantAndDateRange.mockResolvedValue([
      ...Array.from({ length: 10 }, (_, i) =>
        assignment(`2026-07-${String(i + 1).padStart(2, '0')}`, 'loc-a', 'Sede A'),
      ),
      ...Array.from({ length: 5 }, (_, i) =>
        assignment(`2026-07-${String(i + 20).padStart(2, '0')}`, 'loc-b', 'Sede B'),
      ),
    ]);
    repository.findPendingDays.mockResolvedValue([]);

    const result = await service.prorate({
      tenantId: TENANT,
      employeeId: EMPLOYEE,
      periodStart: PERIOD_START,
      periodEnd: PERIOD_END,
      totalLaborCost: 1_500_000,
    });

    const byLocation = new Map(result.allocations.map((a) => [a.locationId, a]));
    expect(byLocation.get('loc-a')?.proportion).toBeCloseTo(10 / 15, 4);
    expect(byLocation.get('loc-b')?.proportion).toBeCloseTo(5 / 15, 4);
    const sumAllocated = result.allocations.reduce((sum, a) => sum + a.proratedCost, 0);
    expect(sumAllocated).toBe(1_500_000);
  });

  it('100% en una sola sede asigna todo el costo a esa sede', async () => {
    repository.findByTenantAndDateRange.mockResolvedValue([
      assignment('2026-07-01', 'loc-a', 'Sede A'),
      assignment('2026-07-02', 'loc-a', 'Sede A'),
    ]);
    repository.findPendingDays.mockResolvedValue([]);

    const result = await service.prorate({
      tenantId: TENANT,
      employeeId: EMPLOYEE,
      periodStart: PERIOD_START,
      periodEnd: PERIOD_END,
      totalLaborCost: 800_000,
    });

    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0]).toMatchObject({
      locationId: 'loc-a',
      proportion: 1,
      proratedCost: 800_000,
    });
  });

  it('sin asignaciones en el período: allocations vacío, no atribuye a sede falsa', async () => {
    repository.findByTenantAndDateRange.mockResolvedValue([]);
    repository.findPendingDays.mockResolvedValue([
      { employeeId: EMPLOYEE, date: new Date('2026-07-01') },
      { employeeId: EMPLOYEE, date: new Date('2026-07-02') },
    ]);

    const result = await service.prorate({
      tenantId: TENANT,
      employeeId: EMPLOYEE,
      periodStart: PERIOD_START,
      periodEnd: PERIOD_END,
      totalLaborCost: 500_000,
    });

    expect(result.totalDaysAssigned).toBe(0);
    expect(result.pendingDaysCount).toBe(2);
    expect(result.allocations).toEqual([]);
  });
});
