import { Test, TestingModule } from '@nestjs/testing';

import { SupplierLogisticsResolver } from '../resolver/supplier-logistics.resolver';
import { SupplierLogisticsService } from '../service/supplier-logistics.service';

describe('SupplierLogisticsResolver', () => {
  let resolver: SupplierLogisticsResolver;

  const serviceMock = {
    getHistory: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierLogisticsResolver,
        { provide: SupplierLogisticsService, useValue: serviceMock },
      ],
    }).compile();

    resolver = module.get(SupplierLogisticsResolver);
    jest.clearAllMocks();
  });

  it('returns logistics history for supplier', async () => {
    serviceMock.getHistory.mockResolvedValue([
      {
        id: 'audit-1',
        action: 'UPDATE',
        actorUserId: 'user-1',
        actorEmail: 'user@example.com',
        createdAt: new Date('2026-07-06'),
        changes: [{ field: 'leadTimeDays', old: 2, new: 5 }],
      },
    ]);

    const result = await resolver.supplierLogisticsHistory(
      { req: { headers: { 'x-tenant-id': 'tenant-1' } } } as never,
      'sup-1',
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.changes[0]?.field).toBe('leadTimeDays');
  });
});
