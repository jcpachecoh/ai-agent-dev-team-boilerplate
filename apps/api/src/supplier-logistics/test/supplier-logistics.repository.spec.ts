import type { PrismaService } from '../../prisma/prisma.service';
import { SupplierLogisticsRepository } from '../repository/supplier-logistics.repository';

const txMock = {
  supplierLogistics: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  supplierLogisticsCoverage: {
    deleteMany: jest.fn(),
    createMany: jest.fn(),
  },
};

describe('SupplierLogisticsRepository', () => {
  const prismaMock = {
    supplierLogistics: {
      findFirst: jest.fn(),
    },
    user: { findFirst: jest.fn() },
    location: { findMany: jest.fn() },
    auditLog: { findMany: jest.fn() },
    $transaction: jest.fn(),
  };

  let repository: SupplierLogisticsRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new SupplierLogisticsRepository(prismaMock as unknown as PrismaService);
    prismaMock.$transaction.mockImplementation(async (cb: (tx: typeof txMock) => unknown) =>
      cb(txMock),
    );
  });

  it('findBySupplierId scopes by tenant and supplier', async () => {
    prismaMock.supplierLogistics.findFirst.mockResolvedValue(null);

    await repository.findBySupplierId('tenant-1', 'sup-1');

    expect(prismaMock.supplierLogistics.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: 'tenant-1', supplierId: 'sup-1' } }),
    );
  });

  it('upsert creates logistics and replaces coverage', async () => {
    txMock.supplierLogistics.findFirst.mockResolvedValue(null);
    txMock.supplierLogistics.create.mockResolvedValue({ id: 'log-1' });
    txMock.supplierLogistics.findUniqueOrThrow.mockResolvedValue({
      id: 'log-1',
      tenantId: 'tenant-1',
      supplierId: 'sup-1',
      deliveryDays: [1],
      receptionResponsibleUser: null,
      coverageLocations: [],
    });

    await repository.upsert({
      tenantId: 'tenant-1',
      supplierId: 'sup-1',
      data: { deliveryDays: [1, 2], coverageLocationIds: ['loc-1'] },
      status: 'DRAFT',
    });

    expect(txMock.supplierLogisticsCoverage.deleteMany).toHaveBeenCalled();
    expect(txMock.supplierLogisticsCoverage.createMany).toHaveBeenCalled();
  });

  it('findHistory filters by entity type', async () => {
    prismaMock.auditLog.findMany.mockResolvedValue([]);

    await repository.findHistory('tenant-1', 'log-1');

    expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ entityType: 'SupplierLogistics', entityId: 'log-1' }),
      }),
    );
  });
});
