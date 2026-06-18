import { test, expect } from '@playwright/test';

test.describe('RBAC — Control de acceso por rol', () => {
  test.describe('Rol: Employee (sin permisos de admin)', () => {
    test.use({ storageState: 'e2e/.auth/employee.json' });

    test('botón "Crear Sede" no es visible para empleado', async ({ page }) => {
      await page.goto('/empresa/sedes');
      await expect(page.getByTestId('sede-create-btn')).not.toBeVisible();
    });

    test('ruta de configuración redirige a 403', async ({ page }) => {
      await page.goto('/configuracion');
      await expect(page).toHaveURL(/.*403|.*forbidden/);
    });
  });

  test.describe('Rol: Owner (permisos completos)', () => {
    test.use({ storageState: 'e2e/.auth/owner.json' });

    test('Owner puede ver el botón de crear sede', async ({ page }) => {
      await page.goto('/empresa/sedes');
      await expect(page.getByTestId('sede-create-btn')).toBeVisible();
    });
  });
});
