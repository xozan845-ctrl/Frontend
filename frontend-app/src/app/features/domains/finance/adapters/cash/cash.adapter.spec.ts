import type {
  CashMovement,
  CashMovementFilters,
  CashPaymentMethod,
  PettyCashMovement,
} from '../../models/finance.model';
import {
  buildCashLedger,
  buildCashLedgerDesc,
  cashBalance,
  cashDateKey,
  cashToday,
  computeCashKpis,
  createCashMovementRecord,
  filterCashMovements,
  isCashDateInPeriod,
  mergeCashMovements,
  normalizePaymentMethodId,
  salesToCashMovements,
  sanitizeCashMovements,
  summarizeCashMovements,
  toCashDate,
} from './cash-movements.adapter';
import {
  buildCashClosurePreview,
  buildTransferCashMovements,
  cashPaymentMethodIcon,
  computeCashTransferSummary,
  computePettyCashSummary,
  createCashClosure,
  createCashPaymentMethod,
  createCashTransfer,
  createPettyCashMovement,
  createPettyCashFund,
  emptyPettyCashFund,
  sanitizeCashClosures,
  sanitizeCashPaymentMethods,
  sanitizeCashTransfers,
  sanitizePettyCashFund,
  sanitizePettyCashMovements,
  seedCashPaymentMethods,
  summarizeCashPaymentMethods,
} from './cash-sections.adapter';
import { buildCashReport, buildCashReportHtml, cashReportCsv } from './cash-report.adapter';

function movement(overrides: Partial<CashMovement> = {}): CashMovement {
  return {
    id: 'cash-1',
    date: '2026-10-20',
    createdAt: '2026-10-20T10:00:00.000Z',
    type: 'ingreso',
    concept: 'Cobro',
    amount: 100,
    currency: 'NIO',
    originalAmount: 100,
    exchangeRate: 1,
    paymentMethod: 'efectivo',
    category: 'aporte',
    source: 'manual',
    status: 'completado',
    reference: '',
    observations: '',
    ...overrides,
  };
}

function filters(overrides: Partial<CashMovementFilters> = {}): CashMovementFilters {
  return {
    period: 'año',
    search: '',
    flow: 'todos',
    origin: 'todos',
    status: 'completados',
    paymentMethod: 'todas',
    category: 'todas',
    customFrom: '',
    customTo: '',
    page: 1,
    ...overrides,
  };
}

const NOW = new Date('2026-10-29T12:00:00');

