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

// R-E-21: el header público no mezcla módulos internos; el CTA de la portada
// es la entrada al onboarding de propietario.
test('R-E-21: la portada separa el onboarding de los módulos internos', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  await expect(page.getByTestId('navbar-vendor-link')).toHaveCount(0);
  await expect(page.getByTestId('navbar-billing-link')).toHaveCount(0);
  await expect(page.getByTestId('navbar-logistica-link')).toHaveCount(0);

  await page.getByRole('button', { name: 'Crear empresa' }).click();
  await expect(page).toHaveURL(/\/crear-empresa/);
});

// R-E-22: un empresario sin empresa la crea desde el panel y ve su ficha
// (ADR-27). El mock de auth distingue `empresario@…` (R-E-12).
test('R-E-22: el empresario crea su empresa desde el workspace', async ({ page }) => {
  await login(page, '/empresa/inicio', 'empresario@tienda.test');

  await expect(page.getByTestId('create-company-form')).toBeVisible();
  await page.getByTestId('company-name').fill('Mi Empresa');
  await page.getByTestId('company-mode').selectOption('hibrida');
  await page.getByTestId('create-company-submit').click();

  await expect(page.getByTestId('company-card')).toBeVisible();
  await expect(page.getByTestId('company-card')).toContainText('Mi Empresa');
  await expect(page.getByTestId('company-logistics-mode')).toContainText('Híbrida');
});

