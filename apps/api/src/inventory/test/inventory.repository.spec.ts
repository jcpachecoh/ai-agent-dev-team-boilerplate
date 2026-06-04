import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryRepository } from '../repository/inventory.repository';

const prismaMock = {
  supplyItem: {
    findMany: jest.fn(),
  },
};

describe('InventoryRepository', () => {
  let repository: InventoryRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InventoryRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    repository = module.get<InventoryRepository>(InventoryRepository);
    jest.clearAllMocks();
  });

  it('findActiveForDashboard queries active items for tenant', async () => {
    prismaMock.supplyItem.findMany.mockResolvedValue([]);

    await repository.findActiveForDashboard('tenant-1');

    expect(prismaMock.supplyItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: 'tenant-1', isActive: true },
      }),
    );
  });

  it('findActiveForAlerts queries active items for tenant', async () => {
    prismaMock.supplyItem.findMany.mockResolvedValue([]);

    await repository.findActiveForAlerts('tenant-1');

    expect(prismaMock.supplyItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: 'tenant-1', isActive: true },
      }),
    );
  });

  it('findActiveForReport queries active items for tenant', async () => {
    prismaMock.supplyItem.findMany.mockResolvedValue([]);

    await repository.findActiveForReport('tenant-1');

    expect(prismaMock.supplyItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: 'tenant-1', isActive: true },
      }),
    );
  });
});
