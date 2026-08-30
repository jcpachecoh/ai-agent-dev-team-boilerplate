import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { EmployeePositionsRepository } from '../repository/employee-positions.repository';
import { PrismaService } from '../../prisma/prisma.service';

describe('EmployeePositionsRepository', () => {
  let repository: EmployeePositionsRepository;
  let findMany: jest.Mock;
  let findFirst: jest.Mock;
  let findUnique: jest.Mock;
  let create: jest.Mock;
  let update: jest.Mock;
  let count: jest.Mock;
  let historyFindMany: jest.Mock;
  let historyUpdateMany: jest.Mock;
  let historyCreate: jest.Mock;

  const tenantId = 'tenant-1';
  const mockPositionRow = {
    id: 'pos-1',
    tenantId,
    title: 'Contador',
    area: 'Finanzas',
    baseSalaryRange: new Prisma.Decimal('4500000'),
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
  };

  beforeEach(async () => {
    findMany = jest.fn().mockResolvedValue([mockPositionRow]);
    findFirst = jest.fn().mockResolvedValue(mockPositionRow);
    findUnique = jest.fn();
    create = jest.fn().mockResolvedValue(mockPositionRow);
    update = jest.fn().mockResolvedValue({ ...mockPositionRow, isActive: false });
    count = jest.fn().mockResolvedValue(2);
    historyFindMany = jest.fn().mockResolvedValue([]);
    historyUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
    historyCreate = jest.fn().mockResolvedValue({
      id: 'hist-1',
      tenantId,
      employeeDetailsId: 'emp-1',
      positionId: 'pos-1',
      effectiveFrom: new Date(),
      effectiveTo: null,
      changedBy: 'user-1',
      createdAt: new Date(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeePositionsRepository,
        {
          provide: PrismaService,
          useValue: {
            employeePosition: {
              findMany,
              findFirst,
              create,
              update,
            },
            employeeDetails: {
              count,
            },
            employeePositionHistory: {
              findMany: historyFindMany,
              updateMany: historyUpdateMany,
              create: historyCreate,
            },
          },
        },
      ],
    }).compile();

    repository = module.get<EmployeePositionsRepository>(EmployeePositionsRepository);
  });

  it('findAll returns active positions by default', async () => {
    const result = await repository.findAll(tenantId);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId, isActive: true },
      }),
    );
    expect(result[0].baseSalaryRange).toBe('4500000');
  });

  it('findAll includes inactive when requested', async () => {
    await repository.findAll(tenantId, { includeInactive: true });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId },
      }),
    );
  });

  it('findAll applies search filter', async () => {
    await repository.findAll(tenantId, { search: 'cont' });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.any(Array),
        }),
      }),
    );
  });

  it('findById returns null when not found', async () => {
    findFirst.mockResolvedValueOnce(null);

    const result = await repository.findById(tenantId, 'missing');

    expect(result).toBeNull();
  });

  it('findByTitle returns mapped record', async () => {
    const result = await repository.findByTitle(tenantId, 'Contador');

    expect(result?.title).toBe('Contador');
  });

  it('create persists with tenantId', async () => {
    await repository.create(tenantId, {
      title: 'Contador',
      area: 'Finanzas',
      baseSalaryRange: '4500000',
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tenantId, title: 'Contador' }),
      }),
    );
  });

  it('update applies partial fields', async () => {
    await repository.update(tenantId, 'pos-1', { title: 'Senior Contador' });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { title: 'Senior Contador' },
      }),
    );
  });

  it('deactivate sets isActive false', async () => {
    await repository.deactivate(tenantId, 'pos-1');

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { isActive: false },
      }),
    );
  });

  it('countActiveEmployeesByPosition filters active employees', async () => {
    await repository.countActiveEmployeesByPosition(tenantId, 'pos-1');

    expect(count).toHaveBeenCalledWith({
      where: {
        tenantId,
        positionId: 'pos-1',
        isActive: true,
        deletedAt: null,
      },
    });
  });

  it('findHistoryByEmployee orders by effectiveFrom desc', async () => {
    await repository.findHistoryByEmployee(tenantId, 'emp-1');

    expect(historyFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { effectiveFrom: 'desc' },
      }),
    );
  });

  it('closeOpenHistory updates open records', async () => {
    const effectiveTo = new Date();
    await repository.closeOpenHistory(tenantId, 'emp-1', effectiveTo);

    expect(historyUpdateMany).toHaveBeenCalledWith({
      where: { tenantId, employeeDetailsId: 'emp-1', effectiveTo: null },
      data: { effectiveTo },
    });
  });

  it('createHistoryEntry inserts row', async () => {
    const effectiveFrom = new Date();
    await repository.createHistoryEntry({
      tenantId,
      employeeDetailsId: 'emp-1',
      positionId: 'pos-1',
      effectiveFrom,
      changedBy: 'user-1',
    });

    expect(historyCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId,
          employeeDetailsId: 'emp-1',
          positionId: 'pos-1',
          changedBy: 'user-1',
        }),
      }),
    );
  });
});
