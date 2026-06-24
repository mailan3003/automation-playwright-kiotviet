import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export async function saveScreenshot(page: Page, name: string): Promise<void> {
  const dir = path.join('test-results', 'screenshots');
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${name}-${Date.now()}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
}

export function loadTestData<T>(fileName: string): T {
  const filePath = path.join('test-data', fileName);
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as T;
}

export async function waitForNetworkIdle(page: Page, timeout = 5000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}
