import {
  computeFinanceSummary,
  createCashMovement,
  createExpenseRecord,
  createPurchaseRecord,
  sanitizeCashMovements,
  sanitizeExpenseRecords,
  sanitizePurchaseRecords,
} from './finance.adapter';
import type { CashMovement, ExpenseRecord, PurchaseRecord } from '../../models/finance.model';

const PURCHASE: PurchaseRecord = {
  id: 'purchase-1',
  date: '2026-10-20',
  supplier: 'Distribuidora Central',
  concept: 'Reposición',
  amount: 1000,
  status: 'pendiente',
};

const EXPENSE: ExpenseRecord = {
  id: 'expense-1',
  date: '2026-10-21',
  category: 'servicios',
  description: 'Energía eléctrica',
  amount: 250,
  paymentMethod: 'transferencia',
};

const CASH: CashMovement = {
  id: 'cash-1',
  date: '2026-10-22',
  type: 'ingreso',
  concept: 'Pago de cliente',
  amount: 400,
  paymentMethod: 'efectivo',
};

describe('finance.adapter', () => {
  it('debe normalizar compras válidas y descartar inválidas', () => {
    const records = sanitizePurchaseRecords([
      PURCHASE,
      { ...PURCHASE, id: '', amount: 0 },
      { ...PURCHASE, status: 'otro' },
      { ...PURCHASE, date: '20/10/2026' },
      'no-es-registro',
    ]);

    expect(records).toEqual([PURCHASE]);
  });

  it('debe normalizar gastos y caja, y tolerar entradas que no son listas', () => {
    expect(sanitizeExpenseRecords([EXPENSE, { ...EXPENSE, category: 'otra' }])).toEqual([EXPENSE]);
    expect(sanitizeCashMovements([CASH, { ...CASH, type: 'otro' }])).toEqual([CASH]);
    expect(sanitizePurchaseRecords(null)).toEqual([]);
    expect(sanitizeExpenseRecords({})).toEqual([]);
    expect(sanitizeCashMovements('x')).toEqual([]);
  });

  it('debe respetar el límite de registros persistidos', () => {
    const records = Array.from({ length: 505 }, (_, index) => ({
      ...PURCHASE,
      id: `purchase-${index}`,
    }));

    expect(sanitizePurchaseRecords(records)).toHaveLength(500);
  });

  it('debe crear registros válidos y rechazar payloads incompletos', () => {
    expect(
      createPurchaseRecord({
        date: '2026-10-20',
        supplier: 'Proveedor',
        concept: 'Compra',
        amount: 10,
        status: 'pagada',
      }),
    ).toMatchObject({ supplier: 'Proveedor', amount: 10, status: 'pagada' });
    expect(
      createExpenseRecord({
        date: '2026-10-20',
        category: 'operativo',
        description: 'Gasto',
        amount: '25,50' as unknown as number,
        paymentMethod: 'tarjeta',
      }),
    ).toMatchObject({ description: 'Gasto', amount: 25.5 });
    expect(
      createCashMovement({
        date: '2026-10-20',
        type: 'egreso',
        concept: 'Pago',
        amount: 5,
        paymentMethod: 'credito',
      }),
    ).toMatchObject({ type: 'egreso', amount: 5 });

    expect(
      createPurchaseRecord({
        date: '2026-10-20',
        supplier: '',
        concept: '',
        amount: 0,
        status: 'pagada',
      }),
    ).toBeNull();
    expect(
      createExpenseRecord({
        date: '2026-10-20',
        category: 'operativo',
        description: '',
        amount: 0,
        paymentMethod: 'tarjeta',
      }),
    ).toBeNull();
    expect(
      createCashMovement({
        date: '2026-10-20',
        type: 'ingreso',
        concept: '',
        amount: 0,
        paymentMethod: 'efectivo',
      }),
    ).toBeNull();
  });

  it('debe calcular totales del mes, pendientes y saldo de caja', () => {
    const now = new Date('2026-10-27T12:00:00');
    const previous: PurchaseRecord = { ...PURCHASE, id: 'purchase-2', date: '2026-09-01' };
    const paid: PurchaseRecord = {
      ...PURCHASE,
      id: 'purchase-3',
      status: 'pagada',
      amount: 200,
    };
    const summary = computeFinanceSummary(
      [PURCHASE, previous, paid],
      [EXPENSE, { ...EXPENSE, id: 'expense-2', date: '2026-09-02', amount: 50 }],
      [CASH, { ...CASH, id: 'cash-2', type: 'egreso', amount: 100 }],
      now,
    );

    expect(summary).toEqual({
      purchasesTotal: 2200,
      purchasesPending: 2000,
      purchasesMonth: 1200,
      expensesTotal: 300,
      expensesMonth: 250,
      cashIncome: 400,
      cashExpense: 100,
      cashBalance: 300,
    });
  });
});
