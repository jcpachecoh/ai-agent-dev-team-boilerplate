import { test, expect } from '@playwright/test';
import { DashboardPage } from '../../pages/DashboardPage';

test.describe('Navegación — Sidebar', () => {
  test('sidebar es visible en el dashboard', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await expect(dashboard.sidebar).toBeVisible();
  });

  test('sidebar contiene enlace a sedes', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.sidebar.getByRole('button', { name: /^empresa$/i }).click();
    await expect(dashboard.sidebar.getByRole('link', { name: 'Sedes' })).toBeVisible();
  });
});