describe('cash-movements.adapter', () => {
  it('debe sanear movimientos viejos y completar los campos nuevos', () => {
    const records = sanitizeCashMovements([
      {
        id: 'legacy',
        date: '2026-10-20',
        type: 'ingreso',
        concept: 'Cobro',
        amount: 10,
        paymentMethod: 'efectivo',
      },
      { id: '', date: '2026-10-20' },
    ]);

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      id: 'legacy',
      category: 'aporte',
      source: 'manual',
      status: 'completado',
      currency: 'NIO',
      createdAt: '2026-10-20T12:00:00.000Z',
    });
  });

  it('debe convertir ventas cobradas y normalizar su método de pago', () => {
    const [sale] = salesToCashMovements([
      {
        id: 'local-1',
        number: 'V-001189',
        date: '2026-10-28',
        total: 2049,
        paymentMethod: 'efectivo',
        paymentLabel: 'Efectivo',
        source: 'local',
      },
      {
        id: 'local-2',
        number: 'V-001190',
        date: '2026-10-28',
        total: 100,
        paymentMethod: 'separado',
        paymentLabel: 'Pago separado',
        source: 'local',
        cancelled: true,
      },
    ]);

    expect(sale).toMatchObject({
      concept: 'Venta V-001189',
      reference: 'V-001189',
      amount: 2049,
      category: 'venta',
      source: 'venta',
      paymentMethod: 'efectivo',
    });
    expect(sale.id).toBe('sale-local-local-1');
  });

  it('debe unir movimientos sin duplicar ids y calcular el saldo corrido', () => {
    const manual = [movement({ id: 'a', amount: 100 })];
    const sales = salesToCashMovements([
      {
        id: 's1',
        number: 'V-1',
        date: '2026-10-21',
        total: 50,
        paymentMethod: 'efectivo',
        paymentLabel: 'Efectivo',
        source: 'local',
      },
    ]);
    const merged = mergeCashMovements(manual, sales);

    expect(merged).toHaveLength(2);
    expect(mergeCashMovements(merged, merged)).toHaveLength(2);

    const ledger = buildCashLedger([
      movement({ id: 'in', amount: 100 }),
      movement({ id: 'out', type: 'egreso', amount: 30, date: '2026-10-21' }),
      movement({ id: 'cancelled', amount: 500, status: 'anulado' }),
    ]);

    expect(ledger.map((entry) => entry.balance)).toEqual([100, 70]);
    expect(
      buildCashLedgerDesc([...ledger.map((entry) => entry.movement)]).map((entry) => entry.balance),
    ).toEqual([70, 100]);
  });

  it('debe calcular KPIs del mes separando ventas de movimientos manuales', () => {
    const kpis = computeCashKpis(
      [
        movement({ id: 'sale', amount: 1000, source: 'venta', category: 'venta' }),
        movement({ id: 'other-in', amount: 200, source: 'manual' }),
        movement({ id: 'other-out', type: 'egreso', amount: 50, source: 'manual' }),
        movement({ id: 'old', date: '2026-09-01', amount: 400 }),
      ],
      NOW,
    );

    expect(kpis).toMatchObject({
      available: 1550,
      monthIncome: 1200,
      monthIncomeCount: 2,
      monthExpense: 50,
      monthExpenseCount: 1,
      monthMovements: 3,
      otherIncome: 200,
      otherExpense: 50,
    });
  });

  it('debe filtrar por periodo, flujo, origen y búsqueda', () => {
    const list = [
      movement({ id: 'sale', concept: 'Venta V-1', source: 'venta', category: 'venta' }),
      movement({ id: 'manual', concept: 'Aporte socio', source: 'manual' }),
      movement({
        id: 'out',
        type: 'egreso',
        concept: 'Compra insumos',
        source: 'compra',
        category: 'compra',
      }),
      movement({ id: 'old', date: '2025-01-01' }),
    ];

    expect(filterCashMovements(list, filters({ flow: 'egresos' }), NOW).map((m) => m.id)).toEqual([
      'out',
    ]);
    expect(filterCashMovements(list, filters({ origin: 'ligados' }), NOW).map((m) => m.id)).toEqual(
      ['sale', 'out'],
    );
    expect(filterCashMovements(list, filters({ search: 'aporte' }), NOW).map((m) => m.id)).toEqual([
      'manual',
    ]);
    expect(isCashDateInPeriod('2026-10-26', 'semana', '', '', NOW)).toBe(true);
    expect(isCashDateInPeriod('2026-10-19', 'semana', '', '', NOW)).toBe(false);
  });

  it('debe crear un movimiento en dólares consolidado en NIO', () => {
    const record = createCashMovementRecord(
      {
        date: '2026-10-20',
        type: 'ingreso',
        concept: 'Pago USD',
        amount: 10,
        paymentMethod: 'efectivo',
        currency: 'USD',
        exchangeRate: 36.5,
      },
      NOW,
    );

    expect(record?.amount).toBe(365);
    expect(record?.originalAmount).toBe(10);
    expect(record?.currency).toBe('USD');
  });
});