// R-E-37: un vendedor puede crear un tenant logístico independiente; después
// del alta, `/logistica/**` queda asociado a ese tenant y no a la tienda.
test('R-E-37: el vendedor crea su empresa logística independiente', async ({ page }) => {
  await login(page, '/logistica/crear');

  await expect(page.getByTestId('logistics-company-onboarding')).toBeVisible();
  await page.getByTestId('logistics-company-name').fill('Rutas del Pacífico');
  await page.getByTestId('logistics-company-slug').fill('rutas-del-pacifico');
  await page.getByTestId('create-logistics-company').click();

  await expect(page).toHaveURL(/\/logistica\/dashboard/);
  await expect(page.getByTestId('logistica-dashboard')).toBeVisible();
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

// R-E-26: el empresario consulta el catálogo maestro y crea un producto desde
// su workspace de empresa (`GET/POST /catalog/productos`, ADR-32).
test('R-E-26: el empresario crea un producto en el catálogo', async ({ page }) => {
  await login(page, '/empresa/productos', 'empresario@tienda.test');

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

// R-E-40: el empresario administra servicios desde "Productos / Servicios"
// (ADR-52): alta, edición y eliminación con persistencia local por tenant.
test('R-E-40: el empresario administra servicios de la empresa', async ({ page }) => {
  await login(page, '/empresa/productos', 'empresario@tienda.test');

  await page.getByTestId('services-tab').click();
  await expect(page.getByTestId('services-empty')).toBeVisible();

  await page.getByTestId('new-service').click();
  await page.getByTestId('service-code').fill('SRV-001');
  await page.getByTestId('service-name').fill('Mantenimiento preventivo');
  await page.getByTestId('service-description').fill('Revisión completa de equipos');
  await page.getByTestId('service-category').fill('Soporte');
  await page.getByTestId('service-price').fill('1500.00');
  await page.getByTestId('service-duration').fill('90');
  await page.getByTestId('save-service').click();

  await expect(page.locator('[data-testid="service-row"]')).toHaveCount(1);
  await expect(page.locator('[data-testid="service-row"]').first()).toContainText(
    'Mantenimiento preventivo',
  );

  await page.locator('[data-testid^="edit-service-"]').first().click();
  await page.getByTestId('service-name').fill('Mantenimiento express');
  await page.getByTestId('save-service').click();
  await expect(page.locator('[data-testid="service-row"]').first()).toContainText(
    'Mantenimiento express',
  );

  await page.locator('[data-testid^="delete-service-"]').first().click();
  await expect(page.getByTestId('service-delete-dialog')).toBeVisible();
  await page.getByTestId('confirm-delete-service').click();
  await expect(page.getByTestId('services-empty')).toBeVisible();
});

// R-E-38: el empresario consulta y opera las ventas consolidadas de su empresa
// (`GET /orders/empresa` + `/empresarios/me/ventas`, ADR-45/ADR-54).
test('R-E-38: el empresario consulta las ventas de la empresa', async ({ page }) => {
  await login(page, '/empresa/ventas', 'empresario@tienda.test');

  await expect(page.getByTestId('company-sales-page')).toBeVisible();
  await expect(page.locator('[data-testid="company-sales-row"]')).toHaveCount(1);
  await expect(page.getByTestId('company-sales-kpi-month')).toContainText('C$2,300.00');
  await expect(page.getByTestId('company-sales-kpi-count')).toContainText('1');
  await expect(page.getByTestId('company-sales-row')).toContainText('Tienda Demo');

  await page.getByTestId('company-sales-period-today').click();
  await expect(page.getByTestId('company-sales-empty')).toBeVisible();
  await page.getByTestId('company-sales-period-month').click();
  await expect(page.locator('[data-testid="company-sales-row"]')).toHaveCount(1);

  await page.getByTestId('company-sales-new').click();
  await expect(page.getByTestId('company-new-sale-dialog')).toBeVisible();
  await expect(page.getByTestId('new-sale-step-1')).toBeVisible();
  await page.getByTestId('close-company-new-sale').click();
  await expect(page.getByTestId('company-new-sale-dialog')).toBeHidden();

  await page.getByTestId('company-sales-quick').click();
  await expect(page.getByTestId('company-quick-sale-dialog')).toBeVisible();
  await expect(page.getByTestId('quick-sale-scan')).toBeVisible();
  await page.getByTestId('close-company-quick-sale').click();
  await expect(page.getByTestId('company-quick-sale-dialog')).toBeHidden();
});

// R-E-39: el empresario consulta las tiendas de su empresa
// (`GET /empresarios/me/tiendas`, ADR-45).
test('R-E-39: el empresario consulta las tiendas de la empresa', async ({ page }) => {
  await login(page, '/empresa/tiendas', 'empresario@tienda.test');

  await expect(page.getByTestId('company-stores-page')).toBeVisible();
  await expect(page.locator('[data-testid="company-store-row"]')).toHaveCount(2);
  await expect(page.getByTestId('company-store-link-tienda-demo')).toHaveAttribute(
    'href',
    '/tienda/tienda-demo/shop',
  );
});

// R-E-31: el empresario consulta los envíos de su empresa
// (`GET /empresarios/me/envios`) y asigna la flota de un envío híbrido
// (`POST /empresarios/me/envios/:id/asignacion`, ADR-37).
test('R-E-31: el empresario asigna la flota de un envío híbrido', async ({ page }) => {
  await login(page, '/empresa/logistica/envios', 'empresario-logistica@tienda.test');

  await expect(page.getByTestId('envios-page')).toBeVisible();
  await expect(page.locator('[data-testid="envio-row"]')).toHaveCount(2);
  await expect(page.getByTestId('envio-provider-label-e-1')).toContainText('Sin asignar');
  await expect(page.getByTestId('envio-provider-e-1')).toBeVisible();

  await page.getByTestId('envio-provider-e-1').selectOption('empresa');
  await page.getByTestId('envio-assign-e-1').click();

  await expect(page.getByTestId('envio-provider-label-e-1')).toContainText('empresa');
});

// R-E-33: el empresario consulta las rutas de campo, completa una parada y
// cambia el estado de la ruta (`GET/PATCH /field/rutas`, ADR-39).
test('R-E-33: el empresario opera las rutas de campo', async ({ page }) => {
  await login(page, '/empresa/logistica/rutas', 'empresario-logistica@tienda.test');

  await expect(page.getByTestId('rutas-page')).toBeVisible();
  await expect(page.locator('[data-testid="ruta-row"]')).toHaveCount(1);
  await expect(page.getByTestId('ruta-detail')).toBeVisible();
  await expect(page.locator('[data-testid="parada-row"]')).toHaveCount(2);
  await expect(page.getByTestId('parada-status-parada-1')).toContainText('Pendiente');

  await page.getByTestId('parada-toggle-parada-1').click();
  await expect(page.getByTestId('parada-status-parada-1')).toContainText('Completada');

  await page.getByTestId('ruta-target-status').selectOption('en_curso');
  await page.getByTestId('ruta-save-status').click();
  await expect(page.getByTestId('ruta-status-ruta-1')).toContainText('En curso');
});

// R-E-34: el empresario consulta el personal de campo, su disponibilidad y su
// ubicación reportada (`GET /field/personal`, ADR-40).
test('R-E-34: el empresario consulta el personal de reparto', async ({ page }) => {
  await login(page, '/empresa/logistica/repartidores', 'empresario-logistica@tienda.test');

  await expect(page.getByTestId('personal-page')).toBeVisible();
  await expect(page.locator('[data-testid="personal-row"]')).toHaveCount(2);
  await expect(page.getByTestId('personal-detail')).toBeVisible();
  await expect(page.getByTestId('personal-detail')).toContainText('Ana Pérez');

  await page.getByTestId('personal-status-filter').selectOption('descansando');
  await expect(page.locator('[data-testid="personal-row"]')).toHaveCount(1);
  await page.getByTestId('personal-select-personal-2').click();
  await expect(page.getByTestId('personal-detail')).toContainText('Luis Méndez');
});

// R-E-35: el empresario consulta las incidencias de campo y actualiza su
// estado y resolución (`GET/PATCH /field/incidencias`, ADR-41).
test('R-E-35: el empresario gestiona una incidencia de campo', async ({ page }) => {
  await login(page, '/empresa/logistica/incidencias', 'empresario-logistica@tienda.test');

  await expect(page.getByTestId('incidencias-page')).toBeVisible();
  await expect(page.locator('[data-testid="incidencia-row"]')).toHaveCount(2);
  await expect(page.getByTestId('incidencia-detail')).toContainText('Llanta pinchada');

  await page.getByTestId('incidencias-status-filter').selectOption('abierta');
  await expect(page.locator('[data-testid="incidencia-row"]')).toHaveCount(1);

  await page.getByTestId('incidencia-target-status').selectOption('en_progreso');
  await page.getByTestId('incidencia-resolution').fill('En taller');
  await page.getByTestId('incidencia-save').click();
  await expect(page.getByTestId('incidencia-detail-status-incidencia-1')).toContainText(
    'En progreso',
  );
});

// R-E-36: el vendedor consulta su almacenamiento, sube un archivo prefirmado
// y elimina un objeto (ADR-42).
test('R-E-36: el vendedor sube y elimina archivos', async ({ page }) => {
  await login(page, '/vendedor/almacenamiento');

  await expect(page.getByTestId('storage-page')).toBeVisible();
  await expect(page.getByTestId('storage-used')).toContainText('1.50 GB');
  await expect(page.locator('[data-testid="storage-object-row"]')).toHaveCount(2);

  await page.getByTestId('storage-upload-file').setInputFiles({
    name: 'nuevo.png',
    mimeType: 'image/png',
    buffer: Buffer.from('hola'),
  });
  await page.getByTestId('storage-upload-folder').fill('productos');
  await page.getByTestId('storage-upload-description').fill('Subido en E2E');
  await page.getByTestId('storage-upload-submit').click();

  await expect(page.locator('[data-testid="storage-object-row"]')).toHaveCount(3);
  await expect(page.getByTestId('storage-table')).toContainText('nuevo.png');

  await page.getByTestId('storage-delete-objeto-1').click();
  await page.getByTestId('storage-delete-confirm-objeto-1').click();
  await expect(page.locator('[data-testid="storage-object-row"]')).toHaveCount(2);
  await expect(page.getByTestId('storage-table')).not.toContainText('foto.png');
});
