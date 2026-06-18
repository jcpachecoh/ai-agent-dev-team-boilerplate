import { Page, Locator, expect } from '@playwright/test';

export class SedesPage {
  readonly page: Page;
  readonly createButton: Locator;
  readonly sedeTable: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createButton = page.getByRole('button', { name: 'Nueva sede' });
    this.sedeTable = page.getByRole('table');
  }

  async goto(): Promise<void> {
    await this.page.goto('/empresa/sedes');
    await expect(this.page.getByRole('heading', { name: 'Sedes' })).toBeVisible();
  }

  async createSede(name: string, address: string, city = 'Bogotá'): Promise<void> {
    await this.createButton.click();
    await this.page.getByPlaceholder('Ej: Sede Chapinero').fill(name);
    await this.page.getByPlaceholder('Cra 13 # 63-40').fill(address);
    await this.page.getByPlaceholder('Nombre de la ciudad').fill(city);
    await this.page.getByRole('button', { name: 'Crear sede' }).click();
    await expect(this.page.getByText('Sede creada correctamente.')).toBeVisible();
    await expect(this.page.getByRole('heading', { name: 'Sedes' })).toBeVisible();
    await this.page.reload();
    await this.expectSedeInTable(name);
  }

  async deactivateSede(name: string): Promise<void> {
    const row = this.sedeTable
      .getByRole('row')
      .filter({ has: this.page.getByText(name, { exact: true }) })
      .first();
    await row.getByRole('button', { name: 'Desactivar sede' }).click();
    await expect(this.page.getByText('Estado de sede actualizado.')).toBeVisible();
  }

  async expectSedeInTable(name: string): Promise<void> {
    await expect(
      this.sedeTable
        .getByRole('row')
        .filter({ has: this.page.getByText(name, { exact: true }) })
        .first(),
    ).toBeVisible();
  }

  async expectSedeNotInTable(name: string): Promise<void> {
    await expect(
      this.sedeTable.getByRole('row').filter({ has: this.page.getByText(name, { exact: true }) }),
    ).toHaveCount(0);
  }
}
