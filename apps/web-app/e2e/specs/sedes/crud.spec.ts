import { test, expect } from '@playwright/test';
import { SedesPage } from '../../pages/SedesPage';
import { faker } from '@faker-js/faker/locale/es';

test.describe.configure({ mode: 'serial' });

test.describe('Sedes — CRUD', () => {
  let sedesPage: SedesPage;
  let testSedeName: string;

  test.beforeEach(async ({ page }) => {
    sedesPage = new SedesPage(page);
    testSedeName = `Sede Test ${faker.string.alphanumeric(6)}`;
    await sedesPage.goto();
  });

  test('crear una nueva sede aparece en la tabla', async () => {
    await sedesPage.createSede(testSedeName, faker.location.streetAddress());
    await sedesPage.expectSedeInTable(testSedeName);
  });

  test('editar una sede actualiza el nombre en la tabla', async ({ page }) => {
    await sedesPage.createSede(testSedeName, faker.location.streetAddress());
    const updatedName = `${testSedeName} EDITADA`;

    const row = page
      .getByRole('table')
      .getByRole('row')
      .filter({ has: page.getByText(testSedeName, { exact: true }) })
      .first();
    await row.getByRole('button', { name: 'Editar sede' }).click();
    await page.getByPlaceholder('Ej: Sede Chapinero').fill(updatedName);
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.getByText('Cambios guardados.')).toBeVisible();

    await sedesPage.goto();
    await sedesPage.expectSedeInTable(updatedName);
    await sedesPage.expectSedeNotInTable(testSedeName);
  });

  test('desactivar una sede la marca como inactiva', async ({ page }) => {
    await sedesPage.createSede(testSedeName, faker.location.streetAddress());
    await sedesPage.deactivateSede(testSedeName);
    const row = page
      .getByRole('table')
      .getByRole('row')
      .filter({ has: page.getByText(testSedeName, { exact: true }) })
      .first();
    await expect(row.getByText('INACTIVO')).toBeVisible();
  });
});