describe('cash-sections.adapter', () => {
  it('debe resumir métodos de pago y sembrar los iniciales', () => {
    const methods: CashPaymentMethod[] = seedCashPaymentMethods(NOW);
    const summaries = summarizeCashPaymentMethods(methods, [
      movement({ id: 'a', paymentMethod: 'efectivo', amount: 100 }),
      movement({ id: 'b', paymentMethod: 'efectivo', type: 'egreso', amount: 40 }),
    ]);

    expect(methods).toHaveLength(5);
    expect(summaries.find((item) => item.method.id === 'efectivo')).toMatchObject({
      count: 2,
      income: 100,
      expense: 40,
      balance: 60,
    });
  });

  it('debe construir el corte del día y guardarlo con la diferencia', () => {
    const preview = buildCashClosurePreview(
      [
        movement({ id: 'prev', amount: 300, date: '2026-10-28' }),
        movement({ id: 'in', amount: 200, date: '2026-10-29' }),
        movement({ id: 'out', type: 'egreso', amount: 50, date: '2026-10-29' }),
      ],
      '2026-10-29',
      null,
      '2026-10-29',
    );

    expect(preview).toMatchObject({
      openingBalance: 300,
      income: 200,
      expense: 50,
      expectedBalance: 450,
      movementsCount: 2,
    });

    const closure = createCashClosure(
      preview,
      { date: '2026-10-29', countedBalance: 440, notes: 'Faltó cambio' },
      NOW,
    );
    expect(closure).toMatchObject({
      countedBalance: 440,
      difference: -10,
      notes: 'Faltó cambio',
    });
    expect(sanitizeCashClosures([closure])).toEqual([closure]);
  });

  it('debe calcular caja chica y validar sus movimientos', () => {
    const fund = createPettyCashFund(1000, 'Karla', NOW)!;
    const movements: PettyCashMovement[] = [
      createPettyCashMovement(
        { date: '2026-10-20', type: 'gasto', concept: 'Café', amount: 100 },
        NOW,
      )!,
      createPettyCashMovement(
        { date: '2026-10-21', type: 'reposicion', concept: 'Reposición', amount: 200 },
        NOW,
      )!,
    ];

    expect(computePettyCashSummary(fund, movements)).toMatchObject({
      fund: 1000,
      replenishments: 200,
      expenses: 100,
      balance: 1100,
      movementsCount: 2,
    });
    expect(sanitizePettyCashMovements(movements)).toHaveLength(2);
    expect(
      createPettyCashMovement({ date: '', type: 'gasto', concept: '', amount: 0 }, NOW),
    ).toBeNull();
  });

  it('debe crear transferencias y sus movimientos de caja', () => {
    const transfer = createCashTransfer(
      {
        date: '2026-10-29',
        fromId: 'cash',
        fromLabel: 'Caja',
        fromKind: 'cash',
        toId: 'bank-1',
        toLabel: 'BAC · Operativa',
        toKind: 'bank',
        amount: 500,
        concept: 'Depósito',
      },
      NOW,
    )!;

    const movements = buildTransferCashMovements(transfer);
    expect(movements).toHaveLength(1);
    expect(movements[0]).toMatchObject({ type: 'egreso', transferId: transfer.id });
    expect(computeCashTransferSummary([transfer])).toEqual({
      totalTransferred: 500,
      transfersCount: 1,
      cancelledCount: 0,
    });
  });
});

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

