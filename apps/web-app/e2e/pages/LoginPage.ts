import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByRole('textbox', { name: /correo electrónico/i });
    this.passwordInput = page.locator('input[name="password"]');
    this.submitButton = page.getByRole('button', { name: /acceder al sistema/i });
    this.errorMessage = page.getByRole('alert');
  }

  async goto(): Promise<void> {
    const baseURL = process.env.BASE_URL ?? 'http://localhost:5173';
    await this.page.goto(new URL('/login', baseURL).toString());
    await expect(this.emailInput).toBeVisible();
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectError(message: string): Promise<void> {
    await expect(this.errorMessage).toContainText(message);
  }
}
