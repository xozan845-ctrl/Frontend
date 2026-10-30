import { test as base, expect, type Page } from '@playwright/test';
import { mockApi } from './api-mock';

const login = async (page: Page) => {
  await page.goto('/login?returnUrl=%2Fempresa%2Fproductos', { waitUntil: 'domcontentloaded' });
  await page.locator('#email').fill('empresario@tienda.test');
  await page.locator('#password').fill('secreto1');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.waitForURL((url) => url.pathname === '/empresa/productos', { timeout: 30_000 });
};

const test = base.extend<{ apiMock: void; consoleIssues: string[] }>({
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
        if (msg.type() === 'error' || msg.type() === 'warning') issues.push(msg.text());
      });
      page.on('pageerror', (error) => issues.push(error.message));
      await use(issues);
      expect(issues, issues.join('\n')).toEqual([]);
    },
    { auto: true },
  ],
});

test('R-PS-04: configuración de inventario', async ({ page }) => {
  await login(page);
  await page.getByTestId('inventory-settings').click();
  await expect(page.getByTestId('inventory-settings-modal')).toBeVisible();

  await page.getByTestId('inventory-cost-method').selectOption('fifo');
  await page.getByTestId('inventory-default-unit').fill('Caja');
  await page.getByTestId('save-inventory-settings').click();
  await expect(page.getByTestId('inventory-settings-modal')).toHaveCount(0);

  await page.getByTestId('inventory-settings').click();
  await expect(page.getByTestId('inventory-cost-method')).toHaveValue('fifo');
  await expect(page.getByTestId('inventory-default-unit')).toHaveValue('Caja');
});

test('R-PS-04: escaneo de código de barras', async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: /Escanear código/ }).click();
  await expect(page.getByTestId('scan-modal')).toBeVisible();

  await page.getByTestId('scan-code').fill('SKU-AUD-01');
  await page.getByTestId('scan-submit').click();
  await expect(page.getByTestId('scan-result')).toContainText('Ultra-Comfort Wireless Headphones');
});

test('R-PS-04: combos con componentes', async ({ page }) => {
  await login(page);
  await page.getByTestId('new-combo').click();
  await expect(page.getByTestId('combo-modal')).toBeVisible();

  await page.getByTestId('combo-name').fill('Combo Audio');
  await page.getByTestId('combo-sku').fill('COMBO-AUD-01');
  await page.getByTestId('combo-price').fill('250.00');
  await page
    .getByTestId('combo-component-0')
    .selectOption({ label: 'Ultra-Comfort Wireless Headphones · SKU-AUD-01' });
  await page.getByTestId('combo-quantity-0').fill('2');
  await page.getByTestId('save-combo').click();

  await expect(page.getByTestId('combo-row')).toHaveCount(1);
  await expect(page.getByTestId('combo-row')).toContainText('Combo Audio');

  // Reconstruye la vista y confirma que el combo vuelve del GET.
  await page.getByTestId('company-nav-inicio').click();
  await page.getByTestId('company-nav-productos').click();
  await expect(page.getByTestId('combo-row')).toHaveCount(1);

  await page.locator('[data-testid^="delete-combo-"]').click();
  await expect(page.getByTestId('combo-delete-dialog')).toBeVisible();
  await page.getByTestId('confirm-delete-combo').click();
  await expect(page.getByTestId('combos-empty')).toBeVisible();
});

test('R-PS-04: promociones', async ({ page }) => {
  await login(page);
  await page.getByTestId('new-promotion').click();
  await expect(page.getByTestId('promotion-modal')).toBeVisible();

  await page.getByTestId('promotion-name').fill('Descuento de temporada');
  await page.getByTestId('promotion-type').selectOption('descuento_porcentaje');
  await page.getByTestId('promotion-discount').fill('15');
  await page.getByTestId('promotion-from').fill('2026-10-01');
  await page.getByTestId('promotion-to').fill('2026-10-31');
  await page.getByTestId('save-promotion').click();

  await expect(page.getByTestId('promotion-row')).toHaveCount(1);
  await expect(page.getByTestId('promotion-row')).toContainText('Descuento de temporada');
  await expect(page.getByTestId('promotion-row')).toContainText('15 %');

  await page.locator('[data-testid^="delete-promotion-"]').click();
  await page.getByTestId('confirm-delete-promotion').click();
  await expect(page.getByTestId('promotions-empty')).toBeVisible();
});

test('R-PS-04: movimiento de inventario', async ({ page }) => {
  await login(page);
  await page.getByTestId('new-movement').click();
  await expect(page.getByTestId('inventory-movement-modal')).toBeVisible();

  await page.getByTestId('movement-type').selectOption('entrada');
  await page.getByTestId('movement-reason').fill('Compra de reposición');
  await page.getByTestId('movement-reference').fill('FAC-001');
  await page
    .getByTestId('movement-line-0')
    .selectOption({ label: 'Ultra-Comfort Wireless Headphones · SKU-AUD-01' });
  await page.getByTestId('movement-quantity-0').fill('4');
  await page.getByTestId('save-movement').click();

  await expect(page.getByTestId('movement-row')).toHaveCount(1);
  await expect(page.getByTestId('movement-row')).toContainText('Compra de reposición');
  await expect(page.getByTestId('movement-row')).toContainText('FAC-001');
});

test('R-PS-04: importación CSV con vista previa', async ({ page }) => {
  await login(page);
  await page.getByTestId('import-excel').click();
  await expect(page.getByTestId('import-products-modal')).toBeVisible();

  const csv = [
    'nombre,descripcion,categoria,sku,precio_venta,costo,stock_inicial,stock_minimo,codigo_barras,marca',
    'Producto Importado,Desde CSV,Demo,SKU-IMP-01,99.00,50.00,3,1,750999,ACME',
  ].join('\n');
  await page.getByTestId('import-file-input').setInputFiles({
    name: 'productos.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csv),
  });

  await expect(page.getByTestId('import-preview')).toContainText('Producto Importado');
  await page.getByTestId('confirm-import').click();
  await expect(page.getByTestId('import-result')).toContainText('1 importados');

  await page.getByTestId('cancel-import').click();
  await expect(
    page.getByTestId('catalog-row').filter({ hasText: 'Producto Importado' }),
  ).toHaveCount(1);
});
