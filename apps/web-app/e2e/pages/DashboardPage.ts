import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly sidebar: Locator;
  readonly userMenuTrigger: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.getByRole('complementary', { name: 'Navegación principal' });
    this.userMenuTrigger = page.locator('button[aria-haspopup="menu"]');
    this.logoutButton = page.getByRole('menuitem', { name: /cerrar sesión/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
    await expect(this.sidebar).toBeVisible();
  }

  async logout(): Promise<void> {
    await this.userMenuTrigger.click();
    await this.logoutButton.click();
    await this.page.waitForURL('**/login');
  }
}
