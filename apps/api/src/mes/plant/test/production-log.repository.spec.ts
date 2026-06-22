import { Test, TestingModule } from '@nestjs/testing';
import { ProductionLogEvent } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { ProductionLogRepository } from '../repository/production-log.repository';

const prismaMock = {
  productionLog: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('ProductionLogRepository', () => {
  let repository: ProductionLogRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductionLogRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    repository = module.get(ProductionLogRepository);
    jest.clearAllMocks();
  });

  it('append creates a production log row', async () => {
    prismaMock.productionLog.create.mockResolvedValue({ id: 'log-1' });

    await repository.append({
      tenantId: 'tenant-1',
      orderId: 'order-1',
      employeeId: 'op-1',
      workStationId: 'ws-1',
      event: ProductionLogEvent.ORDER_STARTED,
    });

    expect(prismaMock.productionLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        orderId: 'order-1',
        event: ProductionLogEvent.ORDER_STARTED,
      }),
    });
  });

  it('findByIdempotencyKey filters by tenant and key', async () => {
    prismaMock.productionLog.findFirst.mockResolvedValue(null);

    await repository.findByIdempotencyKey('tenant-1', 'key-1');

    expect(prismaMock.productionLog.findFirst).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', idempotencyKey: 'key-1' },
    });
  });
});
