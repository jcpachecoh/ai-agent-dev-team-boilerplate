import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { SupplyItemsRepository } from '../repository/supplyitems.repository';

const tenantId = 'tenant-1';
const item = {
  id: 'item-1',
  tenantId,
  nombre: 'Tomato',
  codigoInterno: 'TOM-1',
  unidadBase: 'KILOGRAMS',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const prismaMock = {
  supplyItem: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('SupplyItemsRepository', () => {
  let repository: SupplyItemsRepository;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupplyItemsRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    repository = module.get(SupplyItemsRepository);
  });

  it('finds one supply item scoped by tenant', async () => {
    prismaMock.supplyItem.findFirst.mockResolvedValue(item);

    await expect(repository.findOne(tenantId, 'item-1')).resolves.toEqual(item);
  });

  it('findAll applies search filter and pagination', async () => {
    prismaMock.supplyItem.findMany.mockResolvedValue([item]);

    await expect(repository.findAll(tenantId, { search: 'tom', limit: 25 })).resolves.toEqual([
      item,
    ]);
    expect(prismaMock.supplyItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId, isActive: true }),
        take: 25,
      }),
    );
  });
});
