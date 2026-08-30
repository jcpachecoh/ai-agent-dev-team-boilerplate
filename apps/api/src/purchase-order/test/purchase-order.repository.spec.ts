import { PurchaseOrderRepository } from '../repository/purchase-order.repository';

describe('PurchaseOrderRepository', () => {
  const repository = new PurchaseOrderRepository();

  it('returns empty collections', async () => {
    await expect(repository.findAll('tenant-1')).resolves.toEqual([]);
    await expect(repository.findById('po-1', 'tenant-1')).resolves.toBeNull();
  });
});
