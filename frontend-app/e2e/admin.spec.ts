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

// R-E-29: el admin consulta las órdenes globales, su detalle y avanza el
// estado logístico (`GET /orders/admin/todas`, `PATCH /orders/:id/estado`).
test('R-E-29: el admin avanza el estado de una orden', async ({ page }) => {
  await login(page, '/admin/pedidos');

  await expect(page.getByTestId('admin-orders-page')).toBeVisible();
  await expect(page.locator('[data-testid="admin-order-row"]')).toHaveCount(1);

  await page.getByTestId('admin-order-select-o-100').click();
  await expect(page.getByTestId('admin-order-detail')).toBeVisible();
  await expect(page.getByTestId('admin-order-timeline')).toBeVisible();

  await page.getByTestId('admin-order-target-status').selectOption('enviada');
  await page.getByTestId('admin-order-reason').fill('despacho a ruta');
  await page.getByTestId('admin-order-advance').click();

  await expect(page.getByTestId('admin-order-detail')).toContainText('Enviada');
});

// R-E-30: la plataforma no posee una flota global; un admin no puede entrar
// al módulo de logística contextual de empresa/tienda.
test('R-E-30: el admin no puede entrar a logística global', async ({ page }) => {
  await page.goto('/login?returnUrl=%2Flogistica%2Fenvios', { waitUntil: 'domcontentloaded' });
  await page.locator('#email').fill('admin@tienda.test');
  await page.locator('#password').fill('secreto1');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/admin\/inventario$/);
});

// R-E-32: el admin consulta el almacenamiento por empresa
// (`GET /admin/storage/tenants`), ajusta la cuota (`PATCH`) y reactiva un tenant.
test('R-E-32: el admin administra la cuota de almacenamiento', async ({ page }) => {
  await login(page, '/admin/almacenamiento');

  await expect(page.getByTestId('admin-storage-page')).toBeVisible();
  await expect(page.locator('[data-testid="storage-row"]')).toHaveCount(2);
  await expect(page.getByTestId('storage-row').first()).toContainText('t-tenant-1');

  await page.getByTestId('storage-quota-input-tenant-1').fill('6');
  await page.getByTestId('storage-save-tenant-1').click();
  await expect(page.getByTestId('storage-row').first()).toContainText('6.00 GB');

  await page.getByTestId('storage-toggle-tenant-2').click();
  await expect(page.getByTestId('storage-status-tenant-2')).toContainText('Activo');
});
