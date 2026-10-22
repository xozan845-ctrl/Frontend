import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Page } from '@playwright/test';
import { mockApi } from './api-mock';

// R-AC: auditoría automatizada de accesibilidad con axe en las páginas clave.
// La suite es hermética (`api-mock`) y se ejecuta en desktop y móvil (proyecto
// `mobile-chrome`).
const STORE = '/tienda/tienda-demo';

const expectNoSeriousIssues = async (page: Page) => {
  // Determinismo: espera a las fuentes antes de auditar (R-AC).
  await page.evaluate(() => document.fonts.ready);

  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations
    .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
    .map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.map((node) => node.target.join(' ')),
    }));

  expect(blocking).toEqual([]);
};

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test('R-AC: la home no tiene violaciones graves de accesibilidad', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1').first()).toBeVisible();

  await expectNoSeriousIssues(page);
});

test('R-AC: el catálogo no tiene violaciones graves de accesibilidad', async ({ page }) => {
  await page.goto(`${STORE}/shop`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('app-product-card').first()).toBeVisible();

  await expectNoSeriousIssues(page);
});

test('R-AC: el login no tiene violaciones graves de accesibilidad', async ({ page }) => {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#email')).toBeVisible();

  await expectNoSeriousIssues(page);
});
