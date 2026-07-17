import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { EmployeeCatalogType } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { EmployeeCatalogRepository } from '../repository/employee-catalog.repository';

describe('EmployeeCatalogRepository', () => {
  let repository: EmployeeCatalogRepository;
  let findMany: jest.Mock;
  let findFirst: jest.Mock;
  let create: jest.Mock;
  let updateMany: jest.Mock;
  let count: jest.Mock;

  beforeEach(async () => {
    findMany = jest.fn().mockResolvedValue([]);
    findFirst = jest.fn().mockResolvedValue(null);
    create = jest.fn();
    updateMany = jest.fn().mockResolvedValue({ count: 1 });
    count = jest.fn().mockResolvedValue(0);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeCatalogRepository,
        {
          provide: PrismaService,
          useValue: {
            employeeCatalogOption: {
              findMany,
              findFirst,
              create,
              updateMany,
            },
            overtimeRequest: { count },
          },
        },
      ],
    }).compile();

    repository = module.get(EmployeeCatalogRepository);
  });

  it('filters by tenantId, isActive and optional type (active-only default)', async () => {
    const tenantId = 'tenant-1';
    await repository.findAll(tenantId, { type: EmployeeCatalogType.AREA });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId,
          isActive: true,
          type: EmployeeCatalogType.AREA,
        },
      }),
    );
  });

  it('includeInactive omite filtro isActive', async () => {
    await repository.findAll('tenant-1', {
      type: EmployeeCatalogType.OVERTIME_REASON,
      includeInactive: true,
    });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: 'tenant-1',
          type: EmployeeCatalogType.OVERTIME_REASON,
        },
      }),
    );
  });

  it('findActiveByTypeAndPilaCode filtra por tenant, type y pilaCode', async () => {
    await repository.findActiveByTypeAndPilaCode('tenant-1', EmployeeCatalogType.ARL, '14-11');
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: 'tenant-1',
          type: EmployeeCatalogType.ARL,
          pilaCode: '14-11',
          isActive: true,
        },
      }),
    );
  });

  it('findActiveByIdAndType filtra por id, tenant, type e isActive', async () => {
    await repository.findActiveByIdAndType(
      'tenant-1',
      'opt-1',
      EmployeeCatalogType.OVERTIME_REASON,
    );
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'opt-1',
          tenantId: 'tenant-1',
          type: EmployeeCatalogType.OVERTIME_REASON,
          isActive: true,
        },
      }),
    );
  });

  it('findByTypeAndNameInsensitive usa mode insensitive scoped al tenant', async () => {
    await repository.findByTypeAndNameInsensitive(
      'tenant-1',
      EmployeeCatalogType.OVERTIME_REASON,
      'Aseo',
    );
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: 'tenant-1',
          type: EmployeeCatalogType.OVERTIME_REASON,
          name: { equals: 'Aseo', mode: 'insensitive' },
        },
      }),
    );
  });

  it('updateMany siempre filtra por tenantId (anti cross-tenant)', async () => {
    findFirst.mockResolvedValue({
      id: 'opt-1',
      tenantId: 'tenant-1',
      type: EmployeeCatalogType.OVERTIME_REASON,
      name: 'Aseo',
      pilaCode: null,
      isActive: false,
    });
    await repository.update('tenant-1', 'opt-1', { isActive: false });
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'opt-1', tenantId: 'tenant-1' },
        data: { isActive: false },
      }),
    );
  });

  it('countOvertimeRequestReferences filtra tenant + reasonOptionId', async () => {
    await repository.countOvertimeRequestReferences('tenant-1', 'reason-1');
    expect(count).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        reasonOptionId: 'reason-1',
        deletedAt: null,
      },
    });
  });

  it('create persiste tenant + type + name', async () => {
    create.mockResolvedValue({
      id: 'new',
      tenantId: 'tenant-1',
      type: EmployeeCatalogType.OVERTIME_REASON,
      name: 'Nuevo',
      pilaCode: null,
      isActive: true,
    });
    await repository.create('tenant-1', {
      type: EmployeeCatalogType.OVERTIME_REASON,
      name: 'Nuevo',
      pilaCode: null,
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          type: EmployeeCatalogType.OVERTIME_REASON,
          name: 'Nuevo',
          isActive: true,
        }),
      }),
    );
  });
});
