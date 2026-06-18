import { test, expect } from '@playwright/test';
import { SedesPage } from '../../pages/SedesPage';
import { faker } from '@faker-js/faker/locale/es';

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
    const row = sedesPage.sedeTable.getByRole('row', { name: testSedeName });
    await row.getByTestId('sede-edit-btn').click();
    await sedesPage.nameInput.clear();
    await sedesPage.nameInput.fill(updatedName);
    await sedesPage.saveButton.click();
    await sedesPage.expectSedeInTable(updatedName);
    await sedesPage.expectSedeNotInTable(testSedeName);
  });

  test('eliminar una sede la remueve de la tabla', async () => {
    await sedesPage.createSede(testSedeName, faker.location.streetAddress());
    await sedesPage.deleteSede(testSedeName);
    await sedesPage.expectSedeNotInTable(testSedeName);
  });

  test('soft delete — sede eliminada no aparece en listado activo', async ({ page }) => {
    await sedesPage.createSede(testSedeName, faker.location.streetAddress());
    await sedesPage.deleteSede(testSedeName);
    await page.reload();
    await sedesPage.expectSedeNotInTable(testSedeName);
  });
});
