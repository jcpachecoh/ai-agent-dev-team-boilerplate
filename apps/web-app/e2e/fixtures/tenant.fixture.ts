import { test as base } from '@playwright/test';

type TenantFixtures = {
  tenantId: string;
  tenantId2: string;
};

export const test = base.extend<TenantFixtures>({
  tenantId: async ({}, use) => {
    await use(process.env.TEST_TENANT_ID ?? 'test-tenant-uuid-001');
  },
  tenantId2: async ({}, use) => {
    await use(process.env.TEST_TENANT_ID_2 ?? 'test-tenant-uuid-002');
  },
});

export { expect } from '@playwright/test';
