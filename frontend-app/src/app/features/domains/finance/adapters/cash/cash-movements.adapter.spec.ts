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
  CASH_NOW as NOW,
  cashFilters as filters,
  cashMovement as movement,
} from './fixtures/cash.fixture';

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
