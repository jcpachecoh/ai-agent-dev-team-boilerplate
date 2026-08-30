import { test, expect } from '@playwright/test';

test.describe('RBAC — Control de acceso por rol', () => {
  test.describe('Rol: Nómina (sin acceso a Empresa)', () => {
    test.use({ storageState: 'e2e/.auth/employee.json' });

    test('no puede acceder al módulo de sedes', async ({ page }) => {
      await page.goto('/empresa/sedes');
      await expect(page).toHaveURL(/\/unauthorized/);
      await expect(page.getByText('Acceso denegado')).toBeVisible();
    });

    test('no puede acceder a configuración', async ({ page }) => {
      await page.goto('/settings');
      await expect(page).toHaveURL(/\/unauthorized/);
    });
  });

  test.describe('Rol: Owner (permisos completos)', () => {
    test.use({ storageState: 'e2e/.auth/owner.json' });

    test('Owner puede ver el botón de crear sede', async ({ page }) => {
      await page.goto('/empresa/sedes');
      await expect(page.getByRole('button', { name: 'Nueva sede' })).toBeVisible();
    });
  });
});
