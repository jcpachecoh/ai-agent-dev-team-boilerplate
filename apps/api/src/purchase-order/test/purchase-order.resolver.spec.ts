import { NotImplementedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseOrderResolver } from '../resolver/purchase-order.resolver';
import { PurchaseOrderService } from '../service/purchase-order.service';

const tenantId = 'tenant-1';
const mockPurchaseOrder = {
  id: 'po-1',
  tenantId,
  status: 'DRAFT',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const serviceMock = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
};

describe('PurchaseOrderResolver', () => {
  let resolver: PurchaseOrderResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PurchaseOrderResolver, { provide: PurchaseOrderService, useValue: serviceMock }],
    }).compile();

    resolver = module.get<PurchaseOrderResolver>(PurchaseOrderResolver);
    jest.clearAllMocks();
  });

  it('delegates purchaseOrders to the service', async () => {
    serviceMock.findAll.mockResolvedValue([mockPurchaseOrder]);

    const result = await resolver.purchaseOrders({
      req: { headers: { 'x-tenant-id': tenantId } },
    } as never);

    expect(result).toEqual([mockPurchaseOrder]);
    expect(serviceMock.findAll).toHaveBeenCalledWith(tenantId);
  });

  it('delegates purchaseOrder to the service', async () => {
    serviceMock.findById.mockResolvedValue(mockPurchaseOrder);

    const result = await resolver.purchaseOrder(
      { req: { headers: { 'x-tenant-id': tenantId } } } as never,
      'po-1',
    );

    expect(result).toEqual(mockPurchaseOrder);
    expect(serviceMock.findById).toHaveBeenCalledWith('po-1', tenantId);
  });

  it('propagates not implemented createPurchaseOrder', async () => {
    serviceMock.create.mockRejectedValue(
      new NotImplementedException('Purchase order creation is not yet implemented'),
    );

    await expect(
      resolver.createPurchaseOrder({ req: { headers: { 'x-tenant-id': tenantId } } } as never),
    ).rejects.toThrow(NotImplementedException);
  });
});
