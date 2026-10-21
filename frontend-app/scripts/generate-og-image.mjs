#!/usr/bin/env node
/**
 * Genera `public/og-image.png` (1200 × 630) a partir de
 * `docs/assets/og-image.html`, la imagen Open Graph por defecto.
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
const source = join(root, 'docs/assets/og-image.html');
const output = join(root, 'public/og-image.png');

const html = await readFile(source, 'utf8');

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
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: output, type: 'png' });
} finally {
  await browser.close();
}

const { size } = await stat(output);
console.log(`OG image generada: ${output} (${WIDTH}×${HEIGHT}, ${Math.round(size / 1024)} KB)`);
