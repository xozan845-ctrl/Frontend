import { buildCashReport, buildCashReportHtml, cashReportCsv } from './cash-report.adapter';
import {
  CASH_NOW as NOW,
  cashFilters as filters,
  cashMovement as movement,
} from './fixtures/cash.fixture';

describe('cash-report.adapter', () => {
  it('debe filtrar el reporte y exportarlo a CSV y HTML', () => {
    const report = buildCashReport(
      [
        movement({
          id: 'a',
          concept: 'Venta',
          reference: 'V-1',
          source: 'venta',
          category: 'venta',
        }),
        movement({ id: 'b', type: 'egreso', concept: 'Compra', amount: 30, source: 'compra' }),
      ],
      filters(),
      NOW,
    );

    expect(report).toMatchObject({ count: 2, income: 100, expense: 30, balance: 70 });
    expect(cashReportCsv(report)).toContain('Venta');
    expect(cashReportCsv(report)).toContain('TOTALES');
    expect(buildCashReportHtml(report, 'Mi empresa')).toContain('Reporte de caja');
  });

  it('debe respetar el filtro de anulados', () => {
    const report = buildCashReport(
      [movement({ id: 'a', status: 'anulado', amount: 100 })],
      filters({ status: 'anulados' }),
      NOW,
    );

    expect(report.count).toBe(1);
    expect(report.balance).toBe(100);
  });
});

describe('ramas del reporte', () => {
  const list = [
    movement({ id: 'a', concept: 'Venta', source: 'venta', category: 'venta' }),
    movement({ id: 'b', type: 'egreso', concept: 'Gasto', source: 'gasto', category: 'gasto' }),
    movement({ id: 'c', status: 'anulado', concept: 'Anulado' }),
  ];

  it('debe describir los periodos y filtros en el HTML', () => {
    for (const period of ['hoy', 'semana', 'mes', 'año', 'personalizado'] as const) {
      const html = buildCashReportHtml(
        buildCashReport(
          list,
          filters({ period, customFrom: '2026-10-01', customTo: '2026-10-31' }),
          NOW,
        ),
        'Mi empresa',
      );
      expect(html).toContain('Reporte de caja');
    }

    const html = buildCashReportHtml(
      buildCashReport(
        list,
        filters({
          period: 'personalizado',
          status: 'anulados',
          flow: 'ingresos',
          origin: 'manuales',
          paymentMethod: 'efectivo',
          category: 'otro',
          customFrom: '2026-10-01',
        }),
        NOW,
      ),
      'Mi empresa',
    );
    expect(html).toContain('Anulados');
    expect(html).toContain('Solo ingresos');
    expect(html).toContain('Manuales de caja');
    expect(html).toContain('Desde 2026-10-01');

    const htmlTo = buildCashReportHtml(
      buildCashReport(
        list,
        filters({ period: 'personalizado', customTo: '2026-10-31', origin: 'ligados' }),
        NOW,
      ),
      'Mi empresa',
    );
    expect(htmlTo).toContain('Hasta 2026-10-31');
    expect(htmlTo).toContain('Ligados a ventas, compras y gastos');

    const htmlBoth = buildCashReportHtml(
      buildCashReport(
        list,
        filters({ period: 'personalizado', customFrom: '2026-10-01', customTo: '2026-10-31' }),
        NOW,
      ),
      'Mi empresa',
    );
    expect(htmlBoth).toContain('Del 2026-10-01 al 2026-10-31');

    const htmlEmpty = buildCashReportHtml(buildCashReport([], filters(), NOW), 'Mi <empresa>');
    expect(htmlEmpty).toContain('Sin movimientos');
    expect(htmlEmpty).toContain('Mi &lt;empresa&gt;');
  });

  it('debe exportar CSV con celdas escapadas y sin resultados', () => {
    const csv = cashReportCsv(
      buildCashReport(
        [
          movement({
            id: 'a',
            concept: 'Venta; "especial"',
            observations: 'Línea 1\nLínea 2',
            paymentMethod: 'tarjeta-credito',
          }),
        ],
        filters(),
        NOW,
      ),
    );
    expect(csv).toContain('"Venta; ""especial"""');
    expect(csv).toContain('"Línea 1\nLínea 2"');
    expect(csv).toContain('Tarjeta Credito');

    const empty = buildCashReport([], filters(), NOW);
    expect(cashReportCsv(empty)).toContain('TOTALES');
    expect(buildCashReportHtml(empty, 'Mi empresa')).toContain('Sin movimientos');
  });
});
