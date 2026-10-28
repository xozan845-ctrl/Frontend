import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { AuthStore } from '../../../../applications/auth/public-api';
import {
  financeStorageKey,
  type CashMovement,
  type ExpenseRecord,
  type PurchaseRecord,
} from '../../public-api';
import { FinanceStore } from './finance.store';

function localDate(daysAgo = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function purchase(overrides: Partial<PurchaseRecord> = {}): PurchaseRecord {
  return {
    id: 'purchase-1',
    date: localDate(),
    supplier: 'Proveedor',
    concept: 'Compra',
    amount: 100,
    status: 'pendiente',
    ...overrides,
  };
}

function expense(overrides: Partial<ExpenseRecord> = {}): ExpenseRecord {
  return {
    id: 'expense-1',
    date: localDate(),
    category: 'operativo',
    description: 'Gasto',
    amount: 50,
    paymentMethod: 'efectivo',
    ...overrides,
  };
}

function cash(overrides: Partial<CashMovement> = {}): CashMovement {
  return {
    id: 'cash-1',
    date: localDate(),
    type: 'ingreso',
    concept: 'Pago',
    amount: 200,
    paymentMethod: 'efectivo',
    ...overrides,
  };
}

describe('FinanceStore', () => {
  const tenantId = signal<string | null>('tenant-1');
  const authStore = {
    user: computed(() => ({ id: 'u-1', tenantId: tenantId() })),
  };
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };

  const setup = () => {
    TestBed.configureTestingModule({
      providers: [
        FinanceStore,
        { provide: AuthStore, useValue: authStore },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(FinanceStore);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    tenantId.set('tenant-1');
    TestBed.resetTestingModule();
  });

  afterEach(() => localStorage.clear());

  it('debe registrar compras, gastos y movimientos con sus totales', async () => {
    const store = setup();

    expect(
      store.addPurchase({
        date: localDate(),
        supplier: 'Proveedor',
        concept: 'Compra',
        amount: 100,
        status: 'pendiente',
      }).ok,
    ).toBe(true);
    expect(
      store.addExpense({
        date: localDate(),
        category: 'servicios',
        description: 'Luz',
        amount: 50,
        paymentMethod: 'transferencia',
      }).ok,
    ).toBe(true);
    expect(
      store.addCashMovement({
        date: localDate(),
        type: 'ingreso',
        concept: 'Cobro',
        amount: 200,
        paymentMethod: 'efectivo',
      }).ok,
    ).toBe(true);

    expect(store.purchases()).toHaveLength(1);
    expect(store.expenses()).toHaveLength(1);
    expect(store.cash()).toHaveLength(1);
    expect(store.summary()).toMatchObject({
      purchasesTotal: 100,
      purchasesPending: 100,
      expensesTotal: 50,
      cashBalance: 200,
    });
    expect(store.hasPurchases()).toBe(true);
    expect(store.hasExpenses()).toBe(true);
    expect(store.hasCash()).toBe(true);
    expect(notification.showSuccess).toHaveBeenCalledWith('Compra registrada.');
    expect(notification.showSuccess).toHaveBeenCalledWith('Gasto registrado.');
    expect(notification.showSuccess).toHaveBeenCalledWith('Movimiento de caja registrado.');

    await vi.waitFor(() =>
      expect(
        JSON.parse(localStorage.getItem(financeStorageKey('purchases', 'tenant-1')) ?? '[]'),
      ).toHaveLength(1),
    );
    expect(
      JSON.parse(localStorage.getItem(financeStorageKey('expenses', 'tenant-1')) ?? '[]'),
    ).toHaveLength(1);
    expect(
      JSON.parse(localStorage.getItem(financeStorageKey('cash', 'tenant-1')) ?? '[]'),
    ).toHaveLength(1);
  });

  it('debe rechazar payloads inválidos sin tocar las listas', () => {
    const store = setup();

    expect(
      store.addPurchase({
        date: '',
        supplier: '',
        concept: '',
        amount: 0,
        status: 'pagada',
      }),
    ).toEqual({ ok: false, message: 'Revisa fecha, proveedor, concepto e importe de la compra.' });
    expect(
      store.addExpense({
        date: '',
        category: 'operativo',
        description: '',
        amount: 0,
        paymentMethod: 'efectivo',
      }),
    ).toEqual({ ok: false, message: 'Revisa fecha, descripción e importe del gasto.' });
    expect(
      store.addCashMovement({
        date: '',
        type: 'ingreso',
        concept: '',
        amount: 0,
        paymentMethod: 'efectivo',
      }),
    ).toEqual({ ok: false, message: 'Revisa fecha, concepto e importe del movimiento.' });

    expect(store.purchases()).toEqual([]);
    expect(store.expenses()).toEqual([]);
    expect(store.cash()).toEqual([]);
    expect(notification.showSuccess).not.toHaveBeenCalled();
  });

  it('debe respetar el límite de registros por colección', () => {
    const purchases = Array.from({ length: 500 }, (_, index) =>
      purchase({ id: `purchase-${index}` }),
    );
    localStorage.setItem(financeStorageKey('purchases', 'tenant-1'), JSON.stringify(purchases));
    localStorage.setItem(
      financeStorageKey('expenses', 'tenant-1'),
      JSON.stringify(
        Array.from({ length: 500 }, (_, index) => expense({ id: `expense-${index}` })),
      ),
    );
    localStorage.setItem(
      financeStorageKey('cash', 'tenant-1'),
      JSON.stringify(Array.from({ length: 500 }, (_, index) => cash({ id: `cash-${index}` }))),
    );
    const store = setup();

    expect(
      store.addPurchase({
        date: localDate(),
        supplier: 'Proveedor',
        concept: 'Compra',
        amount: 1,
        status: 'pagada',
      }),
    ).toEqual({ ok: false, message: 'Alcanzaste el límite de compras locales.' });
    expect(
      store.addExpense({
        date: localDate(),
        category: 'operativo',
        description: 'Gasto',
        amount: 1,
        paymentMethod: 'efectivo',
      }),
    ).toEqual({ ok: false, message: 'Alcanzaste el límite de gastos locales.' });
    expect(
      store.addCashMovement({
        date: localDate(),
        type: 'ingreso',
        concept: 'Cobro',
        amount: 1,
        paymentMethod: 'efectivo',
      }),
    ).toEqual({ ok: false, message: 'Alcanzaste el límite de movimientos de caja.' });
  });

  it('debe eliminar registros de cada colección', () => {
    localStorage.setItem(financeStorageKey('purchases', 'tenant-1'), JSON.stringify([purchase()]));
    localStorage.setItem(financeStorageKey('expenses', 'tenant-1'), JSON.stringify([expense()]));
    localStorage.setItem(financeStorageKey('cash', 'tenant-1'), JSON.stringify([cash()]));
    const store = setup();

    store.removePurchase('purchase-1');
    store.removeExpense('expense-1');
    store.removeCashMovement('cash-1');

    expect(store.purchases()).toEqual([]);
    expect(store.expenses()).toEqual([]);
    expect(store.cash()).toEqual([]);
    expect(notification.showSuccess).toHaveBeenCalledWith('Compra eliminada.');
    expect(notification.showSuccess).toHaveBeenCalledWith('Gasto eliminado.');
    expect(notification.showSuccess).toHaveBeenCalledWith('Movimiento eliminado.');
  });

  it('debe cargar solo los registros del tenant activo e ignorar storage corrupto', () => {
    localStorage.setItem(
      financeStorageKey('purchases', 'tenant-1'),
      JSON.stringify([purchase({ id: 'tenant-1' })]),
    );
    localStorage.setItem(
      financeStorageKey('purchases', 'tenant-2'),
      JSON.stringify([purchase({ id: 'tenant-2' })]),
    );
    localStorage.setItem(financeStorageKey('expenses', 'tenant-1'), '{');

    const store = setup();

    expect(store.purchases().map((record) => record.id)).toEqual(['tenant-1']);
    expect(store.expenses()).toEqual([]);
  });
});
