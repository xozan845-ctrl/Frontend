import { test as base, expect, type Page } from '@playwright/test';
import { mockApi } from './api-mock';

const createMovement = async (page: Page) => {
  await page.getByTestId('cash-new-movement-page').click();
  await page.getByTestId('cash-movement-concept').fill('Venta de mostrador');
  await page.getByTestId('cash-movement-amount').fill('1200');
  await page.getByTestId('cash-movement-save').click();
  await expect(page.getByTestId('cash-movement-dialog')).toHaveCount(0);

  // regression: PR-438 — el alta se verifica por sus datos, independientemente del orden.
  const movement = page.getByTestId('cash-row').filter({
    has: page.getByText('Venta de mostrador', { exact: true }),
  });
  await expect(movement).toHaveCount(1);
  await expect(movement).toBeVisible();
  // La quinta columna es Ingreso; el saldo puede coincidir con el importe.
  await expect(movement.getByRole('cell').nth(4)).toHaveText('NIO 1,200.00');
};

const login = async (page: Page) => {
  await page.goto('/login?returnUrl=%2Fapp%2Fempresa%2Fcaja', { waitUntil: 'domcontentloaded' });
  await page.locator('#email').fill('empresario@tienda.test');
  await page.locator('#password').fill('secreto1');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.waitForURL((url) => url.pathname === '/app/empresa/caja', { timeout: 30_000 });
};

// R-E-9: la pantalla financiera no debe emitir errores ni warnings de consola.
const test = base.extend<{ apiMock: void; consoleIssues: string[]; cashNow: string }>({
  cashNow: ['2026-11-19T02:25:00.000Z', { option: true }],
  apiMock: [
    async ({ page, cashNow }, use) => {
      const now = new Date(cashNow);
      // El navegador y las ventas deben compartir fecha incluso cerca de medianoche (R-FL-3).
      await page.clock.install({ time: now });
      await mockApi(page, now);
      await use();
    },
    { auto: true },
  ],
  consoleIssues: [
    async ({ page }, use) => {
      const issues: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error' || msg.type() === 'warning') issues.push(msg.text());
      });
      page.on('pageerror', (error) => issues.push(error.message));
      await use(issues);
      expect(issues, issues.join('\n')).toEqual([]);
    },
    { auto: true },
  ],
});

test('R-CAJA: movimientos, secciones y exportación del centro financiero', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1200 });
  await login(page);
  await expect(page.getByTestId('company-finance-page')).toBeVisible();
  await expect(page.getByTestId('cash-section-tabs')).toBeVisible();

  // Movimiento manual.
  await createMovement(page);

  // Métodos de pago.
  await page.getByTestId('cash-section-methods').click();
  await page.getByTestId('method-add').click();
  await page.getByTestId('cash-method-name').fill('Cheque');
  await page.locator('#cash-method-kind').selectOption('cheque');
  await page.getByTestId('cash-method-save').click();
  await expect(page.getByTestId('payment-methods-panel').getByText('Cheque').first()).toBeVisible();

  // Bancos y transferencia interna.
  await page.getByTestId('cash-section-banks').click();
  await page.getByTestId('bank-add').click();
  await page.locator('#cash-bank-name').fill('Banco Prueba');
  await page.locator('#cash-bank-alias').fill('Operativa');
  await page.locator('#cash-bank-number').fill('123456789');
  await page.locator('#cash-bank-balance').fill('1000');
  await page.getByTestId('cash-bank-save').click();
  await expect(page.getByTestId('bank-card')).toHaveCount(1);

  await page.getByTestId('cash-section-transfers').click();
  await page.getByTestId('transfer-add').click();
  await page.getByTestId('transfer-amount').fill('250');
  await page.getByTestId('transfer-save').click();
  await expect(page.getByTestId('transfer-row')).toHaveCount(1);
  await expect(page.getByTestId('transfer-row').first()).toContainText('Banco Prueba');

  // Cierre diario.
  await page.getByTestId('cash-section-closures').click();
  await page.getByTestId('closure-open').click();
  await page.getByTestId('cash-closure-save').click();
  await expect(page.getByTestId('closure-row')).toHaveCount(1);

  // Caja chica: fondo y gasto.
  await page.getByTestId('cash-section-petty').click();
  await page.getByRole('button', { name: 'Editar fondo' }).click();
  await page.getByTestId('petty-amount').fill('1000');
  await page.getByTestId('petty-save').click();
  await expect(page.getByTestId('petty-modal')).toHaveCount(0);
  await page.getByTestId('petty-expense').click();
  await page.getByTestId('petty-concept').fill('Café');
  await page.getByTestId('petty-amount').fill('100');
  await page.getByTestId('petty-save').click();
  await expect(page.getByTestId('petty-row')).toHaveCount(1);

  // Reporte de caja en Excel (CSV).
  await page.getByTestId('cash-export').click();
  await expect(page.getByTestId('cash-export-dialog')).toBeVisible();
  await expect(page.getByTestId('cash-export-summary')).toContainText('movimientos');
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('cash-export-excel').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('reporte-caja');
});

for (const [scenario, cashNow] of [
  ['antes de medianoche local', '2026-11-19T05:59:00.000Z'],
  ['después de medianoche local', '2026-11-19T06:01:00.000Z'],
  ['por la tarde local', '2026-11-19T20:25:00.000Z'],
]) {
  test.describe(scenario, () => {
    test.use({ cashNow });

    test('debe mostrar el movimiento guardado cuando cambia la hora de ejecución (regression: PR-438)', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 1200 });
      await login(page);
      await createMovement(page);
    });
  });
}
