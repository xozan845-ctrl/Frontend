#!/usr/bin/env node
/**
 * Genera las imágenes Open Graph (1200 × 630) a partir de sus fuentes HTML:
 *
 * - `docs/assets/og-image.html`       → `public/og-image.png` (sitio)
 * - `docs/assets/og-invitacion.html`  → `public/og-invitacion.png` (invitación)
 *
 * Uso: npm run og-image
 * Requiere los navegadores de Playwright: npx playwright install chromium
 */
import { readFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const WIDTH = 1200;
const HEIGHT = 630;

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const images = [
  {
    source: join(root, 'docs/assets/og-image.html'),
    output: join(root, 'public/og-image.png'),
  },
  {
    source: join(root, 'docs/assets/og-invitacion.html'),
    output: join(root, 'public/og-invitacion.png'),
  },
];

let browser;
try {
  browser = await chromium.launch();
} catch (error) {
  console.error(
    'No se pudo iniciar Chromium. Instala los navegadores de Playwright con:\n' +
      '  npx playwright install chromium',
  );
  throw error;
}

try {
  for (const image of images) {
    const html = await readFile(image.source, 'utf8');
    const page = await browser.newPage({
      viewport: { width: WIDTH, height: HEIGHT },
      deviceScaleFactor: 1,
    });
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: image.output, type: 'png' });
    await page.close();

    const { size } = await stat(image.output);
    console.log(
      `OG image generada: ${image.output} (${WIDTH}×${HEIGHT}, ${Math.round(size / 1024)} KB)`,
    );
  }
} finally {
  await browser.close();
}
