import { TenantRepository } from '../repository/tenant.repository';

describe('TenantRepository', () => {
  const repository = new TenantRepository();

  it('finds tenant by id', async () => {
    await expect(repository.findById('t-1')).resolves.toEqual({ id: 't-1', name: 'Tenant t-1' });
  });

  it('returns empty list from findAll', async () => {
    await expect(repository.findAll()).resolves.toEqual([]);
  });
});
