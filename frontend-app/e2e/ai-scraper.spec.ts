import { test as base, expect, type Page } from '@playwright/test';

// Feature de IA: el backend `ai_scraper_executor` se mockea por completo con
// `page.route('**/ai-api/**')` (R-E-12, suite hermética). En el entorno `e2e`,
// `environment.aiScraperUrl` es `/ai-api` (mismo origen).

const JOB = {
  id: 'job-e2e',
  url: 'https://tienda.example/',
  instruction: 'Obtén los productos',
  status: 'COMPLETED',
  aiProvider: 'openrouter',
  aiModel: 'openrouter/free',
  createdAt: '2026-10-09T10:00:00.000Z',
  updatedAt: '2026-10-09T10:02:00.000Z',
  limits: null,
};

const METRICS = {
  instance: 'api-e2e',
  uptimeSec: 10,
  store: 'memory',
  queue: 'memory',
  pendingJobs: 0,
  stats: {
    jobsTotal: 1,
    jobsByStatus: { COMPLETED: 1 },
    resultsTotal: 1,
    pagesTotal: 1,
    commandsTotal: 1,
    commandsRecovered: 0,
    aiCallsTotal: 1,
    aiTokensTotal: 100,
  },
  aiRecoveryRate: 0,
  distributed: {},
};

// R-E-9: cero errores o warnings de consola durante el flujo.
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

async function mockAiBackend(page: Page): Promise<void> {
  await page.route('**/ai-api/**', (route) => {
    const url = route.request().url();
    if (url.includes('/metrics')) return route.fulfill({ json: METRICS });
    if (url.includes('/health')) {
      return route.fulfill({ json: { status: 'ok', service: 'api', time: '', checks: {} } });
    }
    if (url.includes('/jobs')) return route.fulfill({ json: { items: [JOB], nextCursor: null } });
    return route.fulfill({ json: {} });
  });
}

test('R-E-16: el dashboard de IA lista los jobs del backend', async ({ page }) => {
  await mockAiBackend(page);
  await page.goto('/ia', { waitUntil: 'domcontentloaded' });

  await expect(page.getByTestId('ai-jobs-table')).toBeVisible();
  await expect(page.getByText('https://tienda.example/')).toBeVisible();
  await expect(page.getByTestId('ai-metrics-cards')).toBeVisible();
});

test('R-E-17: el enlace de IA del navbar abre el feature', async ({ page }) => {
  await mockAiBackend(page);
  await page.goto('/tienda/tienda-demo/shop', { waitUntil: 'domcontentloaded' });

  await page.getByRole('link', { name: 'IA', exact: true }).first().click();
  await expect(page).toHaveURL(/\/ia$/);
});
