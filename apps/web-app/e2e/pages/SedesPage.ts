import { Page, Locator, expect } from '@playwright/test';

export class SedesPage {
  readonly page: Page;
  readonly createButton: Locator;
  readonly sedeTable: Locator;
  readonly nameInput: Locator;
  readonly addressInput: Locator;
  readonly saveButton: Locator;
  readonly deleteConfirmButton: Locator;
  readonly successToast: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createButton = page.getByTestId('sede-create-btn');
    this.sedeTable = page.getByTestId('sede-table');
    this.nameInput = page.getByTestId('sede-name-input');
    this.addressInput = page.getByTestId('sede-address-input');
    this.saveButton = page.getByTestId('sede-save-btn');
    this.deleteConfirmButton = page.getByTestId('sede-delete-confirm');
    this.successToast = page.getByTestId('toast-success');
  }

  async goto() {
    await this.page.goto('/empresa/sedes');
    await expect(this.sedeTable).toBeVisible();
  }

  async createSede(name: string, address: string) {
    await this.createButton.click();
    await this.nameInput.fill(name);
    await this.addressInput.fill(address);
    await this.saveButton.click();
    await expect(this.successToast).toBeVisible();
  }

  async deleteSede(name: string) {
    const row = this.sedeTable.getByRole('row', { name });
    await row.getByTestId('sede-delete-btn').click();
    await this.deleteConfirmButton.click();
    await expect(this.successToast).toBeVisible();
  }

  async expectSedeInTable(name: string) {
    await expect(this.sedeTable.getByRole('row', { name })).toBeVisible();
  }

  async expectSedeNotInTable(name: string) {
    await expect(this.sedeTable.getByRole('row', { name })).not.toBeVisible();
  }
}
