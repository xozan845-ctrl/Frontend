import { test as base, expect, type Page } from '@playwright/test';
import { mockApi } from './api-mock';

const login = async (page: Page) => {
  await page.goto('/login?returnUrl=%2Fapp%2Fempresa%2Fcaja', { waitUntil: 'domcontentloaded' });
  await page.locator('#email').fill('empresario@tienda.test');
  await page.locator('#password').fill('secreto1');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.waitForURL((url) => url.pathname === '/app/empresa/caja', { timeout: 30_000 });
};

/**
 * Instante de referencia del escenario: 03:10 UTC del 20-nov-2026.
 * En `America/Mexico_City` (TZ de la suite) son las 21:10 del 19-nov, así que
 * la fecha comercial local y la UTC difieren, igual que en el run que falló.
 */
const CASH_NOW = new Date('2026-11-20T03:10:00.000Z');

/** Fila del libro de caja cuyo concepto coincide exactamente. */
const cashRowByConcept = (page: Page, concept: string) =>
  page.getByTestId('cash-row').filter({
    has: page.getByTestId('cash-row-concept').getByText(concept, { exact: true }),
  });

/** Alta del movimiento manual usado por los escenarios de orden y fecha. */
const addManualMovement = async (page: Page) => {
  await page.getByTestId('cash-new-movement-page').click();
  await page.getByTestId('cash-movement-concept').fill('Venta de mostrador');
  await page.getByTestId('cash-movement-amount').fill('1200');
  await page.getByTestId('cash-movement-save').click();
  await expect(page.getByTestId('cash-movement-dialog')).toHaveCount(0);
};

// R-E-9: la pantalla financiera no debe emitir errores ni warnings de consola.
const test = base.extend<{ apiMock: void; consoleIssues: string[]; cashNow: Date }>({
  cashNow: [CASH_NOW, { option: true }],
  apiMock: [
    async ({ page, cashNow }, use) => {
      // R-E-12/R-FL-3: el navegador y el mock (Node) comparten el mismo
      // instante. Fijar solo el reloj del navegador deja `fechaVentaDemo`
      // dependiendo del reloj real de Node y el orden de las filas cambia.
      await page.clock.setFixedTime(cashNow);
      await mockApi(page, { now: cashNow });
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

// regression: PR-442 — el orden dependía del reloj real de CI.
test('R-CAJA: movimientos, secciones y exportación del centro financiero', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1200 });
  await login(page);
  await expect(page.getByTestId('company-finance-page')).toBeVisible();
  await expect(page.getByTestId('cash-section-tabs')).toBeVisible();

  // Movimiento manual.
  await addManualMovement(page);
  const manualRow = cashRowByConcept(page, 'Venta de mostrador');
  await expect(manualRow).toHaveCount(1);
  await expect(manualRow.getByTestId('cash-row-type')).toHaveText('Venta');
  await expect(manualRow.getByTestId('cash-row-income')).toHaveText('NIO 1,200.00');
  await expect(manualRow.getByTestId('cash-row-expense')).toHaveText('—');

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

/**
 * El libro ordena por fecha local + hora de creación. La venta demo usa
 * `12:00 UTC` fijo; según la hora real de ejecución queda antes o después del
 * movimiento manual. Estos casos fijan ambos relojes para que el orden sea
 * reproducible en cualquier runner.
 */
test.describe('R-CAJA: orden determinista entre venta demo y movimiento manual', () => {
  test.describe('antes de las 12:00 UTC', () => {
    test.use({ cashNow: new Date('2026-11-19T06:00:00.000Z') });

    // regression: PR-442
    test('debe mostrar el movimiento manual aunque la venta demo ocupe la primera fila', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 1200 });
      await login(page);
      await addManualMovement(page);

      const rows = page.getByTestId('cash-row');
      await expect(rows).toHaveCount(2);
      await expect(rows.first().getByTestId('cash-row-concept')).toContainText('Venta ORD-O-100');

      const manualRow = cashRowByConcept(page, 'Venta de mostrador');
      await expect(manualRow).toHaveCount(1);
      await expect(manualRow.getByTestId('cash-row-date')).toHaveText('19 nov 2026');
      await expect(manualRow.getByTestId('cash-row-type')).toHaveText('Venta');
      await expect(manualRow.getByTestId('cash-row-income')).toHaveText('NIO 1,200.00');
      await page.getByTestId('cash-period-hoy').click();
      await expect(page.getByTestId('cash-period-hoy')).toHaveAttribute('aria-selected', 'true');
      await expect(manualRow).toHaveCount(1);
    });
  });

  test.describe('después de las 12:00 UTC', () => {
    test.use({ cashNow: new Date('2026-11-19T18:00:00.000Z') });

    test('debe mostrar el movimiento manual como primera fila', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1200 });
      await login(page);
      await addManualMovement(page);

      const rows = page.getByTestId('cash-row');
      await expect(rows).toHaveCount(2);
      await expect(rows.first().getByTestId('cash-row-concept')).toContainText(
        'Venta de mostrador',
      );

      const manualRow = cashRowByConcept(page, 'Venta de mostrador');
      await expect(manualRow).toHaveCount(1);
      await expect(manualRow.getByTestId('cash-row-date')).toHaveText('19 nov 2026');
      await expect(manualRow.getByTestId('cash-row-income')).toHaveText('NIO 1,200.00');
    });
  });

  test.describe('cruce de día UTC/local', () => {
    test.use({ cashNow: new Date('2026-11-20T03:00:00.000Z') });

    test('debe conservar la fecha local del movimiento y el periodo Hoy', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1200 });
      await login(page);

      await page.getByTestId('cash-new-movement-page').click();
      await expect(page.locator('#cash-movement-date')).toHaveValue('2026-11-19');
      await page.getByTestId('cash-movement-concept').fill('Venta de mostrador');
      await page.getByTestId('cash-movement-amount').fill('1200');
      await page.getByTestId('cash-movement-save').click();
      await expect(page.getByTestId('cash-movement-dialog')).toHaveCount(0);

      const manualRow = cashRowByConcept(page, 'Venta de mostrador');
      await expect(manualRow).toHaveCount(1);
      await expect(manualRow.getByTestId('cash-row-date')).toHaveText('19 nov 2026');
      await page.getByTestId('cash-period-hoy').click();
      await expect(page.getByTestId('cash-period-hoy')).toHaveAttribute('aria-selected', 'true');
      await expect(manualRow).toHaveCount(1);
      await expect(page.getByTestId('cash-row')).toHaveCount(2);
    });
  });
});
