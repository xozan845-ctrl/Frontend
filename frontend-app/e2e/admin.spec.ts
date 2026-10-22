import { test as base, expect, type Page } from '@playwright/test';
import { mockApi } from './api-mock';

// Área de administración (ADR-33): el correo `admin@…` entra con rol admin por
// la convención del mock de auth (R-E-12).
const login = async (page: Page, returnUrl: string) => {
  await page.goto(`/login?returnUrl=${encodeURIComponent(returnUrl)}`, {
    waitUntil: 'domcontentloaded',
  });
  await page.locator('#email').fill('admin@tienda.test');
  await page.locator('#password').fill('secreto1');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.waitForURL((url) => url.pathname === returnUrl, { timeout: 30_000 });
};

// R-E-9: cero errores o warnings de consola durante el flujo. El fixture es
// `auto`, así que aplica a todas las pruebas y falla ante cualquier warning.
const test = base.extend<{ consoleIssues: string[]; apiMock: void }>({
  apiMock: [
    async ({ page }, use) => {
      await mockApi(page);
      await use();
    },
    { auto: true },
  ],
  consoleIssues: [
    async ({ page }, use) => {
      const issues: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
          issues.push(`${msg.type()}: ${msg.text()}`);
        }
      });
      page.on('pageerror', (err) => issues.push(`pageerror: ${err.message}`));

      await use(issues);

      expect(issues, `Problemas de consola (R-E-9):\n${issues.join('\n')}`).toEqual([]);
    },
    { auto: true },
  ],
});

// R-E-27: el admin consulta el inventario de bodega (`GET /admin/inventario`,
// ADR-33) y ve sus totales.
test('R-E-27: el admin consulta el inventario de bodega', async ({ page }) => {
  await login(page, '/admin/inventario');

  await expect(page.getByTestId('admin-inventory-page')).toBeVisible();
  await expect(page.locator('[data-testid="inventory-row"]')).toHaveCount(2);
  await expect(page.getByTestId('inventory-skus')).toContainText('2');
  await expect(page.getByTestId('inventory-stock')).toContainText('12');
  await expect(page.getByTestId('inventory-reserved')).toContainText('2');
  await expect(page.getByTestId('inventory-row').first()).toContainText('Teclado Mecánico');
});