describe('ramas de saneamiento y validación', () => {
  it('debe validar fechas, monedas y enums al sanear', () => {
    expect(toCashDate('20/10/2026')).toBe('');
    expect(toCashDate('2026-02-30')).not.toBe('');
    expect(cashToday(new Date('2026-10-29T23:00:00'))).toBe('2026-10-29');
    expect(cashDateKey(new Date('2026-01-05T10:00:00'))).toBe('2026-01-05');

    const records = sanitizeCashMovements([
      {
        id: 'usd',
        date: '2026-10-20',
        type: 'egreso',
        concept: 'Pago USD',
        amount: 10,
        currency: 'USD',
        originalAmount: 10,
        exchangeRate: 36.5,
        paymentMethod: 'tarjeta',
        category: 'gasto',
        source: 'gasto',
        status: 'anulado',
        reference: 'G-1',
        observations: 'Nota',
        transferId: 'transfer-1',
      },
      { id: '', date: '2026-10-20', type: 'ingreso', concept: 'X', amount: 1 },
      { id: 'bad-date', date: '20/10/2026', type: 'ingreso', concept: 'X', amount: 1 },
      { id: 'bad-type', date: '2026-10-20', type: 'otro', concept: 'X', amount: 1 },
      { id: 'zero', date: '2026-10-20', type: 'ingreso', concept: 'X', amount: 0 },
    ]);

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      currency: 'USD',
      originalAmount: 10,
      exchangeRate: 36.5,
      status: 'anulado',
      transferId: 'transfer-1',
    });
  });

  it('debe completar enums y campos opcionales de movimientos persistidos', () => {
    const [record] = sanitizeCashMovements([
      {
        id: 'legacy',
        date: '2026-10-20',
        type: 'egreso',
        concept: 'Gasto',
        amount: 10,
        currency: 'EUR',
        category: 'inventada',
        source: 'inventada',
        status: 'inventado',
        createdAt: '',
        paymentMethod: '',
      },
    ]);

    expect(record).toMatchObject({
      currency: 'NIO',
      category: 'gasto',
      source: 'manual',
      status: 'completado',
      paymentMethod: 'efectivo',
    });
    expect(record.createdAt).toBe('2026-10-20T12:00:00.000Z');
  });

  it('debe rechazar altas inválidas y normalizar métodos de venta', () => {
    expect(
      createCashMovementRecord({
        date: '2026-10-20',
        type: 'ingreso',
        concept: 'X',
        amount: 10,
        paymentMethod: '',
      }),
    ).toBeNull();
    expect(
      createCashMovementRecord({
        date: '2026-10-20',
        type: 'ingreso',
        concept: '',
        amount: 10,
        paymentMethod: 'efectivo',
      }),
    ).toBeNull();
    expect(
      createCashMovementRecord({
        date: '2026-10-20',
        type: 'ingreso',
        concept: 'X',
        amount: 0,
        paymentMethod: 'efectivo',
      }),
    ).toBeNull();

    expect(normalizePaymentMethodId('tarjeta', '')).toBe('tarjeta');
    expect(normalizePaymentMethodId('transferencia', '')).toBe('transferencia');
    expect(normalizePaymentMethodId('paypal', '')).toBe('paypal');
    expect(normalizePaymentMethodId('separado', 'Pago separado')).toBe('credito');
    expect(normalizePaymentMethodId('crédito', '')).toBe('credito');
    expect(normalizePaymentMethodId('desconocido', '')).toBe('otro');
  });

  it('debe descartar ventas canceladas o con fecha inválida', () => {
    expect(
      salesToCashMovements([
        {
          id: 'a',
          number: 'V-1',
          date: '20/10/2026',
          total: 10,
          paymentMethod: 'efectivo',
          paymentLabel: 'Efectivo',
          source: 'local',
        },
        {
          id: 'b',
          number: 'V-2',
          date: '2026-10-20',
          total: 0,
          paymentMethod: 'efectivo',
          paymentLabel: 'Efectivo',
          source: 'local',
        },
        {
          id: 'c',
          number: 'V-3',
          date: '2026-10-20',
          total: 10,
          paymentMethod: 'efectivo',
          paymentLabel: 'Efectivo',
          source: 'local',
          cancelled: true,
        },
      ]),
    ).toEqual([]);
  });

  it('debe filtrar por estado, método, categoría y rango personalizado', () => {
    const list = [
      movement({ id: 'a', paymentMethod: 'tarjeta', category: 'venta', source: 'venta' }),
      movement({ id: 'b', status: 'anulado', paymentMethod: 'efectivo' }),
      movement({ id: 'c', date: '2026-10-10', paymentMethod: 'tarjeta' }),
    ];

    expect(
      filterCashMovements(list, filters({ status: 'anulados' }), NOW).map((item) => item.id),
    ).toEqual(['b']);
    expect(
      filterCashMovements(list, filters({ paymentMethod: 'tarjeta' }), NOW).map((item) => item.id),
    ).toEqual(['a', 'c']);
    expect(
      filterCashMovements(list, filters({ category: 'venta' }), NOW).map((item) => item.id),
    ).toEqual(['a']);
    expect(
      filterCashMovements(list, filters({ origin: 'manuales' }), NOW).map((item) => item.id),
    ).toEqual(['c']);
    expect(
      filterCashMovements(
        list,
        filters({ period: 'personalizado', customFrom: '2026-10-15', customTo: '2026-10-25' }),
        NOW,
      ).map((item) => item.id),
    ).toEqual(['a']);
    expect(
      filterCashMovements(
        list,
        filters({ period: 'personalizado', customFrom: '2026-10-25' }),
        NOW,
      ).map((item) => item.id),
    ).toEqual([]);
    expect(
      filterCashMovements(
        list,
        filters({ period: 'personalizado', customTo: '2026-10-15' }),
        NOW,
      ).map((item) => item.id),
    ).toEqual(['c']);
  });

  it('debe calcular saldos ignorando anulados y sumar por flujo', () => {
    const list = [
      movement({ id: 'a', amount: 100 }),
      movement({ id: 'b', type: 'egreso', amount: 40 }),
      movement({ id: 'c', amount: 50, status: 'anulado' }),
    ];

    expect(cashBalance(list)).toBe(60);
    expect(summarizeCashMovements(list)).toEqual({ income: 150, expense: 40 });
    expect(
      computeCashKpis(
        [
          movement({ id: 'sale', amount: 100, source: 'venta', category: 'venta' }),
          movement({ id: 'ajuste', amount: 20, source: 'ajuste' }),
        ],
        NOW,
      ).otherIncome,
    ).toBe(20);
  });
});

