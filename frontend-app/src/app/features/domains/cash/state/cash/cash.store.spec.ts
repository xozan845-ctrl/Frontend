import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NotificationService } from '../../../../../core/services/notification/notification.service';
import { AuthStore } from '../../../../applications/auth/public-api';
import {
  cashStorageKey,
  legacyCashStorageKey,
  type CreateCashMovementPayload,
} from '../../public-api';
import { CashStore } from './cash.store';

function localDate(daysFromToday = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function payload(overrides: Partial<CreateCashMovementPayload> = {}): CreateCashMovementPayload {
  return {
    date: localDate(),
    type: 'ingreso',
    concept: 'Venta de contado',
    category: 'venta',
    amount: 100,
    paymentMethod: 'efectivo',
    account: 'caja-general',
    reference: '',
    counterpart: '',
    notes: '',
    ...overrides,
  };
}

describe('CashStore', () => {
  const tenantId = signal<string | null>('tenant-1');
  const authStore = {
    user: computed(() => ({ id: 'u-1', name: 'Karla López', tenantId: tenantId() })),
  };
  const notification = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };

  const setup = () => {
    TestBed.configureTestingModule({
      providers: [
        CashStore,
        { provide: AuthStore, useValue: authStore },
        { provide: NotificationService, useValue: notification },
      ],
    });
    return TestBed.inject(CashStore);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    tenantId.set('tenant-1');
    TestBed.resetTestingModule();
  });

  afterEach(() => localStorage.clear());

  it('debe registrar, actualizar, confirmar, anular y eliminar movimientos', async () => {
    const store = setup();

    expect(store.addMovement(payload()).ok).toBe(true);
    expect(store.records()).toHaveLength(1);
    expect(store.records()[0].source).toBe('manual');
    expect(notification.showSuccess).toHaveBeenCalledWith('Movimiento registrado.');
    const id = store.records()[0].id;

    expect(
      store.updateMovement(id, payload({ concept: 'Venta actualizada', amount: 200 })).ok,
    ).toBe(true);
    expect(store.records()[0]).toMatchObject({ concept: 'Venta actualizada', amount: 200 });

    store.confirmMovement(id);
    expect(store.records()[0].status).toBe('confirmado');
    store.annulMovement(id);
    expect(store.records()[0].status).toBe('anulado');
    store.removeMovement(id);
    expect(store.records()).toEqual([]);

    await vi.waitFor(() =>
      expect(JSON.parse(localStorage.getItem(cashStorageKey('tenant-1')) ?? '[]')).toEqual([]),
    );
  });

  it('debe exponer KPIs, etiquetas y saludo', () => {
    const store = setup();

    expect(store.summary()).toMatchObject({
      available: 0,
      incomeMonth: 0,
      incomeCountMonth: 0,
      expenseMonth: 0,
      expenseCountMonth: 0,
      otherIncome: 0,
      otherExpense: 0,
    });
    expect(store.categoryLabels()['venta']).toBe('Venta');
    expect(store.paymentLabels()['efectivo']).toBe('Efectivo');
    expect(store.statusLabels()['confirmado']).toBe('Confirmado');
    expect(store.typeLabels()['ingreso']).toBe('Ingreso');
    expect(store.accountLabels()['bac']).toBe('BAC Credomatic');
    expect(store.sourceLabels()['venta']).toBe('Ventas');
    expect(store.sourceLocks()['venta']).toBe(true);
    expect(store.sourceLocks()['manual']).toBe(false);
    expect(store.greeting()).toContain('Karla');
    expect(store.today()).toBe(localDate());
  });

  it('debe filtrar por tab, período, rango, tipo, estado, categoría, método y búsqueda', () => {
    const store = setup();
    store.addMovement(payload({ concept: 'Venta', category: 'venta' }));
    store.addMovement(
      payload({ concept: 'Compra', category: 'gasto', type: 'egreso', paymentMethod: 'tarjeta' }),
    );
    store.addMovement(payload({ concept: 'Caja chica', category: 'caja-chica', type: 'egreso' }));
    store.addMovement(
      payload({ concept: 'Transferencia', category: 'transferencia', account: 'bac' }),
    );

    store.setTab('petty-cash');
    expect(store.filteredCount()).toBe(1);
    store.setTab('transfers');
    expect(store.filteredCount()).toBe(1);
    store.setTab('banks');
    expect(store.filteredCount()).toBe(1);
    store.setTab('payment-methods');
    expect(store.filteredCount()).toBe(4);
    store.setTab('movements');

    store.setPeriod('today');
    expect(store.filteredCount()).toBe(4);
    store.setPeriod('year');
    expect(store.filteredCount()).toBe(4);
    store.setPeriod('custom');
    store.setDateRange(localDate(-40), localDate(-40));
    expect(store.filteredCount()).toBe(0);
    store.setDateRange(localDate(), localDate());
    expect(store.filteredCount()).toBe(4);
    store.setPeriod('month');

    store.setType('egreso');
    expect(store.filteredCount()).toBe(2);
    store.setType('all');
    store.setStatus('confirmado');
    expect(store.filteredCount()).toBe(4);
    store.setStatus('anulado');
    expect(store.filteredCount()).toBe(0);
    store.setStatus('all');
    store.setCategory('venta');
    expect(store.filteredCount()).toBe(1);
    store.setCategory('all');
    store.setPaymentMethod('tarjeta');
    expect(store.filteredCount()).toBe(1);
    store.setPaymentMethod('all');
    store.setSearch('caja chica');
    expect(store.filteredCount()).toBe(1);

    store.resetFilters();
    expect(store.filteredCount()).toBe(4);
    expect(store.period()).toBe('month');
    expect(store.search()).toBe('');
    expect(store.dateFrom()).toBe('');
    expect(store.dateTo()).toBe('');
  });

  it('debe paginar los movimientos filtrados en páginas de 15', () => {
    const store = setup();
    for (let index = 0; index < 16; index += 1) {
      store.addMovement(payload({ concept: `Movimiento ${index}` }));
    }

    expect(store.pagedRecords()).toHaveLength(15);
    expect(store.pageCount()).toBe(2);
    store.nextPage();
    expect(store.currentPage()).toBe(2);
    expect(store.pagedRecords()).toHaveLength(1);
    store.previousPage();
    expect(store.currentPage()).toBe(1);
  });

  it('debe derivar métodos de pago, cierres, bancos y saldos', () => {
    const store = setup();
    store.addMovement(payload({ concept: 'Venta', amount: 100 }));
    store.addMovement(
      payload({ concept: 'Compra', type: 'egreso', amount: 30, paymentMethod: 'tarjeta' }),
    );
    store.addMovement(
      payload({ concept: 'Banco', amount: 500, account: 'bac', paymentMethod: 'transferencia' }),
    );

    expect(store.paymentBreakdown().find((item) => item.method === 'efectivo')).toMatchObject({
      income: 100,
      expense: 0,
      net: 100,
      count: 1,
    });
    expect(store.dailyClosures()).toHaveLength(1);
    expect(store.dailyClosures()[0]).toMatchObject({ income: 600, expense: 30, net: 570 });
    expect(store.bankAccounts().find((account) => account.account === 'bac')).toMatchObject({
      balance: 500,
      count: 1,
    });
    expect(store.movementRows()).toHaveLength(3);
    expect(store.movementRows()[0].balance).toBeTypeOf('number');
    expect(store.summary()).toMatchObject({
      available: 70,
      incomeMonth: 600,
      incomeCountMonth: 2,
      expenseMonth: 30,
      expenseCountMonth: 1,
      otherIncome: 600,
      otherExpense: 30,
    });
  });

  it('debe migrar los movimientos del store anterior', () => {
    localStorage.setItem(
      legacyCashStorageKey('tenant-1'),
      JSON.stringify([
        {
          id: 'legacy-1',
          date: localDate(),
          type: 'egreso',
          concept: 'Pago de luz',
          amount: 50,
          paymentMethod: 'transferencia',
        },
      ]),
    );
    const store = setup();

    expect(store.records()).toHaveLength(1);
    expect(store.records()[0]).toMatchObject({
      concept: 'Pago de luz',
      category: 'gasto',
      source: 'manual',
    });
  });

  it('debe rechazar movimientos inválidos y respetar el límite', () => {
    const store = setup();
    expect(store.addMovement(payload({ concept: '', amount: 0 }))).toEqual({
      ok: false,
      message: 'Revisa concepto, tipo, categoría e importe.',
    });
    expect(store.updateMovement('missing', payload())).toEqual({
      ok: false,
      message: 'El movimiento no existe.',
    });

    localStorage.setItem(
      cashStorageKey('tenant-1'),
      JSON.stringify(
        Array.from({ length: 1000 }, (_, index) => ({
          id: `cash-${index}`,
          date: localDate(),
          type: 'ingreso',
          concept: `Movimiento ${index}`,
          amount: 1,
          paymentMethod: 'efectivo',
        })),
      ),
    );
    TestBed.resetTestingModule();
    const fullStore = setup();
    expect(fullStore.records()).toHaveLength(1000);
    expect(fullStore.addMovement(payload())).toEqual({
      ok: false,
      message: 'Alcanzaste el límite de movimientos.',
    });
  });

  it('debe ignorar storage corrupto', () => {
    localStorage.setItem(cashStorageKey('tenant-1'), '{');
    const store = setup();

    expect(store.records()).toEqual([]);
    expect(store.hasRecords()).toBe(false);
  });
});
