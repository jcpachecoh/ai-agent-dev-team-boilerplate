import { test as setup } from '@playwright/test';

import { LoginPage } from '../pages/LoginPage';

setup('authenticate as admin', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.login(process.env.TEST_USER_ADMIN_EMAIL!, process.env.TEST_USER_ADMIN_PASSWORD!);
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30_000 });
  await page.context().storageState({ path: 'e2e/.auth/admin.json' });
});

setup('authenticate as owner', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.login(process.env.TEST_USER_OWNER_EMAIL!, process.env.TEST_USER_OWNER_PASSWORD!);
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30_000 });
  await page.context().storageState({ path: 'e2e/.auth/owner.json' });
});

setup('authenticate as employee', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.login(
    process.env.TEST_USER_EMPLOYEE_EMAIL!,
    process.env.TEST_USER_EMPLOYEE_PASSWORD!,
  );
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30_000 });
  await page.context().storageState({ path: 'e2e/.auth/employee.json' });
});
