import { Page } from '@playwright/test';

export async function waitForNetworkIdle(page: Page, timeout = 5_000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

export async function waitForToastToDisappear(page: Page, testId = 'toast-success'): Promise<void> {
  await page.waitForSelector(`[data-testid="${testId}"]`, { state: 'hidden' });
}
