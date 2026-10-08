import { test as base, expect, type Page } from '@playwright/test';

// El storefront es multi-tienda: todo vive bajo `/tienda/:storeId`. El modo
// `mock` (config `e2e`) devuelve una tienda y sus productos fijos.
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

test('R-E-1: el catálogo de la tienda carga productos y filtra por categoría', async ({ page }) => {
  await open(page, `${STORE}/shop`);

  const cards = page.locator('app-product-card');
  // El mock del frontend tiene 6 productos: 3 Electronics, 2 Fitness, 1 Accessories.
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
  // El carrito vive en el servidor y exige sesión (rol comprador).
  await login(page, `${STORE}/shop`);

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
