import { test as base, expect, type Page } from '@playwright/test';
import { mockApi } from './api-mock';

// R-AR-12: la entrada canónica /app resuelve el workspace por rol.
const test = base.extend<{ apiMock: void }>({
  apiMock: [
    async ({ page }, use) => {
      await mockApi(page);
      await use();
    },
    { auto: true },
  ],
});

const login = async (page: Page, returnUrl: string, email: string) => {
  await page.goto(`/login?returnUrl=${encodeURIComponent(returnUrl)}`, {
    waitUntil: 'domcontentloaded',
  });
  await page.locator('#email').fill(email);
  await page.locator('#password').fill('secreto1');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.waitForURL(new RegExp(returnUrl.replace(/\//g, '\\/')), { timeout: 30_000 });
};

test('R-AR-12: /app envía al login sin sesión', async ({ page }) => {
  await page.goto('/app', { waitUntil: 'domcontentloaded' });
  await page.waitForURL(/\/login/, { timeout: 30_000 });
});

test('R-AR-12: workspace de empresa en /app/empresa', async ({ page }) => {
  await login(page, '/app/empresa/inicio', 'empresario@tienda.test');
  await expect(page.getByTestId('company-settings-page')).toBeVisible();
});

test('R-AR-12: workspace de tienda en /app/tienda', async ({ page }) => {
  await login(page, '/app/tienda/inicio', 'vendedor@tienda.test');
  await expect(page.getByTestId('dashboard-page')).toBeVisible();
});

test('R-AR-12: workspace de plataforma en /app/admin', async ({ page }) => {
  await login(page, '/app/admin/inventario', 'admin@tienda.test');
  await expect(page.getByTestId('admin-inventory-page')).toBeVisible();
});

test('R-AR-12: workspace de logística en /app/logistica', async ({ page }) => {
  await login(page, '/app/logistica/dashboard', 'empresario-logistica@tienda.test');
  await expect(page.getByTestId('logistica-dashboard')).toBeVisible();
});
