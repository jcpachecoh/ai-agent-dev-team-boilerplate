import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

test.describe('Autenticación — Login', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('login exitoso con credenciales válidas redirige al dashboard', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(
      process.env.TEST_USER_ADMIN_EMAIL!,
      process.env.TEST_USER_ADMIN_PASSWORD!,
    );
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('login fallido muestra mensaje de error', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login('wrong@email.com', 'wrongpassword');
    await login.expectError('Credenciales inválidas');
  });

  test('campos vacíos muestran validación', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('login-email-error')).toBeVisible();
    await expect(page.getByTestId('login-password-error')).toBeVisible();
  });

  test('redirige a /login si accede a ruta protegida sin auth', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });
});
