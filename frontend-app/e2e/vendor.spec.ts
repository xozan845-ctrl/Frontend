import { test as base, expect, type Page } from '@playwright/test';
import { mockApi } from './api-mock';

// Panel del vendedor (ADR-20): vive bajo `/vendedor/*`; en el entorno `e2e` la
// cartera, el catálogo y los pedidos salen de los fixtures de `api-mock.ts`.
const login = async (page: Page, returnUrl: string, email = 'vendedor@tienda.test') => {
  await page.goto(`/login?returnUrl=${encodeURIComponent(returnUrl)}`, {
    waitUntil: 'domcontentloaded',
  });
  // Convención E2E (R-E-12): `vendedor@…` entra con rol vendedor y
  // `empresario@…` con rol empresario.
  await page.locator('#email').fill(email);
  await page.locator('#password').fill('secreto1');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.waitForURL(new RegExp(returnUrl.replace(/\//g, '\\/')), { timeout: 30_000 });
};

// R-E-9: cero errores o warnings de consola durante el flujo. El fixture es
// `auto`, así que aplica a todas las pruebas y falla ante cualquier warning.
// `apiMock` (también `auto`) instala los fixtures del API antes de navegar.
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

// R-E-18: el vendedor registra un pedido completo desde el POS y lo ve al
// instante en "Pedidos recientes" (cliente de la cartera + 2 productos con
// stepper de cantidad).
test('R-E-18: el vendedor crea un pedido y lo ve en recientes', async ({ page }) => {
  await login(page, '/vendedor/ventas/nuevo');
  await expect(page.getByTestId('new-order-page')).toBeVisible();

  // Cliente de la cartera del fixture.
  await page.getByTestId('client-option-vc-1').click();
  await expect(page.getByTestId('selected-client')).toContainText('Carla López');

  // Dos productos en stock (el sexto producto del fixture está agotado).
  const addButtons = page.locator('[data-testid="add-product"]:not([disabled])');
  await addButtons.nth(0).click();
  await addButtons.nth(1).click();
  await expect(page.locator('[data-testid^="draft-line-"]')).toHaveCount(2);

  // Stepper: sube la cantidad de la primera línea.
  const firstLine = page.locator('[data-testid^="draft-line-"]').first();
  await firstLine.getByTestId('stepper-plus').click();
  await expect(firstLine.getByTestId('stepper-value')).toHaveText('2');

  // Registro del pedido (el fixture devuelve PED-000126 como siguiente id).
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

  // Lista completa del fixture (4 pedidos demo).
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

// R-E-21: el enlace "Vendedor" es visible sin sesión y guía del navbar al alta
// de vendedor (login → cuenta de vendedor) hasta entrar al panel (ADR-22).
test('R-E-21: el enlace de vendedor guía del navbar al alta y al panel', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  // Visible sin sesión: redirige al login conservando el destino.
  await page.getByTestId('navbar-vendor-link').click();
  await expect(page).toHaveURL(/\/login\?returnUrl=%2Fvendedor%2Finicio/);

  // El login ofrece crear la cuenta de vendedor.
  await expect(page.getByTestId('vendor-intent-notice')).toBeVisible();
  await page.getByRole('link', { name: 'Crea tu cuenta de vendedor' }).click();
  await expect(page).toHaveURL(/\/register\?.*rol=seller/);

  // Alta de vendedor: el mock (R-E-12) registra el rol y vuelve al panel.
  await page.locator('#name').fill('Vera Vendedora');
  await page.locator('#email').fill('vendedor.nuevo@tienda.test');
  await page.locator('#password').fill('secreto1');
  await page.getByRole('button', { name: 'Registrar Cuenta' }).click();

  await expect(page).toHaveURL(/\/vendedor\/inicio/);
  await expect(page.getByTestId('dashboard-page')).toBeVisible();
});

// R-E-22: un empresario sin empresa la crea desde el panel y ve su ficha
// (ADR-27). El mock de auth distingue `empresario@…` (R-E-12).
test('R-E-22: el empresario crea su empresa desde el panel', async ({ page }) => {
  await login(page, '/vendedor/empresa', 'empresario@tienda.test');

  await expect(page.getByTestId('create-company-form')).toBeVisible();
  await page.getByTestId('company-name').fill('Mi Empresa');
  await page.getByTestId('company-mode').selectOption('hibrida');
  await page.getByTestId('create-company-submit').click();

  await expect(page.getByTestId('company-card')).toBeVisible();
  await expect(page.getByTestId('company-card')).toContainText('Mi Empresa');
  await expect(page.getByTestId('company-logistics-mode')).toContainText('Híbrida');
});

// R-E-23: el vendedor consulta sus ofertas y ajusta el margen de venta
// (ADR-29). El mock devuelve la página real de `PaginaOfertasResponseDto`.
test('R-E-23: el vendedor ajusta el margen de una oferta', async ({ page }) => {
  await login(page, '/vendedor/productos');

  await expect(page.getByTestId('vendor-products-page')).toBeVisible();
  await expect(page.locator('[data-testid="offer-row"]')).toHaveCount(2);
  await expect(page.getByTestId('offers-page-indicator')).toContainText('Página 1 de 1');

  const firstRow = page.locator('[data-testid="offer-row"]').first();
  await expect(firstRow).toContainText('KPBM Shampoo Keratina');
  await expect(firstRow.getByTestId('offer-sale-price')).toContainText('207.00');

  await firstRow.getByTestId('offer-margin').fill('25');
  await page.getByTestId('save-offer-of-1').click();

  await expect(firstRow.getByTestId('offer-sale-price')).toContainText('225.00');
});

// R-E-24: el vendedor consulta la ficha de su tienda (`GET /vendedores/me/tienda`,
// ADR-31) y desde ahí accede a la tienda pública.
test('R-E-24: el vendedor consulta la ficha de su tienda', async ({ page }) => {
  await login(page, '/vendedor/tienda');

  await expect(page.getByTestId('vendor-store-page')).toBeVisible();
  await expect(page.getByTestId('store-name')).toContainText('Tienda Demo');
  await expect(page.getByTestId('store-description')).toContainText('Storefront de demostración');
  await expect(page.getByTestId('store-participation')).toContainText('100');

  await expect(page.getByTestId('store-public-link')).toHaveAttribute(
    'href',
    '/tienda/tienda-demo/shop',
  );
});

// R-E-26: el empresario consulta el catálogo maestro y crea un producto
// (`GET/POST /catalog/productos`, ADR-32).
test('R-E-26: el empresario crea un producto en el catálogo', async ({ page }) => {
  await login(page, '/vendedor/catalogo', 'empresario@tienda.test');

  await expect(page.getByTestId('catalog-page')).toBeVisible();
  await expect(page.locator('[data-testid="catalog-row"]')).toHaveCount(6);

  await page.getByTestId('new-catalog-product').click();
  await expect(page.getByTestId('catalog-form')).toBeVisible();
  await page.getByTestId('catalog-sku').fill('SKU-NUEVO-01');
  await page.getByTestId('catalog-name').fill('Producto Nuevo');
  await page.getByTestId('catalog-description').fill('Creado desde el catálogo');
  await page.getByTestId('catalog-category').fill('Demo');
  await page.getByTestId('catalog-price').fill('250.00');
  await page.getByTestId('catalog-stock').fill('7');
  await page.getByTestId('save-catalog-product').click();

  await expect(page.locator('[data-testid="catalog-row"]')).toHaveCount(7);
  await expect(page.locator('[data-testid="catalog-row"]').first()).toContainText('Producto Nuevo');
});

// R-E-31: el empresario consulta los envíos de su empresa
// (`GET /empresarios/me/envios`) y asigna la flota de un envío híbrido
// (`POST /empresarios/me/envios/:id/asignacion`, ADR-37).
test('R-E-31: el empresario asigna la flota de un envío híbrido', async ({ page }) => {
  await login(page, '/logistica/envios', 'empresario@tienda.test');

  await expect(page.getByTestId('envios-page')).toBeVisible();
  await expect(page.locator('[data-testid="envio-row"]')).toHaveCount(2);
  await expect(page.getByTestId('envio-provider-label-e-1')).toContainText('Sin asignar');
  await expect(page.getByTestId('envio-provider-e-1')).toBeVisible();

  await page.getByTestId('envio-provider-e-1').selectOption('empresa');
  await page.getByTestId('envio-assign-e-1').click();

  await expect(page.getByTestId('envio-provider-label-e-1')).toContainText('empresa');
});
