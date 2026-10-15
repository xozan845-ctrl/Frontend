import { test as base, expect, type Page } from '@playwright/test';

// Panel del vendedor (ADR-20): vive bajo `/vendedor/*` y en el modo `mock`
// (config `e2e`) opera con la cartera, el catálogo y los pedidos demo.
const login = async (page: Page, returnUrl: string) => {
  await page.goto(`/login?returnUrl=${encodeURIComponent(returnUrl)}`, {
    waitUntil: 'domcontentloaded',
  });
  // Convención E2E (R-E-12): el correo `vendedor@…` entra con rol vendedor.
  await page.locator('#email').fill('vendedor@tienda.test');
  await page.locator('#password').fill('secreto1');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.waitForURL(new RegExp(returnUrl.replace(/\//g, '\\/')), { timeout: 30_000 });
};

// R-E-9: cero errores o warnings de consola durante el flujo. El fixture es
// `auto`, así que aplica a todas las pruebas y falla ante cualquier warning.
const test = base.extend<{ consoleIssues: string[] }>({
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

// R-E-18: el vendedor registra un pedido completo desde el POS y lo ve al
// instante en "Pedidos recientes" (cliente de la cartera + 2 productos con
// stepper de cantidad).
test('R-E-18: el vendedor crea un pedido y lo ve en recientes', async ({ page }) => {
  await login(page, '/vendedor/ventas/nuevo');
  await expect(page.getByTestId('new-order-page')).toBeVisible();

  // Cliente de la cartera demo.
  await page.getByTestId('client-option-vc-1').click();
  await expect(page.getByTestId('selected-client')).toContainText('Carla López');

  // Dos productos en stock (el sexto producto del mock está agotado).
  const addButtons = page.locator('[data-testid="add-product"]:not([disabled])');
  await addButtons.nth(0).click();
  await addButtons.nth(1).click();
  await expect(page.locator('[data-testid^="draft-line-"]')).toHaveCount(2);

  // Stepper: sube la cantidad de la primera línea.
  const firstLine = page.locator('[data-testid^="draft-line-"]').first();
  await firstLine.getByTestId('stepper-plus').click();
  await expect(firstLine.getByTestId('stepper-value')).toHaveText('2');

  // Registro del pedido (mock: el siguiente id es PED-000126).
  await page.getByTestId('submit-order').click();

  await expect(page.getByTestId('order-link-PED-000126')).toBeVisible();
  await expect(page.locator('[data-testid="recent-order-row"]').first()).toContainText(
    'Carla López',
  );
});

// R-E-19: la lista de pedidos filtra por estado con conteo y el detalle del
// pedido seleccionado carga con sus líneas.
test('R-E-19: la lista de pedidos filtra por estado y el detalle carga', async ({ page }) => {
  await login(page, '/vendedor/pedidos');
  await expect(page.getByTestId('orders-page')).toBeVisible();

  // Lista completa del mock (4 pedidos demo).
  await expect(page.locator('[data-testid="recent-order-row"]')).toHaveCount(4);

  // Filtro por estado con conteo.
  await page.getByTestId('filter-pendiente').click();
  await expect(page.locator('[data-testid="recent-order-row"]')).toHaveCount(1);
  await expect(page.getByTestId('count-pendiente')).toHaveText('(1)');
  await expect(page.locator('[data-testid="recent-order-row"]').first()).toContainText(
    'Estética Bella',
  );

  // Detalle del pedido pendiente con sus dos líneas.
  await page.getByTestId('order-link-PED-000123').click();
  await expect(page).toHaveURL(/\/vendedor\/pedidos\/PED-000123/);
  await expect(page.getByRole('heading', { name: 'Pedido PED-000123' })).toBeVisible();
  await expect(page.locator('[data-testid="detail-line"]')).toHaveCount(2);
});
