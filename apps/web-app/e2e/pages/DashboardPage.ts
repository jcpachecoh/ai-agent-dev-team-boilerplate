import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly sidebar: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;
  readonly tenantBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.getByTestId('sidebar');
    this.userMenu = page.getByTestId('user-menu');
    this.logoutButton = page.getByTestId('logout-button');
    this.tenantBadge = page.getByTestId('tenant-badge');
  }

  async goto() {
    await this.page.goto('/dashboard');
    await expect(this.sidebar).toBeVisible();
  }

  async logout() {
    await this.userMenu.click();
    await this.logoutButton.click();
    await this.page.waitForURL('**/login');
  }

  async expectTenant(tenantName: string) {
    await expect(this.tenantBadge).toContainText(tenantName);
  }
}