describe('ramas de secciones', () => {
  it('debe sanear métodos, fondos y movimientos inválidos', () => {
    expect(cashPaymentMethodIcon('desconocido')).toContain('coins');
    expect(
      sanitizeCashPaymentMethods([
        { id: '', name: 'X' },
        { id: 'a', name: '' },
      ]),
    ).toEqual([]);

    const [method] = sanitizeCashPaymentMethods([
      { id: 'custom', name: 'Cheque', kind: '', active: false },
    ]);
    expect(method).toMatchObject({
      id: 'custom',
      name: 'Cheque',
      kind: 'otro',
      icon: 'fa-solid fa-coins',
      active: false,
    });

    expect(createCashPaymentMethod({ name: '', kind: 'otro' })).toBeNull();
    expect(createCashPaymentMethod({ name: 'Cheque', kind: 'cheque' })).toMatchObject({
      name: 'Cheque',
      kind: 'cheque',
      active: true,
    });

    expect(emptyPettyCashFund(NOW)).toMatchObject({ amount: 0, responsible: '' });
    expect(sanitizePettyCashFund(null)).toBeNull();
    expect(sanitizePettyCashFund({ amount: -2 })).toMatchObject({ amount: 0 });
    expect(createPettyCashFund(-1, '')).toBeNull();
    expect(createPettyCashFund(10, ' Karla ')).toMatchObject({ amount: 10, responsible: 'Karla' });
  });

  it('debe sanear cierres y movimientos de caja chica inválidos', () => {
    expect(sanitizeCashClosures([null, {}, { id: 'a', date: '20/10/2026' }])).toEqual([]);
    expect(
      sanitizeCashClosures([
        {
          id: 'closure',
          date: '2026-10-20',
          openingBalance: -5,
          income: 0,
          expense: 0,
          expectedBalance: 0,
          countedBalance: 0,
          difference: 'x',
          movementsCount: 1.9,
        },
      ])[0],
    ).toMatchObject({
      openingBalance: 0,
      difference: 0,
      movementsCount: 1,
      closedAt: expect.any(String),
    });

    expect(
      sanitizePettyCashMovements([
        { id: 'a', date: '2026-10-20', type: 'otro', concept: 'X', amount: 1 },
        { id: 'b', date: '20/10/2026', type: 'gasto', concept: 'X', amount: 1 },
        { id: 'c', date: '2026-10-20', type: 'gasto', concept: '', amount: 1 },
        { id: 'd', date: '2026-10-20', type: 'gasto', concept: 'X', amount: 0 },
      ]),
    ).toEqual([]);
    expect(
      createPettyCashMovement({
        date: '2026-10-20',
        type: 'otro' as never,
        concept: 'X',
        amount: 1,
      }),
    ).toBeNull();
  });

  it('debe crear cierres con conteo inválido o existente como null', () => {
    const preview = buildCashClosurePreview([], '2026-10-20', null, '2026-10-20');
    expect(createCashClosure(preview, { date: '2026-10-20', countedBalance: -1 })).toBeNull();
    expect(
      createCashClosure(
        { ...preview, existing: { id: 'x' } as never },
        { date: '2026-10-20', countedBalance: 1 },
      ),
    ).toBeNull();
  });

  it('debe sanear transferencias y rechazar altas inválidas', () => {
    expect(sanitizeCashTransfers([null, {}, { id: 'a', date: '2026-10-20' }])).toEqual([]);
    expect(
      createCashTransfer({
        date: '2026-10-20',
        fromId: 'cash',
        fromLabel: 'Caja',
        fromKind: 'cash',
        toId: 'cash',
        toLabel: 'Caja',
        toKind: 'cash',
        amount: 10,
        concept: 'X',
      }),
    ).toBeNull();
    expect(
      createCashTransfer({
        date: '2026-10-20',
        fromId: 'cash',
        fromLabel: 'Caja',
        fromKind: 'otro' as never,
        toId: 'bank',
        toLabel: 'Banco',
        toKind: 'bank',
        amount: 10,
        concept: 'X',
      }),
    ).toBeNull();
    expect(
      createCashTransfer({
        date: '20/10/2026',
        fromId: 'cash',
        fromLabel: 'Caja',
        fromKind: 'cash',
        toId: 'bank',
        toLabel: 'Banco',
        toKind: 'bank',
        amount: 10,
        concept: 'X',
      }),
    ).toBeNull();

    const transfer = createCashTransfer({
      date: '2026-10-20',
      fromId: 'bank-1',
      fromLabel: '',
      fromKind: 'bank',
      toId: 'bank-2',
      toLabel: '',
      toKind: 'bank',
      amount: 10,
      concept: '',
    })!;
    expect(transfer).toMatchObject({
      concept: 'Transferencia interna',
      notes: '',
      status: 'completado',
    });
    expect(buildTransferCashMovements(transfer)).toEqual([]);
    expect(
      computeCashTransferSummary([
        { ...transfer, status: 'anulado' },
        { ...transfer, id: 'ok' },
      ]),
    ).toEqual({ totalTransferred: 10, transfersCount: 2, cancelledCount: 1 });
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
