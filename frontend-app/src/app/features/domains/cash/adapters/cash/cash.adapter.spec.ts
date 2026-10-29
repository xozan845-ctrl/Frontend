import {
  cashToday,
  computeBankAccounts,
  computeCashSummary,
  computeDailyClosures,
  computeMovementBalances,
  computePaymentBreakdown,
  createCashMovement,
  filterCashMovements,
  sanitizeCashMovements,
  toMovementRows,
  updateCashMovement,
} from './cash.adapter';
import type { CashMovement } from '../../models/cash.model';

const RECORD: CashMovement = {
  id: 'cash-1',
  date: '2026-10-29',
  type: 'ingreso',
  concept: 'Venta de contado',
  category: 'venta',
  amount: 100,
  paymentMethod: 'efectivo',
  status: 'confirmado',
  account: 'caja-general',
  source: 'venta',
  reference: 'REC-1',
  counterpart: 'Ana',
  notes: '',
  createdAt: '2026-10-29T12:00:00.000Z',
};

const BASE_FILTERS = {
  period: 'year' as const,
  type: 'all' as const,
  status: 'all' as const,
  category: 'all' as const,
  paymentMethod: 'all' as const,
  search: '',
  dateFrom: '',
  dateTo: '',
};

describe('cash.adapter', () => {
  it('debe normalizar movimientos nuevos y migrar el formato anterior', () => {
    const records = sanitizeCashMovements([
      RECORD,
      {
        id: 'legacy-1',
        date: '2026-10-01',
        type: 'egreso',
        description: 'Pago de luz',
        amount: 50,
        paymentMethod: 'transferencia',
      },
      { id: 'legacy-2', date: '2026-10-02', type: 'ingreso', concept: 'Cobro', amount: 25 },
      {
        id: 'sale',
        date: '2026-10-03',
        type: 'ingreso',
        concept: 'Venta V-1',
        amount: 30,
        source: 'venta',
      },
      { id: '', date: '', type: 'ingreso', concept: '', amount: 0 },
      'no-es-movimiento',
    ]);

    expect(records).toHaveLength(4);
    expect(records[0]).toEqual(RECORD);
    expect(records[1]).toMatchObject({
      concept: 'Pago de luz',
      type: 'egreso',
      category: 'gasto',
      status: 'confirmado',
      account: 'caja-general',
      source: 'manual',
    });
    expect(records[2]).toMatchObject({
      concept: 'Cobro',
      category: 'venta',
      paymentMethod: 'efectivo',
      source: 'manual',
    });
    expect(records[3].source).toBe('venta');
  });

  it('debe crear movimientos válidos y rechazar inválidos', () => {
    const created = createCashMovement(
      {
        date: '2026-10-29',
        type: 'ingreso',
        concept: '  Venta  ',
        category: 'venta',
        amount: 120.5,
        paymentMethod: 'efectivo',
        account: 'caja-general',
        reference: '  REF-1  ',
        counterpart: '  Ana  ',
        notes: '  Nota  ',
      },
      new Date('2026-10-29T12:00:00.000Z'),
    );

    expect(created).toMatchObject({
      concept: 'Venta',
      amount: 120.5,
      reference: 'REF-1',
      counterpart: 'Ana',
      notes: 'Nota',
      status: 'confirmado',
      account: 'caja-general',
      source: 'manual',
    });
    expect(created?.id).toMatch(/^cash-/);
    expect(
      createCashMovement({
        date: '2026-10-29',
        type: 'ingreso',
        concept: 'Ajuste',
        category: 'ajuste',
        amount: 10,
        paymentMethod: 'efectivo',
        account: 'caja-general',
        reference: '',
        counterpart: '',
        notes: '',
      })?.source,
    ).toBe('ajuste');
    expect(
      createCashMovement({
        date: '2026-10-29',
        type: 'ingreso',
        concept: 'Venta',
        category: 'venta',
        amount: 10,
        paymentMethod: 'efectivo',
        account: 'caja-general',
        source: 'venta',
        reference: '',
        counterpart: '',
        notes: '',
      })?.source,
    ).toBe('venta');
    expect(
      createCashMovement({
        date: '2026-10-29',
        type: 'ingreso',
        concept: '',
        category: 'venta',
        amount: 0,
        paymentMethod: 'efectivo',
        account: 'caja-general',
        reference: '',
        counterpart: '',
        notes: '',
      }),
    ).toBeNull();
    expect(
      createCashMovement({
        date: '',
        type: 'ingreso',
        concept: 'Venta',
        category: 'venta',
        amount: 10,
        paymentMethod: 'efectivo',
        account: 'otra-cuenta',
        reference: '',
        counterpart: '',
        notes: '',
      }),
    ).toMatchObject({ date: cashToday(), account: 'caja-general' });
  });

  it('debe actualizar un movimiento conservando id, estado, origen y cuenta desconocida', () => {
    const updated = updateCashMovement(RECORD, {
      date: '2026-10-30',
      type: 'egreso',
      concept: 'Pago actualizado',
      category: 'pago-proveedor',
      amount: 250,
      paymentMethod: 'transferencia',
      account: 'desconocida',
      source: 'manual',
      reference: 'TRF-9',
      counterpart: 'Luis',
      notes: 'Pagado',
    });

    expect(updated).toMatchObject({
      id: 'cash-1',
      status: 'confirmado',
      concept: 'Pago actualizado',
      type: 'egreso',
      amount: 250,
      account: 'caja-general',
      category: 'pago-proveedor',
      source: 'venta',
    });
    expect(
      updateCashMovement(RECORD, {
        date: '2026-10-30',
        type: 'egreso',
        concept: '',
        category: 'gasto',
        amount: 0,
        paymentMethod: 'efectivo',
        account: 'caja-general',
        reference: '',
        counterpart: '',
        notes: '',
      }),
    ).toBeNull();
  });

  it('debe generar id alternativo sin crypto.randomUUID', () => {
    const original = globalThis.crypto;
    vi.stubGlobal('crypto', {});
    try {
      const record = createCashMovement({
        date: '2026-10-29',
        type: 'ingreso',
        concept: 'Cobro',
        category: 'cobro',
        amount: 1,
        paymentMethod: 'efectivo',
        account: 'caja-general',
        reference: '',
        counterpart: '',
        notes: '',
      });
      expect(record?.id).toMatch(/^cash-/);
    } finally {
      vi.stubGlobal('crypto', original);
    }
  });

  it('debe filtrar por período, rango personalizado, tipo, estado, categoría, método y búsqueda', () => {
    const now = new Date(2026, 9, 29);
    const records: CashMovement[] = [
      { ...RECORD, id: 'today', date: '2026-10-29' },
      { ...RECORD, id: 'week', date: '2026-10-27' },
      { ...RECORD, id: 'month', date: '2026-10-15', type: 'egreso', category: 'gasto' },
      { ...RECORD, id: 'previous', date: '2026-09-15', paymentMethod: 'tarjeta' },
      { ...RECORD, id: 'year', date: '2026-03-01', status: 'pendiente' },
      { ...RECORD, id: 'old', date: '2025-12-31', category: 'transferencia' },
    ];

    expect(
      filterCashMovements(records, { ...BASE_FILTERS, period: 'today' }, now).map((r) => r.id),
    ).toEqual(['today']);
    expect(
      filterCashMovements(records, { ...BASE_FILTERS, period: 'week' }, now).map((r) => r.id),
    ).toEqual(['today', 'week']);
    expect(
      filterCashMovements(records, { ...BASE_FILTERS, period: 'month' }, now).map((r) => r.id),
    ).toEqual(['today', 'week', 'month']);
    expect(
      filterCashMovements(records, { ...BASE_FILTERS, period: 'year' }, now).map((r) => r.id),
    ).toEqual(['today', 'week', 'month', 'previous', 'year']);
    expect(
      filterCashMovements(
        records,
        { ...BASE_FILTERS, period: 'custom', dateFrom: '2026-10-15', dateTo: '2026-10-27' },
        now,
      ).map((r) => r.id),
    ).toEqual(['week', 'month']);
    expect(
      filterCashMovements(records, { ...BASE_FILTERS, type: 'egreso' }, now).map((r) => r.id),
    ).toEqual(['month']);
    expect(
      filterCashMovements(records, { ...BASE_FILTERS, status: 'pendiente' }, now).map((r) => r.id),
    ).toEqual(['year']);
    expect(
      filterCashMovements(records, { ...BASE_FILTERS, category: 'gasto' }, now).map((r) => r.id),
    ).toEqual(['month']);
    expect(
      filterCashMovements(records, { ...BASE_FILTERS, paymentMethod: 'tarjeta' }, now).map(
        (r) => r.id,
      ),
    ).toEqual(['previous']);
    expect(filterCashMovements(records, { ...BASE_FILTERS, search: 'ana' }, now)).toHaveLength(5);
    expect(filterCashMovements(records, { ...BASE_FILTERS, search: 'rec-1' }, now)).toHaveLength(5);
    expect(
      filterCashMovements(records, { ...BASE_FILTERS, search: 'inexistente' }, now),
    ).toHaveLength(0);
  });

  it('debe calcular los KPIs de caja, otros movimientos, caja chica y bancos', () => {
    const now = new Date(2026, 9, 29);
    const summary = computeCashSummary(
      [
        { ...RECORD, id: 'in', date: '2026-10-29', amount: 100 },
        {
          ...RECORD,
          id: 'manual-in',
          date: '2026-10-29',
          amount: 200,
          source: 'manual',
        },
        {
          ...RECORD,
          id: 'out',
          date: '2026-10-29',
          type: 'egreso',
          amount: 40,
          source: 'manual',
        },
        { ...RECORD, id: 'bank', date: '2026-10-15', account: 'bac', amount: 500 },
        { ...RECORD, id: 'pending', date: '2026-10-10', amount: 200, status: 'pendiente' },
        {
          ...RECORD,
          id: 'annulled',
          date: '2026-10-10',
          type: 'egreso',
          amount: 30,
          status: 'anulado',
        },
        {
          ...RECORD,
          id: 'petty',
          date: '2026-10-12',
          type: 'egreso',
          category: 'caja-chica',
          amount: 50,
          source: 'manual',
        },
        { ...RECORD, id: 'old', date: '2026-09-20', account: 'lafise', amount: 300 },
      ],
      now,
    );

    expect(summary).toEqual({
      available: 210,
      incomeMonth: 800,
      incomeCountMonth: 3,
      expenseMonth: 90,
      expenseCountMonth: 2,
      movementsMonth: 5,
      otherIncome: 200,
      otherExpense: 90,
      pettyCash: 1950,
      banks: 800,
    });
  });

  it('debe agrupar por método de pago, día y cuenta bancaria', () => {
    const now = new Date(2026, 9, 29);
    const records: CashMovement[] = [
      { ...RECORD, id: 'cash', date: '2026-10-29', amount: 100, paymentMethod: 'efectivo' },
      {
        ...RECORD,
        id: 'cash-out',
        date: '2026-10-29',
        type: 'egreso',
        amount: 40,
        paymentMethod: 'efectivo',
      },
      {
        ...RECORD,
        id: 'bank',
        date: '2026-10-15',
        account: 'bac',
        amount: 500,
        paymentMethod: 'transferencia',
      },
      {
        ...RECORD,
        id: 'bank-out',
        date: '2026-10-15',
        account: 'bac',
        type: 'egreso',
        amount: 100,
        paymentMethod: 'transferencia',
      },
      {
        ...RECORD,
        id: 'pending',
        date: '2026-10-10',
        amount: 900,
        status: 'pendiente',
      },
    ];

    const payments = computePaymentBreakdown(records);
    expect(payments.find((payment) => payment.method === 'efectivo')).toEqual({
      method: 'efectivo',
      label: 'Efectivo',
      income: 100,
      expense: 40,
      net: 60,
      count: 2,
    });
    expect(payments.find((payment) => payment.method === 'transferencia')).toMatchObject({
      income: 500,
      expense: 100,
      net: 400,
      count: 2,
    });
    expect(payments).toHaveLength(5);

    expect(computeDailyClosures(records, now)).toEqual([
      {
        date: '2026-10-29',
        income: 100,
        expense: 40,
        net: 60,
        count: 2,
        status: 'abierto',
      },
      {
        date: '2026-10-15',
        income: 500,
        expense: 100,
        net: 400,
        count: 2,
        status: 'cerrado',
      },
    ]);

    expect(computeBankAccounts(records)).toEqual([
      {
        account: 'bac',
        label: 'BAC Credomatic',
        income: 500,
        expense: 100,
        balance: 400,
        count: 2,
      },
      { account: 'lafise', label: 'Banco LAFISE', income: 0, expense: 0, balance: 0, count: 0 },
      { account: 'banpro', label: 'Banpro', income: 0, expense: 0, balance: 0, count: 0 },
    ]);
  });

  it('debe calcular el saldo acumulado solo con movimientos confirmados', () => {
    const records: CashMovement[] = [
      { ...RECORD, id: 'later', date: '2026-10-29', createdAt: '2026-10-29T15:00:00.000Z' },
      {
        ...RECORD,
        id: 'first',
        date: '2026-10-28',
        createdAt: '2026-10-28T12:00:00.000Z',
        amount: 200,
      },
      {
        ...RECORD,
        id: 'pending',
        date: '2026-10-29',
        createdAt: '2026-10-29T13:00:00.000Z',
        amount: 500,
        status: 'pendiente',
      },
      {
        ...RECORD,
        id: 'last',
        date: '2026-10-30',
        createdAt: '2026-10-30T12:00:00.000Z',
        type: 'egreso',
        amount: 50,
      },
    ];

    const balances = computeMovementBalances(records);
    expect(balances.get('first')).toBe(200);
    expect(balances.get('pending')).toBe(200);
    expect(balances.get('later')).toBe(300);
    expect(balances.get('last')).toBe(250);
    expect(toMovementRows([records[0]], balances)[0]).toEqual({
      record: records[0],
      balance: 300,
    });
    expect(toMovementRows([records[0]], new Map())[0].balance).toBe(0);
  });
});
