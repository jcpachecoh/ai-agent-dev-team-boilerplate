import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeCatalogType } from '@prisma/client';
import { EmployeeCatalogRepository } from '../repository/employee-catalog.repository';
import { PrismaService } from '../../prisma/prisma.service';

describe('EmployeeCatalogRepository', () => {
  let repository: EmployeeCatalogRepository;
  let findMany: jest.Mock;
  let findFirst: jest.Mock;

  beforeEach(async () => {
    findMany = jest.fn().mockResolvedValue([]);
    findFirst = jest.fn().mockResolvedValue(null);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeCatalogRepository,
        {
          provide: PrismaService,
          useValue: {
            employeeCatalogOption: {
              findMany,
              findFirst,
            },
          },
        },
      ],
    }).compile();

    repository = module.get<EmployeeCatalogRepository>(EmployeeCatalogRepository);
  });

  it('filters by tenantId, isActive and optional type', async () => {
    // Arrange
    const tenantId = 'tenant-1';
    findMany.mockResolvedValue([]);

    // Act
    await repository.findAll(tenantId, EmployeeCatalogType.AREA);

    // Assert
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
});
