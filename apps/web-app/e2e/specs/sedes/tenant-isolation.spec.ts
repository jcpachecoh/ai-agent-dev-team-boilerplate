import { test, expect } from '@playwright/test';
import { SedesPage } from '../../pages/SedesPage';
import { faker } from '@faker-js/faker/locale/es';

test.describe('Sedes — Aislamiento Multi-Tenant', () => {
  test('sede creada en tenant A no es visible en tenant B', async ({ browser }) => {
    const tenantASedeName = `Sede TenantA ${faker.string.alphanumeric(6)}`;

    const contextA = await browser.newContext({
      storageState: 'e2e/.auth/admin.json',
    });
    const pageA = await contextA.newPage();
    const sedesA = new SedesPage(pageA);
    await sedesA.goto();
    await sedesA.createSede(tenantASedeName, 'Calle 100 # 15-20, Bogotá');
    await sedesA.expectSedeInTable(tenantASedeName);

    const contextB = await browser.newContext({
      storageState: 'e2e/.auth/owner.json',
    });
    const pageB = await contextB.newPage();
    const sedesB = new SedesPage(pageB);
    await sedesB.goto();
    await sedesB.expectSedeNotInTable(tenantASedeName);

    await contextA.close();
    await contextB.close();
  });
});
