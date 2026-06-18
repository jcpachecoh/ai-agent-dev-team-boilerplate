import { chromium, FullConfig } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

async function globalSetup(_config: FullConfig) {
  const browser = await chromium.launch();

  // Admin
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  const loginAdmin = new LoginPage(adminPage);
  await loginAdmin.goto();
  await loginAdmin.login(
    process.env.TEST_USER_ADMIN_EMAIL!,
    process.env.TEST_USER_ADMIN_PASSWORD!,
  );
  await adminPage.waitForURL('**/dashboard');
  await adminContext.storageState({ path: 'e2e/.auth/admin.json' });

  // Owner
  const ownerContext = await browser.newContext();
  const ownerPage = await ownerContext.newPage();
  const loginOwner = new LoginPage(ownerPage);
  await loginOwner.goto();
  await loginOwner.login(
    process.env.TEST_USER_OWNER_EMAIL!,
    process.env.TEST_USER_OWNER_PASSWORD!,
  );
  await ownerPage.waitForURL('**/dashboard');
  await ownerContext.storageState({ path: 'e2e/.auth/owner.json' });

  await browser.close();
}

export default globalSetup;
