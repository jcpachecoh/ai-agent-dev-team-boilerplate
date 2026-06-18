import { test, expect } from '@playwright/test';
import { DashboardPage } from '../../pages/DashboardPage';

test.describe('Autenticación — Logout', () => {
  test('logout redirige a /login', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.logout();
    await expect(page).toHaveURL(/.*login/);
  });

  test('después de logout no puede acceder a rutas protegidas', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.logout();
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });
});
