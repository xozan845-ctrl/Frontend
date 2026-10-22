import { defineConfig, devices } from '@playwright/test';

// R-E-12/13: suite hermética (mock del frontend vía configuración `e2e`),
// headless en CI con TZ fija y timeout por paso. `E2E_PORT` permite usar otro
// puerto (p. ej. junto a un `ng serve` local en el 4200).
const port = Number(process.env['E2E_PORT'] ?? 4200);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  workers: 1,
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
    locale: 'es-MX',
    timezoneId: 'America/Mexico_City',
    // R-AC: la auditoría axe debe ser determinista (sin depender del tema del SO).
    colorScheme: 'light',
    reducedMotion: 'reduce',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // R-AC: la auditoría axe corre también en viewport móvil.
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: /a11y\.spec\.ts/,
    },
  ],
  webServer: {
    command: `npm start -- --configuration e2e --port ${port}`,
    url: `http://localhost:${port}`,
    // Con `E2E_PORT` explícito siempre se levanta un servidor propio (no
    // reutiliza uno ajeno que podría servir otro checkout).
    reuseExistingServer: !process.env['CI'] && !process.env['E2E_PORT'],
    timeout: 180_000,
  },
});
