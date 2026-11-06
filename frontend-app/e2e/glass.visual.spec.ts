import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test as base, expect, type Locator, type Page } from '@playwright/test';
import { mockApi } from './api-mock';

/**
 * R-UX-7 — regresión visual del sistema Glass.
 *
 * Captura header, footer y una tarjeta de producto en claro, oscuro y con el
 * fallback de `@supports not (backdrop-filter: ...)` aplicado. Las imágenes,
 * fuentes externas y animaciones se estabilizan para que el snapshot detecte
 * cambios de cristal, no de red o tipografía.
 */
const STORE = '/tienda/tienda-demo';

const test = base.extend<{ apiMock: void }>({
  apiMock: [
    async ({ page }, use) => {
      await stabilizeNetwork(page);
      await mockApi(page);
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

const openStorefront = async (page: Page) => {
  await page.goto(`${STORE}/shop`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('app-product-card').first()).toBeVisible({ timeout: 30_000 });
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
  test(`R-UX-7: Glass en tema ${theme}`, async ({ page }) => {
    await setTheme(page, theme);
    await openStorefront(page);

    await shot(page.locator('header.glass-bar'), `glass-header-${theme}.png`);
    await shot(page.locator('footer.glass-footer'), `glass-footer-${theme}.png`);
    await shot(page.locator('app-product-card').first(), `glass-product-card-${theme}.png`);
  });
}

test('R-UX-7: Glass con fallback sin backdrop-filter', async ({ page }) => {
  await setTheme(page, 'light');
  await openStorefront(page);
  await applyFallback(page);

  await shot(page.locator('header.glass-bar'), 'glass-header-no-backdrop.png');
  await shot(page.locator('footer.glass-footer'), 'glass-footer-no-backdrop.png');
  await shot(page.locator('app-product-card').first(), 'glass-product-card-no-backdrop.png');
});
