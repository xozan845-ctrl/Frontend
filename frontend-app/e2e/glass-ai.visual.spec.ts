import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test as base, expect, type Locator, type Page } from '@playwright/test';
import { mockApi } from './api-mock';

/**
 * R-UX-7/R-UX-8 — regresión visual del AI scraper.
 *
 * Cubre el shell (`glass-bar`), la tarjeta de conexión y el estado vacío del
 * chat en claro, oscuro y fallback sin `backdrop-filter`. El backend de IA se
 * mockea por completo (`/ai-api/**`) para que el snapshot dependa del cristal,
 * no de la red.
 */
const DASHBOARD_CARD = '[data-testid="ai-connection-panel"]';
const CHAT_EMPTY = '[data-testid="ai-chat-empty"]';

const test = base.extend<{ apiMock: void }>({
  apiMock: [
    async ({ page }, use) => {
      await stabilizeNetwork(page);
      await mockApi(page);
      await mockAiBackend(page);
      await use();
    },
    { auto: true },
  ],
});

const stabilizeNetwork = async (page: Page) => {
  await page.route('**/*', (route) => {
    const request = route.request();
    const url = request.url();
    if (
      request.resourceType() === 'image' ||
      url.includes('fonts.googleapis.com') ||
      url.includes('fonts.gstatic.com')
    ) {
      return route.abort();
    }
    return route.continue();
  });
};

async function mockAiBackend(page: Page): Promise<void> {
  await page.route('**/ai-api/**', (route) => {
    const url = route.request().url();
    if (url.includes('/sessions')) return route.fulfill({ json: { items: [] } });
    return route.fulfill({ json: {} });
  });
}

const setTheme = async (page: Page, theme: 'light' | 'dark') => {
  await page.addInitScript((value) => {
    localStorage.setItem('ecom_theme', value);
  }, theme);
};

const stabilizePage = async (page: Page) => {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
      }
      app-pwa-notice, app-toast, app-floating-support { display: none !important; }
      header.glass-bar { position: static !important; }
    `,
  });
};

const openDashboard = async (page: Page) => {
  await page.goto('/ia', { waitUntil: 'domcontentloaded' });
  await expect(page.locator(DASHBOARD_CARD)).toBeVisible({ timeout: 30_000 });
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await stabilizePage(page);
};

const openChat = async (page: Page) => {
  await page.goto('/ia/chat', { waitUntil: 'domcontentloaded' });
  await expect(page.locator(CHAT_EMPTY)).toBeVisible({ timeout: 30_000 });
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await stabilizePage(page);
};

/** Extrae el bloque `@supports not (backdrop-filter: ...)` real de styles.css. */
const glassFallbackCss = () => {
  const css = readFileSync(resolve('src/styles.css'), 'utf8');
  const start = css.indexOf('@supports not (backdrop-filter');
  if (start < 0) throw new Error('No se encontró el fallback Glass en src/styles.css');

  let depth = 0;
  let end = start;
  for (; end < css.length; end += 1) {
    if (css[end] === '{') depth += 1;
    else if (css[end] === '}') {
      depth -= 1;
      if (depth === 0) break;
    }
  }

  return css
    .slice(start, end + 1)
    .replace(/^@supports[^{]+\{/, '')
    .replace(/\}$/, '');
};

const applyFallback = async (page: Page) => {
  await page.addStyleTag({
    content: `${glassFallbackCss()}
      *, *::before, *::after {
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }`,
  });
};

const shot = async (locator: Locator, name: string) => {
  await locator.scrollIntoViewIfNeeded();
  await expect(locator).toHaveScreenshot(name, {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.02,
  });
};

for (const theme of ['light', 'dark'] as const) {
  test(`R-UX-7/R-UX-8: Glass del AI scraper en tema ${theme}`, async ({ page }) => {
    await setTheme(page, theme);

    await openDashboard(page);
    await shot(page.locator('header.glass-bar'), `glass-ai-header-${theme}.png`);
    await shot(page.locator(DASHBOARD_CARD), `glass-ai-connection-${theme}.png`);

    await openChat(page);
    await shot(page.locator(CHAT_EMPTY), `glass-ai-chat-empty-${theme}.png`);
  });
}

test('R-UX-7/R-UX-8: Glass del AI scraper con fallback sin backdrop-filter', async ({ page }) => {
  await setTheme(page, 'light');

  await openDashboard(page);
  await applyFallback(page);
  await shot(page.locator('header.glass-bar'), 'glass-ai-header-no-backdrop.png');
  await shot(page.locator(DASHBOARD_CARD), 'glass-ai-connection-no-backdrop.png');

  await openChat(page);
  await applyFallback(page);
  await shot(page.locator(CHAT_EMPTY), 'glass-ai-chat-empty-no-backdrop.png');
});
