import { chromium } from '@playwright/test';

const baseURL = 'http://localhost:5173';
const email = 'mes-owner@palos-de-lena.dev';
const password = 'TestPass123!';

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
const page = await context.newPage();

page.on('pageerror', (err) => console.log('[pageerror]', err.message));

await page.goto(baseURL + '/login', { waitUntil: 'networkidle' });

const emailInput = page.getByRole('textbox', { name: /correo electrónico/i });
const passwordInput = page.locator('input[name="password"]');
const submitButton = page.getByRole('button', { name: /acceder al sistema/i });

await emailInput.fill(email);
await passwordInput.fill(password);
await submitButton.click();

await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
console.log('after login url=', page.url());

await page.goto(baseURL + '/payroll/attendance', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
console.log('attendance page url=', page.url());

await page.screenshot({ path: '/private/tmp/claude-501/-Users-nicolasriveros-Documents-Nicolas-Riveros-Emprendyup-restopsiq-platform/ac35ddf6-fd38-445f-bd4d-d38f88ec49d2/scratchpad/after-fix.png', fullPage: true });

const info = await page.evaluate(() => {
  const th = document.querySelector('table th');
  const td = document.querySelector('table td');
  const thead = document.querySelector('table thead');
  const bodyBg = getComputedStyle(document.body).backgroundColor;
  const get = (el) => el ? {
    background: getComputedStyle(el).backgroundColor,
    color: getComputedStyle(el).color,
  } : null;
  return { bodyBg, th: get(th), td: get(td), thead: get(thead) };
});
console.log('computed styles:', JSON.stringify(info, null, 2));

await browser.close();
