import { test as base, expect, type Page } from '@playwright/test';
import { mockApi } from './api-mock';

// Feature de IA: el backend `ai_scraper_executor` se mockea por completo con
// `page.route('**/ai-api/**')` (R-E-12, suite hermética). En el entorno `e2e`,
// `environment.aiScraperUrl` es `/ai-api` (mismo origen). El API Core Engine se
// responde con los fixtures de `api-mock.ts` (R-E-17 navega por el storefront).
// El dashboard de IA es mínimo: solo muestra el panel de conexión; el alta de
// jobs y su supervisión viven en el chat de sesiones.

// R-E-9: cero errores o warnings de consola durante el flujo.
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

async function mockAiBackend(page: Page): Promise<void> {
  await page.route('**/ai-api/**', (route) => route.fulfill({ json: {} }));
}

test('R-E-16: el dashboard de IA muestra el panel de conexión', async ({ page }) => {
  await mockAiBackend(page);
  await page.goto('/ia', { waitUntil: 'domcontentloaded' });

  await expect(page.getByTestId('ai-connection-panel')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Panel de extracción' })).toBeVisible();
});

test('R-E-17: el enlace de IA del header abre el feature', async ({ page }) => {
  await mockAiBackend(page);
  await page.goto('/tienda/tienda-demo/shop', { waitUntil: 'domcontentloaded' });

  await page.getByRole('link', { name: 'IA', exact: true }).first().click();
  await expect(page).toHaveURL(/\/ia$/);
});
