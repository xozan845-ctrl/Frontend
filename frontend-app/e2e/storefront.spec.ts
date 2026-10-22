import { test as base, expect, type Page } from '@playwright/test';
import { mockApi } from './api-mock';

// El storefront es multi-tienda: todo vive bajo `/tienda/:storeId`. En el
// entorno `e2e` la API se responde con los fixtures de `api-mock.ts` (R-E-12).
const STORE = '/tienda/tienda-demo';

// Las páginas cargan imágenes externas (Unsplash) que pueden tardar; esperamos a
// que el DOM esté listo en lugar del evento `load` completo.
const open = (page: Page, url: string) => page.goto(url, { waitUntil: 'domcontentloaded' });

// Inicia sesión y vuelve a la ruta indicada (`returnUrl`).
const login = async (page: Page, returnUrl = `${STORE}/shop`) => {
  await open(page, `/login?returnUrl=${encodeURIComponent(returnUrl)}`);
  await page.locator('#email').fill('ana@tienda.com');
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

test('R-E-1: el catálogo de la tienda carga productos y filtra por categoría', async ({ page }) => {
  await open(page, `${STORE}/shop`);

  await expect(page.getByTestId('storefront-name')).toContainText('Tienda Demo');
  await expect(page.getByTestId('storefront-description')).toContainText(
    'Storefront de demostración',
  );

  const cards = page.locator('app-product-card');
  // Las ofertas del fixture son 6: 3 Electronics, 2 Fitness, 1 Accessories.
  await expect(cards).toHaveCount(6);
  await expect(cards.filter({ hasText: /fitness|accessories/i })).toHaveCount(3);

  await page.getByRole('button', { name: 'Electronics', exact: true }).click();

  await expect(cards).toHaveCount(3);
  await expect(cards.filter({ hasText: /fitness|accessories/i })).toHaveCount(0);
});

test('R-E-2: el detalle de producto muestra el producto seleccionado', async ({ page }) => {
  await open(page, `${STORE}/shop`);
  const name = (await page.locator('app-product-card h3').first().innerText()).trim();

  await page.locator('app-product-card h3').first().click();
  await page.waitForURL(/\/producto\//, { timeout: 30_000 });

  await expect(page.getByText(name, { exact: false }).first()).toBeVisible();
});

test('R-E-3: agregar al carrito actualiza el contador del navbar', async ({ page }) => {
  // Invitado: el carrito es local y se vuelca al servidor al iniciar sesión.
  await open(page, `${STORE}/shop`);

  await page.getByRole('button', { name: 'Añadir al Carrito' }).first().click();

  await expect(page.getByLabel('Carrito').first()).toContainText('1');
});

test('R-E-4: el checkout está protegido por el guard de sesión', async ({ page }) => {
  await open(page, `${STORE}/checkout`);

  await expect(page).toHaveURL(/\/login/);
});

test('R-E-5: login habilita el checkout', async ({ page }) => {
  await login(page, `${STORE}/shop`);

  await expect(page.getByRole('button', { name: 'Salir' })).toBeVisible();

  // Navegación intra-app (SPA) hasta el checkout, protegido pero con sesión.
  await page.getByRole('button', { name: 'Añadir al Carrito' }).first().click();
  await page.getByLabel('Carrito').first().click();
  await page.getByRole('button', { name: 'Procesar Orden' }).click();

  await expect(page).toHaveURL(/\/checkout/);
});

test('R-E-6: la wishlist persiste entre recargas', async ({ page }) => {
  await open(page, `${STORE}/shop`);

  // Navegación intra-app al detalle y alta en la wishlist.
  await page.locator('app-product-card h3').first().click();
  await page.waitForURL(/\/producto\//, { timeout: 30_000 });
  await page.getByRole('button', { name: 'Añadir a favoritos' }).click();

  await expect(page.getByLabel('Lista de deseos').first()).toContainText('1');

  await page.getByLabel('Lista de deseos').first().click();
  await expect(page).toHaveURL(/\/wishlist/);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByLabel('Lista de deseos').first()).toContainText('1');
});

test('R-E-7: la búsqueda autocompleta ofrece el producto', async ({ page }) => {
  await open(page, `${STORE}/shop`);

  await page.getByPlaceholder('Buscar productos, categorías...').fill('keyboard');

  const option = page.locator(`#search-dropdown a[href^="${STORE}/producto/"]`).first();
  await expect(option).toBeVisible();
  await expect(option).toContainText('Keyboard', { ignoreCase: true });

  const href = await option.getAttribute('href');
  await open(page, href as string);

  await expect(page).toHaveURL(/\/producto\//);
});

test('R-E-8: una ruta inexistente muestra el 404', async ({ page }) => {
  await open(page, '/ruta-que-no-existe');

  await expect(page.getByText('404 - Página no encontrada')).toBeVisible();
});

test('R-E-15: se puede crear una tienda paso a paso', async ({ page }) => {
  await open(page, '/crear-tienda');

  // Paso 1 · cuenta de vendedor
  await expect(page.getByRole('heading', { name: 'Crea tu cuenta de vendedor' })).toBeVisible();
  await page.locator('#name').fill('Vendedor Demo');
  await page.locator('#email').fill('vendedor@tienda.test');
  await page.locator('#password').fill('secreto123');
  await page.getByRole('button', { name: 'Crear cuenta y continuar' }).click();

  // Paso 2 · empresa y tienda
  await expect(page.getByRole('heading', { name: 'Configura tu negocio' })).toBeVisible();
  await page.locator('#company-name').fill('Mi Empresa');
  await page.locator('#company-logistics-mode').selectOption('hibrida');
  await page.locator('#store-name').fill('Mi Tienda');
  await page.getByTestId('create-store-submit').click();

  // Paso 3 · productos (omitir)
  await expect(page.getByRole('heading', { name: 'Publica tus primeros productos' })).toBeVisible();
  await page.getByTestId('skip-products').click();

  // Paso 4 · listo
  await expect(page.getByText('¡Tu tienda está lista!')).toBeVisible();
});

test('R-E-20: la raíz lleva a la tienda y al asistente de alta', async ({ page }) => {
  // regression: 126 — `/` quedaba vacío porque la ruta lazy con path vacío de
  // `stores` resolvía antes que `ROOT_ROUTES`.
  await open(page, '/');

  // Buscador: un identificador válido resuelve el catálogo de esa tienda.
  await expect(page.getByRole('heading', { name: 'Elige tu tienda' })).toBeVisible();
  await page.locator('#storeId').fill('tienda-demo');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL(/\/tienda\/tienda-demo\/shop/, { timeout: 30_000 });
  await expect(page.locator('app-product-card').first()).toBeVisible({ timeout: 30_000 });

  // Alta: el botón abre el asistente público de creación de tienda.
  await open(page, '/');
  await page.getByRole('button', { name: 'Crear mi tienda' }).click();
  await expect(page).toHaveURL(/\/crear-tienda/);
  await expect(page.getByRole('heading', { name: 'Crea tu cuenta de vendedor' })).toBeVisible();
});

// R-E-28: el comprador confirma la orden desde el checkout y llega a la
// confirmación con la orden creada (`POST /orders`, ADR-35).
test('R-E-28: el comprador confirma su orden', async ({ page }) => {
  await login(page, `${STORE}/shop`);

  await page.getByRole('button', { name: 'Añadir al Carrito' }).first().click();
  await page.getByLabel('Carrito').first().click();
  await page.getByRole('button', { name: 'Procesar Orden' }).click();
  await expect(page).toHaveURL(/\/checkout/);

  await page.getByRole('button', { name: 'Confirmar Orden' }).click();

  await expect(page).toHaveURL(/\/checkout\/confirmacion/);
  await expect(page.getByTestId('order-confirmation')).toBeVisible();
  await expect(page.getByTestId('order-confirmation')).toContainText('Confirmada');
});
